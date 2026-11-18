import React from 'react';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

// Plantar (sole) view of a right foot. Forward = up, rear = down.
// Ankle/metatarsal pad sits at (40, 40). viewBox 80 x 72.

export const FOOT_CAPTIONS: Record<string, { caption: string; a11y: string }> = {
  perching: { caption: '3 toes forward, 1 back', a11y: 'Three toes point forward and one hind toe points back, for gripping branches' },
  webbed: { caption: 'Web joins 3 front toes', a11y: 'Skin webbing joins the three forward toes; the small hind toe stays separate, for paddling' },
  talons: { caption: 'Hooked claws, 1 opposes', a11y: 'Strong separate toes with large hooked claws; three forward and one rear toe close together to grip prey' },
  zygodactyl: { caption: '2 toes forward, 2 back', a11y: 'Two toes point forward and two point backward, in an X shape, for climbing and clinging' },
  lobed: { caption: 'Flaps on each front toe', a11y: 'Each of the three forward toes has its own scalloped skin lobes with open gaps between toes, for swimming' },
};

type Pt = [number, number];
const toe = (a: Pt, b: Pt) => `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;

export function FootDiagram({ id, selected }: { id: string; selected?: boolean }) {
  const c = useColors();
  const ink = selected ? c.primary : c.secondaryForeground;
  const soft = c.accent;
  const claw = c.chestnut;
  const P: Pt = [40, 40];
  const sw = id === 'talons' ? 4.2 : 3.2;
  const common = { stroke: ink, strokeWidth: sw, strokeLinecap: 'round' as const, fill: 'none' };

  let body: React.ReactNode = null;

  if (id === 'perching') {
    const tips: Pt[] = [[18, 12], [40, 6], [62, 12], [40, 66]];
    body = <G>{tips.map((t, i) => <Path key={i} d={toe(P, t)} {...common} />)}
      {tips.map((t, i) => <Circle key={`c${i}`} cx={t[0]} cy={t[1]} r={1.6} fill={claw} />)}</G>;
  } else if (id === 'zygodactyl') {
    const tips: Pt[] = [[24, 8], [56, 8], [22, 68], [58, 68]];
    body = <G>{tips.map((t, i) => <Path key={i} d={toe(P, t)} {...common} />)}
      {tips.map((t, i) => <Circle key={`c${i}`} cx={t[0]} cy={t[1]} r={1.6} fill={claw} />)}</G>;
  } else if (id === 'webbed') {
    const tips: Pt[] = [[16, 10], [40, 5], [64, 10]];
    body = <G>
      <Path d="M40 40 L16 10 Q28 14 40 5 Q52 14 64 10 Z" fill={soft} stroke={ink} strokeWidth={1.2} strokeLinejoin="round" />
      {tips.map((t, i) => <Path key={i} d={toe(P, t)} {...common} />)}
      <Path d={toe(P, [40, 58])} {...common} />
      {[...tips, [40, 58] as Pt].map((t, i) => <Circle key={`c${i}`} cx={t[0]} cy={t[1]} r={1.6} fill={claw} />)}
    </G>;
  } else if (id === 'talons') {
    body = <G>
      <Path d="M40 40 L20 14" {...common} /><Path d="M40 40 L40 10" {...common} /><Path d="M40 40 L60 14" {...common} /><Path d="M40 40 L40 60" {...common} />
      {/* hooked claws curling inward toward the sole */}
      <Path d="M20 14 Q14 6 22 4 Q20 9 24 12" fill={claw} stroke={claw} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M40 10 Q34 2 42 1 Q39 6 43 9" fill={claw} stroke={claw} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M60 14 Q66 6 58 4 Q60 9 56 12" fill={claw} stroke={claw} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M40 60 Q34 69 42 71 Q39 66 43 62" fill={claw} stroke={claw} strokeWidth={1.4} strokeLinejoin="round" />
    </G>;
  } else if (id === 'lobed') {
    const toes: { tip: Pt; ang: number }[] = [{ tip: [17, 10], ang: -37.5 }, { tip: [40, 4], ang: 0 }, { tip: [63, 10], ang: 37.5 }];
    body = <G>
      {toes.map(({ ang }, i) => (
        <G key={i} transform={`rotate(${ang} 40 40)`}>
          {/* three separate scalloped lobes along each toe, gaps between toes stay open */}
          {[32, 22, 12].map((y, j) => {
            const w = 5.5 - j * 0.8;
            return <Path key={j} d={`M40 ${y + 4} C${40 - w * 1.6} ${y + 3} ${40 - w * 1.6} ${y - 4} 40 ${y - 4} C${40 + w * 1.6} ${y - 4} ${40 + w * 1.6} ${y + 3} 40 ${y + 4} Z`}
              fill={soft} stroke={ink} strokeWidth={1} />;
          })}
        </G>
      ))}
      {toes.map(({ tip }, i) => <Path key={`t${i}`} d={toe(P, tip)} {...common} strokeWidth={2.4} />)}
      <Path d={toe(P, [40, 58])} {...common} strokeWidth={2.4} />
      {[...toes.map((t) => t.tip), [40, 58] as Pt].map((t, i) => <Circle key={`c${i}`} cx={t[0]} cy={t[1]} r={1.5} fill={claw} />)}
    </G>;
  }

  return (
    <Svg width={72} height={65} viewBox="0 0 80 72" aria-hidden={true}>
      {/* faint direction cue: forward is up */}
      <Line x1={74} y1={60} x2={74} y2={14} stroke={c.border} strokeWidth={1.2} strokeDasharray="2 3" />
      <Path d="M71 18 L74 12 L77 18" stroke={c.border} strokeWidth={1.2} fill="none" />
      {body}
      <Circle cx={40} cy={40} r={sw + 0.8} fill={ink} />
    </Svg>
  );
}
