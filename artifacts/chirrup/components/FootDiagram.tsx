import React from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

// Side-profile bird-foot silhouettes with a short oblique ankle stub.
// Toes point right, hind toes left/down. Each toe is a smooth Bezier body
// that tapers continuously into a recurved claw. Solid ink, sparse paper cuts.

export const FOOT_CAPTIONS: Record<string, { caption: string; a11y: string }> = {
  perching: { caption: '3 toes forward, 1 back', a11y: 'Side view of a perching foot: three toes point forward and one hind toe points back, for gripping branches' },
  webbed: { caption: 'Skin joins the front toes', a11y: 'Side view of a webbed foot: a membrane joins the three forward toes; the small hind toe stays separate, for paddling' },
  talons: { caption: 'Big hooked claws', a11y: 'Side view of a talon foot: stout separate toes with large hooked claws, the hind toe opposing the front toes to grip prey' },
  zygodactyl: { caption: '2 toes forward, 2 back', a11y: 'Side view of a zygodactyl foot: two toes point forward and two point backward, for climbing and clinging' },
  lobed: { caption: 'Flaps on each toe', a11y: 'Side view of a lobed foot: each forward toe has separate scalloped skin lobes, with no web between toes, for swimming' },
};

type Pt = [number, number];
interface Toe {
  p: [Pt, Pt, Pt, Pt];      // toe centreline (cubic)
  c?: [Pt, Pt, Pt];         // claw continuation (cubic from p[3])
  w0: number; w1: number;   // width at root and at claw base
  lobes?: number; amp?: number; // scalloped skin lobes (coot)
  cuts?: boolean;           // sparse scale cuts on near toes
}

const f = (n: number) => n.toFixed(1);
const bez = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};

function spine(t: Toe) {
  const pts: Pt[] = []; const ws: number[] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push(bez(...t.p, u));
    let w = t.w0 + (t.w1 - t.w0) * u;
    w += 0.35 * Math.pow(Math.sin(Math.PI * 3 * u), 2); // soft knuckle pads
    if (t.lobes && u > 0.06) w += (t.amp ?? 0) * Math.pow(Math.abs(Math.sin(Math.PI * t.lobes * u)), 0.6);
    ws.push(w);
  }
  if (t.c) {
    const M = 12;
    for (let i = 1; i <= M; i++) {
      const v = i / M;
      pts.push(bez(t.p[3], ...t.c, v));
      ws.push(t.w1 * 0.92 * Math.pow(1 - v, 1.15));
    }
  }
  return { pts, ws };
}

function outline(t: Toe) {
  const { pts, ws } = spine(t);
  const L: Pt[] = []; const R: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)]; const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0]; const dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m; const ny = dx / m; const h = ws[i] / 2;
    L.push([p[0] + nx * h, p[1] + ny * h]); R.push([p[0] - nx * h, p[1] - ny * h]);
  });
  const all = [...L, ...R.reverse()];
  return `M${all.map((q) => `${f(q[0])} ${f(q[1])}`).join(' L')} Z`;
}

function cutsFor(t: Toe) {
  // two fine joint creases plus the toe/claw junction
  const { pts, ws } = spine(t);
  const idx = [9, 18, 26];
  return idx.map((i) => {
    const a = pts[i - 1]; const b = pts[i + 1]; const p = pts[i];
    const dx = b[0] - a[0]; const dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m; const ny = dx / m; const h = ws[i] * 0.3;
    return `M${f(p[0] + nx * h)} ${f(p[1] + ny * h)} L${f(p[0] - nx * h)} ${f(p[1] - ny * h)}`;
  }).join(' ');
}

interface FootSpec {
  stub: Toe; heel: [number, number, number, number, number]; // cx cy rx ry rot
  far: Toe[]; near: Toe[]; web?: string;
}

