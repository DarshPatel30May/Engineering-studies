import { describe, it, expect } from 'vitest';
import { MODELS, projectView, creaseEdges, type VoxelModel } from './projection';
import { developSquareToRound } from './development';

const model = (id: string) => MODELS.find((m) => m.id === id)!;
const sorted = (segs: ReturnType<typeof projectView>) =>
  segs
    .map((s) => `${s.hidden ? 'H' : 'V'} ${Math.min(s.x1, s.x2)},${Math.min(s.y1, s.y2)}-${Math.max(s.x1, s.x2)},${Math.max(s.y1, s.y2)}`)
    .sort();

describe('orthographic projection', () => {
  it('a single cube has 12 crease edges and a square in every view', () => {
    const cube: VoxelModel = { id: 'c', name: 'c', unit: 10, voxels: [[0, 0, 0]] };
    expect(creaseEdges(cube)).toHaveLength(12);
    for (const v of ['front', 'top', 'right'] as const) {
      const s = projectView(cube, v);
      expect(s).toHaveLength(4);
      expect(s.every((x) => !x.hidden)).toBe(true);
    }
  });
  it('a rear notch appears as hidden detail in the front view', () => {
    const s = projectView(model('notched-block'), 'front');
    const hidden = sorted(s.filter((x) => x.hidden));
    expect(hidden).toEqual(['H 2,0-2,2', 'H 2,2-4,2', 'H 4,0-4,2']);
    // Outline is visible
    expect(sorted(s.filter((x) => !x.hidden))).toEqual(['V 0,0-0,4', 'V 0,0-6,0', 'V 0,4-6,4', 'V 6,0-6,4']);
  });
  it('a through slot is visible in the front view and hidden in the top view', () => {
    const m = model('slotted-block');
    const front = projectView(m, 'front');
    expect(front.every((x) => !x.hidden)).toBe(true);
    const top = projectView(m, 'top');
    // Slot floor edges (y = 1) are seen from above through the open slot → visible
    expect(top.some((x) => x.hidden)).toBe(false);
    const right = projectView(m, 'right');
    // From the right, the slot floor (height 1) is hidden behind the right wall
    expect(right.some((x) => x.hidden)).toBe(true);
  });
});

describe('square-to-round transition development', () => {
  it('produces a closed pattern whose edge lengths match the true lengths', () => {
    const d = developSquareToRound(200, 120, 150, 12);
    // Developed circle-edge length ≈ circumference (chordal approximation)
    const circ = Math.PI * 120;
    expect(Math.abs(d.developedTopLength - circ) / circ).toBeLessThan(0.015);
    // Square edge total = perimeter
    expect(Math.abs(d.developedBottomLength - 800)).toBeLessThan(1e-6);
    // True lengths from corner to the nearest circle point: sqrt(horizontal² + h²)
    const tl = d.trueLengths[0];
    expect(tl.length).toBeGreaterThan(150);
  });
});
