"""准备独立字体评审页的本地字体；不安装系统字体，不修改应用依赖。"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / ".font-cache"
CACHE.mkdir(exist_ok=True)
CORPUS = json.dumps(json.loads((ROOT / "typography-sample.json").read_text(encoding="utf-8")), ensure_ascii=False)
# 主题稿、布局原型与字体对照共用缓存，将新增文案纳入字形覆盖。
for name in ("theme.html", "theme.js", "index.html", "mockup.js"):
    source = ROOT / name
    if source.exists():
        CORPUS += source.read_text(encoding="utf-8")
TEXT = "".join(sorted(set(CORPUS)))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"


def fetch(url):
    with urlopen(Request(url, headers={"User-Agent": UA}), timeout=30) as response:
        return response.read()


def save(filename, content):
    (CACHE / filename).write_bytes(content)
    return sha256(content).hexdigest()


def intersects(ranges):
    for interval in ranges.split(","):
        bounds = interval.strip().upper().removeprefix("U+").split("-")
        lower, upper = int(bounds[0], 16), int(bounds[-1], 16)
        if any(lower <= ord(char) <= upper for char in TEXT):
            return True
    return False


def misans():
    url = "https://font.sec.miui.com/font/css?family=MiSans:400,500,600,700:Chinese_Simplify,Latin&display=swap"
    css = fetch(url).decode("utf-8")
    faces, files = [], []
    for block in re.findall(r"@font-face\s*\{([^}]+)\}", css):
        ranges = re.search(r"unicode-range:\s*([^;]+)", block)
        if ranges and not intersects(ranges.group(1)):
            continue
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        source = re.search(r'url\("([^\"]+\.woff2)"\)', block).group(1)
        filename = f"misans-{weight}-{source.rsplit('/', 1)[-1]}"
        digest = save(filename, fetch(source))
        files.append({"file": filename, "url": source, "sha256": digest})
        faces.append(f'@font-face {{ font-family: "MiSans"; font-style: normal; font-weight: {weight}; font-display: swap; src: url("{filename}") format("woff2"); unicode-range: {ranges.group(1)}; }}')
    # 小米提供的切片文件保持原样，仅重写 CSS 中的资源位置。
    return "\n".join(faces), {"family": "MiSans", "source": url, "files": files}


def google_font(family, folder, weights):
    url = f"https://fonts.googleapis.com/css2?family={quote(family)}:wght@{weights}&display=swap&text={quote(TEXT)}"
    css = fetch(url).decode("utf-8")
    files = []
    for number, source in enumerate(dict.fromkeys(re.findall(r"url\(([^)]+)\)", css))):
        source = source.strip("\"'")
        content = fetch(source)
        suffix = "woff2" if content[:4] == b"wOF2" else "ttf"
        filename = f"{folder}-{number}.{suffix}"
        digest = save(filename, content)
        css = css.replace(source, filename)
        files.append({"file": filename, "url": source, "sha256": digest})
    license_url = f"https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/OFL.txt"
    save(f"{folder}-OFL.txt", fetch(license_url))
    return css, {"family": family, "source": url, "license": license_url, "files": files}


def fangsong():
    # 仅使用作者提供的 v0.212 原始字体，评审时明确标注测试版本。
    asset = "https://github.com/TrionesType/zhuque/releases/download/v0.212/ZhuqueFangsong-v0.212.zip"
    archive_path = CACHE / "ZhuqueFangsong-v0.212.zip"
    if not archive_path.exists():
        subprocess.run(["gh", "release", "download", "v0.212", "--repo", "TrionesType/zhuque", "--pattern", archive_path.name, "--dir", str(CACHE)], check=True)
    with zipfile.ZipFile(BytesIO(archive_path.read_bytes())) as archive:
        font_paths = [name for name in archive.namelist() if name.lower().endswith((".ttf", ".otf"))]
        selected = next((name for name in font_paths if "regular" in name.lower()), font_paths[0])
        filename = "zhuque-fangsong" + Path(selected).suffix
        digest = save(filename, archive.read(selected))
    license_url = "https://raw.githubusercontent.com/TrionesType/zhuque/main/LICENSE.txt"
    save("zhuque-LICENSE.txt", fetch(license_url))
    css = f'@font-face {{ font-family: "Zhuque Fangsong"; src: url("{filename}"); font-style: normal; font-weight: 400; font-display: swap; }}'
    return css, {"family": "Zhuque Fangsong", "version": "v0.212 (prerelease)", "source": asset, "license": license_url, "files": [{"file": filename, "archive_entry": selected, "sha256": digest}]}


if __name__ == "__main__":
    jobs = [
        ("MiSans", misans, ()),
        ("Manrope", google_font, ("Manrope", "manrope", "400;500;600;700")),
        ("Plus Jakarta Sans", google_font, ("Plus Jakarta Sans", "plusjakartasans", "400;500;600;700")),
        ("Outfit", google_font, ("Outfit", "outfit", "400;500;600;700")),
        ("Source Serif 4", google_font, ("Source Serif 4", "sourceserif4", "400;600")),
        ("Literata", google_font, ("Literata", "literata", "400;600")),
        ("Newsreader", google_font, ("Newsreader", "newsreader", "400;600")),
        ("Noto Serif SC", google_font, ("Noto Serif SC", "notoserifsc", "400;500;600")),
        ("Zhuque Fangsong", fangsong, ()),
    ]
    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        pending = [(name, pool.submit(function, *args)) for name, function, args in jobs]
        for name, future in pending:
            results.append(future.result())
            print(f"Ready: {name}", flush=True)
    (CACHE / "fonts.css").write_text("\n".join(css for css, _ in results), encoding="utf-8")
    (CACHE / "sources.json").write_text(json.dumps({"sample_sha256": sha256(CORPUS.encode()).hexdigest(), "fonts": [source for _, source in results]}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Font cache prepared: {sum(p.stat().st_size for p in CACHE.iterdir() if p.is_file()):,} bytes", flush=True)