const FEET: Record<string, FootSpec> = {
  // fine passerine grip: slim toes curling down round an implied twig
  perching: {
    stub: { p: [[54, 46], [52, 40], [49, 34], [46, 28]], w0: 8, w1: 6.5 },
    heel: [53, 47, 7, 5.5, -20],
    far: [
      { p: [[56, 44], [70, 38], [86, 40], [92, 50]], c: [[95, 55], [95, 62], [89, 65]], w0: 4.6, w1: 2.6 },
      { p: [[55, 50], [64, 56], [72, 62], [74, 70]], c: [[76, 74], [75, 79], [70, 80]], w0: 4.4, w1: 2.4 },
    ],
    near: [
      { p: [[56, 48], [72, 44], [88, 50], [91, 63]], c: [[93, 69], [92, 75], [86, 77]], w0: 5.2, w1: 2.8, cuts: true },
      { p: [[50, 50], [41, 54], [32, 58], [30, 67]], c: [[29, 72], [32, 77], [38, 78]], w0: 5, w1: 2.8, cuts: true },
    ],
  },
  // raptor clutch: thick flexed digits, heavy sickle claws
  talons: {
    stub: { p: [[52, 42], [50, 36], [47, 30], [44, 24]], w0: 15, w1: 13 },
    heel: [51, 44, 12, 9, -15],
    far: [
      { p: [[56, 40], [72, 32], [90, 32], [97, 43]], c: [[103, 50], [103, 63], [92, 67]], w0: 9, w1: 6.2 },
      { p: [[54, 50], [62, 56], [67, 62], [67, 69]], c: [[67, 76], [63, 83], [54, 83]], w0: 8.6, w1: 6 },
    ],
    near: [
      { p: [[56, 46], [72, 42], [84, 47], [87, 58]], c: [[91, 65], [91, 77], [79, 81]], w0: 10, w1: 6.8, cuts: true },
      { p: [[46, 48], [36, 52], [27, 56], [25, 64]], c: [[23, 72], [29, 80], [40, 80]], w0: 9.4, w1: 6.6, cuts: true },
    ],
  },
  // climbing grip: digits II and III forward-down, I and IV down-back, opposed
  zygodactyl: {
    stub: { p: [[50, 40], [48, 35], [45, 30], [42, 25]], w0: 9, w1: 7.5 },
    heel: [50, 42, 8, 7, -25],
    far: [
      { p: [[53, 38], [68, 28], [89, 28], [99, 38]], c: [[103, 44], [103, 52], [97, 55]], w0: 5.4, w1: 3.2 },
      { p: [[46, 44], [37, 48], [29, 55], [28, 63]], c: [[28, 68], [32, 73], [37, 73]], w0: 5.2, w1: 3 },
    ],
    near: [
      { p: [[53, 42], [69, 36], [86, 40], [91, 51]], c: [[94, 57], [93, 65], [87, 67]], w0: 6, w1: 3.4, cuts: true },
      { p: [[49, 46], [45, 56], [39, 65], [41, 73]], c: [[42, 79], [47, 83], [53, 82]], w0: 6, w1: 3.4, cuts: true },
    ],
  },
  // duck paddle: low, broad, tapered tips joined by membrane
  webbed: {
    stub: { p: [[42, 50], [41, 45], [40, 40], [38, 35]], w0: 8.5, w1: 7 },
    heel: [41, 52, 8, 6, -10],
    web: 'M42 46 C58 42 78 41 96 46 Q95 53 102 57 Q96 62 98 67 C80 67 60 64 42 58 Z',
    far: [
      { p: [[38, 50], [34, 48], [30, 46], [27, 46]], c: [[25, 46], [24, 47], [23, 48]], w0: 3.4, w1: 2 },
      { p: [[42, 49], [58, 45], [78, 44], [96, 47]], c: [[99, 47], [101, 48], [102, 50]], w0: 4.2, w1: 1.8 },
    ],
    near: [
      { p: [[42, 52], [62, 52], [82, 54], [101, 57]], c: [[104, 57], [106, 58], [107, 60]], w0: 4.6, w1: 1.8, cuts: true },
      { p: [[42, 55], [60, 59], [80, 63], [98, 67]], c: [[101, 67], [103, 68], [104, 70]], w0: 4.6, w1: 1.8, cuts: true },
    ],
  },
  // coot: long spread toes, continuous scalloped lobes, open gaps
  lobed: {
    stub: { p: [[36, 48], [35, 43], [34, 38], [32, 33]], w0: 7.5, w1: 6.2 },
    heel: [35, 50, 7, 5.5, -10],
    far: [
      { p: [[37, 46], [52, 38], [70, 30], [90, 25]], c: [[93, 24], [96, 24], [98, 25]], w0: 3, w1: 1.6, lobes: 3, amp: 4.2 },
      { p: [[38, 49], [60, 47], [84, 47], [106, 50]], c: [[109, 50], [111, 51], [112, 53]], w0: 3, w1: 1.6, lobes: 3, amp: 4.4 },
    ],
    near: [
      { p: [[37, 52], [58, 57], [80, 63], [101, 70]], c: [[104, 71], [106, 72], [107, 75]], w0: 3.4, w1: 1.8, lobes: 3, amp: 5 },
      { p: [[33, 52], [27, 55], [21, 58], [16, 60]], c: [[14, 61], [12, 62], [11, 64]], w0: 3, w1: 1.6, lobes: 1, amp: 2 },
    ],
  },
};

export function FootDiagram({ id, selected }: { id: string; selected?: boolean }) {
  const c = useColors();
  const ink = selected ? c.primary : c.secondaryForeground;
  const paper = selected ? c.accent : c.card;
  const spec = FEET[id];
  if (!spec) return null;
  const [hx, hy, hrx, hry, hrot] = spec.heel;

  return (
    <Svg width={120} height={90} viewBox="0 16 120 74" aria-hidden={true}>
      {spec.far.map((t, i) => <Path key={`f${i}`} d={outline(t)} fill={ink} />)}
      {spec.web ? <Path d={spec.web} fill={ink} /> : null}
      <Path d={outline(spec.stub)} fill={ink} />
      <Ellipse cx={hx} cy={hy} rx={hrx} ry={hry} fill={ink} transform={`rotate(${hrot} ${hx} ${hy})`} />
      <Path d={`M${f(spec.stub.p[1][0] - 3)} ${f(spec.stub.p[1][1] + 1)} l6 -2 M${f(spec.stub.p[2][0] - 3)} ${f(spec.stub.p[2][1] + 1)} l6 -2`}
        stroke={paper} strokeWidth={0.7} strokeLinecap="round" fill="none" />
      {spec.near.map((t, i) => (
        <G key={`n${i}`}>
          <Path d={outline(t)} fill={ink} stroke={paper} strokeWidth={1} strokeLinejoin="round" />
          {t.cuts ? <Path d={cutsFor(t)} stroke={paper} strokeWidth={0.6} strokeLinecap="round" fill="none" /> : null}
        </G>
      ))}
    </Svg>
  );
}
