"""下载正式应用四种字体的完整官方切片，保留许可与来源，不按 mock 文案裁切。"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
import json
import re

ROOT = Path(__file__).resolve().parent.parent / "public" / "fonts"
ROOT.mkdir(parents=True, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"


def fetch(url):
    with urlopen(Request(url, headers={"User-Agent": UA}), timeout=45) as response:
        return response.read()


def download(source):
    filename = sha256(source.encode()).hexdigest()[:20] + ".woff2"
    target = ROOT / filename
    content = target.read_bytes() if target.exists() else fetch(source)
    if content[:4] != b"wOF2":
        raise ValueError("Expected WOFF2: " + source)
    target.write_bytes(content)
    return source, filename, sha256(content).hexdigest()


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, text):
        if text.strip():
            self.parts.append(text.strip())


if __name__ == "__main__":
    families = [
        ("MiSans", "https://font.sec.miui.com/font/css?family=MiSans:400,500,600,700:Chinese_Simplify,Latin&display=swap", "https://hyperos.mi.com/font/en/download/"),
        ("Manrope", "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap", "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt"),
        ("Source Serif 4", "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600&display=swap", "https://raw.githubusercontent.com/google/fonts/main/ofl/sourceserif4/OFL.txt"),
        ("Noto Serif SC", "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&display=swap", "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt"),
    ]
    styles = []
    manifest = []
    for family, stylesheet, license_url in families:
        original = fetch(stylesheet).decode("utf-8")
        blocks = []
        for block in re.findall(r"@font-face\s*\{([^}]+)\}", original):
            match = re.search(r'url\([\"\']?([^\"\')]+\.woff2)[\"\']?\)', block)
            if not match:
                raise ValueError("Missing WOFF2 in " + family)
            # 保留 unicode-range，原样下载字体，仅规范化 CSS 的 src。
            block = re.sub(r"src:\s*[^;]+;", f'src: url("{match[1]}") format("woff2");', block)
            blocks.append("@font-face {" + block + "}")
        css = "\n".join(blocks)
        urls = list(dict.fromkeys(re.findall(r'url\("([^\"]+)"\)', css)))
        with ThreadPoolExecutor(max_workers=8) as pool:
            files = list(pool.map(download, urls))
        for url, filename, _ in files:
            css = css.replace(url, filename)
        license_content = fetch(license_url)
        if family == "MiSans":
            parser = Text()
            parser.feed(license_content.decode("utf-8"))
            license_content = (license_url + "\n\n" + "\n".join(parser.parts)).encode("utf-8")
        license_file = family.lower().replace(" ", "-") + "-LICENSE.txt"
        (ROOT / license_file).write_bytes(license_content)
        manifest.append({"family": family, "stylesheet": stylesheet, "license": license_url, "licenseFile": license_file, "files": [{"url": url, "file": filename, "sha256": digest} for url, filename, digest in files]})
        styles.append(css)
        print(f"Ready: {family}, {len(files)} files", flush=True)
    (ROOT / "fonts.css").write_text("\n".join(styles), encoding="utf-8")
    (ROOT / "sources.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Production fonts ready.", flush=True)
