import './App.css'

const sections = [
  { key: 'tools', label: 'Tools', description: '真正进入日常使用的工具与软件。' },
  { key: 'projects', label: 'Projects', description: '亲手制作、值得展示和继续维护的作品。' },
  { key: 'library', label: 'Library', description: '蓝图、脚本、流程图与其他可复用资产。' },
]

function App() {
  return (
    <main className="shell">
      <p className="eyebrow">KLASMA / PERSONAL COLLECTION</p>
      <section className="intro">
        <h1>拾起值得留下的碎片。</h1>
        <p>一个正在搭建中的个人资源库，保存我真正使用过、制作过和愿意分享的东西。</p>
      </section>
      <section className="collection-grid" aria-label="Klasma collections">
        {sections.map((section, index) => (
          <article className={`collection-card card-${index + 1}`} key={section.key}>
            <span className="card-index">0{index + 1}</span>
            <h2>{section.label}</h2>
            <p>{section.description}</p>
            <span className="card-arrow" aria-hidden="true">↗</span>
          </article>
        ))}
      </section>
      <footer>Foundation phase · API and database are coming online.</footer>
    </main>
  )
}

export default App
