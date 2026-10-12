import katex from 'katex';
import { memo, useMemo } from 'react';

/** KaTeX renderer. `block` renders display-mode maths. Errors render as red source text rather than crashing. */
export const M = memo(function M({ children, block, className }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { displayMode: !!block, throwOnError: false, strict: 'ignore', output: 'html' });
    } catch {
      return `<span style="color:#dc2626">${children}</span>`;
    }
  }, [children, block]);
  const Tag = block ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

/** Renders text with inline $…$ maths segments. */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => (p.startsWith('$') && p.endsWith('$') && p.length > 2 ? <M key={i}>{p.slice(1, -1)}</M> : <Subs key={i} text={p} />))}
    </span>
  );
}

/** Renders plain-text subscripts such as R_A, F_{AB} or E_k as real subscripts (no KaTeX needed). */
export function Subs({ text }: { text: string }) {
  const re = /(^|[^A-Za-z0-9_])([A-Za-zΣσεθΔμ]{1,6})_(\{[^}]+\}|[A-Za-z0-9]+)/g;
  const out: (string | JSX.Element)[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index + m[1].length;
    out.push(text.slice(last, start), m[2]);
    out.push(<sub key={start}>{m[3].replace(/^\{|\}$/g, '')}</sub>);
    last = start + m[2].length + 1 + m[3].length;
  }
  out.push(text.slice(last));
  return <span>{out}</span>;
}
