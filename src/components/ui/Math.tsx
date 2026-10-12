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
      {parts.map((p, i) => (p.startsWith('$') && p.endsWith('$') && p.length > 2 ? <M key={i}>{p.slice(1, -1)}</M> : <span key={i}>{p}</span>))}
    </span>
  );
}
