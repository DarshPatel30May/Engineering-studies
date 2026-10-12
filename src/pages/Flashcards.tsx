import { useMemo, useState } from 'react';
import { Layers, RotateCcw, Check, X, Shuffle } from 'lucide-react';
import { MODULES } from '@/data/modules';
import { FORMULAS } from '@/data/formulas';
import { useStored } from '@/lib/storage';
import { PageHeader, Card, Select, Badge, M, MathText, cx, Toggle } from '@/components/ui';

interface FC {
  id: string;
  deck: string;
  front: string;
  back: string;
  latex?: string;
}

const CARDS: FC[] = [
  ...MODULES.flatMap((m) => m.concepts.map((c) => ({ id: `${m.id}:${c.id}`, deck: m.id, front: c.term, back: c.def }))),
  ...MODULES.flatMap((m) => m.revision.misconceptions.map((x, i) => ({ id: `${m.id}:mis${i}`, deck: m.id, front: `True or false? “${x.wrong}”`, back: `False. ${x.right}` }))),
  ...FORMULAS.map((f) => ({ id: `f:${f.id}`, deck: 'formulas', front: `Formula: ${f.name}`, back: f.meaning, latex: f.latex })),
];

/** Leitner boxes 1–5: correct → move up a box; wrong → back to box 1. Lower boxes are shown first. */
export default function Flashcards() {
  const [deck, setDeck] = useState('all');
  const [boxes, setBoxes] = useStored<Record<string, number>>('flashcards', {});
  const [flipped, setFlipped] = useState(false);
  const [idx, setIdx] = useState(0);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [reverse, setReverse] = useState(false);
  const cards = useMemo(() => {
    const list = CARDS.filter((c) => deck === 'all' || c.deck === deck);
    const r = (s: string) => {
      let h = shuffleKey * 2654435761;
      for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
      return (h >>> 0) / 4294967296;
    };
    return list.sort((a, b) => (boxes[a.id] ?? 1) - (boxes[b.id] ?? 1) || r(a.id) - r(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, shuffleKey]);
  const card = cards[idx % Math.max(1, cards.length)];
  const mastered = cards.filter((c) => (boxes[c.id] ?? 1) >= 4).length;
  const answer = (ok: boolean) => {
    setBoxes((b) => ({ ...b, [card.id]: ok ? Math.min(5, (b[card.id] ?? 1) + 1) : 1 }));
    setFlipped(false);
    setIdx((i) => i + 1);
  };
  const front = reverse ? card?.back : card?.front;
  const back = reverse ? card?.front : card?.back;
  return (
    <div>
      <PageHeader title="Revision Flashcards" kicker="Spaced repetition (Leitner boxes)" icon={<Layers className="text-emerald-600" />}>
        Definitions, misconceptions and formulas from every module. Cards you know move up a box and appear less often; missed cards return to box 1. Progress is saved in this browser.
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select label="Deck" value={deck} onChange={(d) => (setDeck(d), setIdx(0), setFlipped(false))} options={[{ value: 'all', label: `All cards (${CARDS.length})` }, ...MODULES.map((m) => ({ value: m.id, label: `${m.name} (${CARDS.filter((c) => c.deck === m.id).length})` })), { value: 'formulas', label: `Formulas (${FORMULAS.length})` }]} />
        <Toggle checked={reverse} onChange={setReverse} label="Reverse (definition → term)" />
        <button className="btn" onClick={() => (setShuffleKey((k) => k + 1), setIdx(0))}><Shuffle size={14} /> Shuffle</button>
        <button className="btn" onClick={() => confirm('Reset flashcard progress?') && setBoxes({})}><RotateCcw size={14} /> Reset</button>
        <Badge tone="emerald">{mastered}/{cards.length} mastered (box ≥ 4)</Badge>
      </div>
      {card && (
        <div className="mx-auto max-w-2xl">
          <button onClick={() => setFlipped((f) => !f)} className="group block w-full [perspective:1200px]" aria-label="Flip card">
            <div className={cx('relative h-72 w-full transition-transform duration-500 [transform-style:preserve-3d]', flipped && '[transform:rotateY(180deg)]')}>
              <div className="card absolute inset-0 flex flex-col items-center justify-center p-6 text-center [backface-visibility:hidden]">
                <Badge className="mb-3">{card.deck === 'formulas' ? 'Formula' : MODULES.find((m) => m.id === card.deck)?.name} · box {boxes[card.id] ?? 1}</Badge>
                <div className="text-xl font-semibold text-ink-900 dark:text-white"><MathText text={front!} /></div>
                <div className="mt-4 text-xs text-ink-400">Click to reveal</div>
              </div>
              <div className="card absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-emerald-950/40">
                {card.latex && !reverse && <M block>{card.latex}</M>}
                <div className="text-base text-ink-800 dark:text-ink-100"><MathText text={back!} /></div>
                {card.latex && reverse && <M block>{card.latex}</M>}
              </div>
            </div>
          </button>
          <div className="mt-4 flex justify-center gap-3">
            <button className="btn border-red-300 text-red-700 dark:border-red-800 dark:text-red-300" onClick={() => answer(false)} disabled={!flipped}><X size={15} /> Again</button>
            <button className="btn btn-primary" onClick={() => answer(true)} disabled={!flipped}><Check size={15} /> I knew it</button>
          </div>
          <p className="mt-2 text-center text-xs text-ink-500">Card {(idx % cards.length) + 1} of {cards.length}. Flip first, then rate yourself honestly.</p>
        </div>
      )}
      <Card className="mt-6" title="Box distribution">
        <div className="flex items-end gap-3">
          {[1, 2, 3, 4, 5].map((b) => {
            const n = cards.filter((c) => (boxes[c.id] ?? 1) === b).length;
            return (
              <div key={b} className="flex-1 text-center">
                <div className="mx-auto w-full rounded-t bg-emerald-500/70" style={{ height: `${Math.max(4, (n / Math.max(1, cards.length)) * 120)}px` }} />
                <div className="mt-1 text-xs">Box {b}: {n}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
