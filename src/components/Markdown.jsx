// Minimal, dependency-free markdown renderer for blog bodies.
// Handles: ## / ### headings, - / 1. lists, paragraphs, **bold**, [links](url).

function inline(text, keyPrefix) {
  const nodes = []
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/
  let rest = String(text)
  let k = 0
  let m
  while ((m = rest.match(re))) {
    if (m.index > 0) nodes.push(rest.slice(0, m.index))
    if (m[1]) {
      nodes.push(<strong key={`${keyPrefix}-${k++}`} className="font-semibold text-fg">{m[2]}</strong>)
    } else {
      nodes.push(
        <a
          key={`${keyPrefix}-${k++}`}
          href={m[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-soft underline underline-offset-2"
        >
          {m[4]}
        </a>,
      )
    }
    rest = rest.slice(m.index + m[0].length)
  }
  if (rest) nodes.push(rest)
  return nodes
}

export default function Markdown({ children }) {
  const blocks = String(children || '').trim().split(/\n{2,}/)

  return (
    <div className="space-y-4 leading-relaxed text-muted">
      {blocks.map((raw, i) => {
        const block = raw.trim()
        if (block.startsWith('### ')) {
          return <h3 key={i} className="pt-2 text-lg font-bold text-fg">{inline(block.slice(4), i)}</h3>
        }
        if (block.startsWith('## ')) {
          return <h2 key={i} className="pt-3 text-xl font-extrabold text-fg">{inline(block.slice(3), i)}</h2>
        }
        if (block.startsWith('# ')) {
          return <h2 key={i} className="pt-3 text-2xl font-extrabold text-fg">{inline(block.slice(2), i)}</h2>
        }
        const img = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
        if (img) {
          return (
            <img
              key={i}
              src={img[2]}
              alt={img[1]}
              loading="lazy"
              className="w-full rounded-2xl border border-line"
            />
          )
        }
        if (/^\s*(\d+\.|[-*])\s+/.test(block)) {
          const ordered = /^\s*\d+\./.test(block)
          const items = block.split('\n').map((l) => l.replace(/^\s*(\d+\.|[-*])\s+/, ''))
          const cls = `${ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5 marker:text-accent-soft`
          return ordered ? (
            <ol key={i} className={cls}>{items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ol>
          ) : (
            <ul key={i} className={cls}>{items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ul>
          )
        }
        return <p key={i}>{inline(block, i)}</p>
      })}
    </div>
  )
}
