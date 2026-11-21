// Authored vector geometry: no AI is used to invent these reference structures.
// The same topology is shown in plan, oblique view and a two-foot stance.
export const GUIDE_WIDTH = 1440;
export const GUIDE_HEIGHT = 1080;
const label = (x: number, y: number, text: string, size = 27) =>
  `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${size}" fill="#202020">${text}</text>`;
const sheet = (content: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${GUIDE_WIDTH}" height="${GUIDE_HEIGHT}" viewBox="0 0 ${GUIDE_WIDTH} ${GUIDE_HEIGHT}">
  <defs>
    <linearGradient id="skin" x1="0" x2="0.7" y1="0" y2="1"><stop stop-color="#eeeeee"/><stop offset=".5" stop-color="#aaaaaa"/><stop offset="1" stop-color="#666666"/></linearGradient>
  </defs>
  <rect width="1440" height="1080" fill="white"/>${content}</svg>`;

const tube = (path: string, width: number) => `
  <path d="${path}" fill="none" stroke="#333333" stroke-width="${width + 4}" stroke-linecap="round"/>
  <path d="${path}" fill="none" stroke="url(#skin)" stroke-width="${width}" stroke-linecap="round"/>`;

// Bird faces RIGHT. Rear toes extend LEFT of the ankle, front toes RIGHT.
// Distinct endpoints and spaces make the topology countable, not an X-shaped
// symbol that could be mistaken for four forward-splayed toes.
const lobedDigitShape = (x: number, y: number, controlX: number, controlY: number) => {
  const edge = (sign: number) => Array.from({ length: 81 }, (_, i) => {
    const t = i / 80, u = 1 - t;
    const px = u * u * 220 + 2 * u * t * controlX + t * t * x;
    const py = u * u * 225 + 2 * u * t * controlY + t * t * y;
    const dx = 2 * u * (controlX - 220) + 2 * t * (x - controlX);
    const dy = 2 * u * (controlY - 225) + 2 * t * (y - controlY);
    const magnitude = Math.hypot(dx, dy) || 1;
    const scallop = t > 0.4 ? Math.sin((t - 0.4) / 0.6 * 3 * Math.PI) ** 2 : 0;
    const width = (9 + 19 * scallop) * (t > 0.94 ? 1 - (t - 0.94) * 8 : 1);
    return `${(px - sign * dy / magnitude * width).toFixed(2)},${(py + sign * dx / magnitude * width).toFixed(2)}`;
  });
  return `<polygon points="${[...edge(-1), ...edge(1).reverse()].join(" ")}" fill="url(#skin)" stroke="#333333" stroke-width="2"/>`;
};

const obliqueFoot = (forward: number[], backward: number[], lobed = false) => {
  const toes = (digits: number[], front: boolean) => digits.map((digit, i) => {
    const x = front ? 385 - i * 24 : 55 + i * 20;
    const y = 265 + i * 90;
    const path = `M220 225 Q${front ? 290 : 155} ${y - 20} ${x} ${y}`;
    const claw = front
      ? `M${x} ${y - 8} Q${x + 36} ${y - 2} ${x + 28} ${y + 29} Q${x + 13} ${y + 5} ${x - 3} ${y + 6}Z`
      : `M${x} ${y - 8} Q${x - 36} ${y - 2} ${x - 28} ${y + 29} Q${x - 13} ${y + 5} ${x + 3} ${y + 6}Z`;
    return `${lobed ? lobedDigitShape(x, y, front ? 290 : 155, y - 20) : tube(path, 22)}<path d="${claw}" fill="#303030"/>
      ${label(x - 8, y + 68, String(digit), 25)}`;
  }).join("");
  return `${tube("M170 55 Q185 145 220 225", 29)}
    ${toes(backward, false)}${toes(forward, true)}
    <ellipse cx="220" cy="225" rx="24" ry="20" fill="url(#skin)" stroke="#333333" stroke-width="3"/>`;
};

const planFoot = (forward: number[], backward: number[]) => {
  const toes = (digits: number[], front: boolean) => digits.map((digit, i) => {
    const x = 220 + (i - (digits.length - 1) / 2) * 100;
    const y = front ? 50 : 350;
    return `${tube(`M220 200 Q${x} ${front ? 145 : 255} ${x} ${y}`, 23)}
      <path d="M${x - 8} ${y} L${x} ${front ? y - 24 : y + 24} L${x + 8} ${y}Z" fill="#303030"/>
      ${label(x + 18, y + 6, String(digit), 25)}`;
  }).join("");
  return `${toes(forward, true)}${toes(backward, false)}
    <circle cx="220" cy="200" r="26" fill="url(#skin)" stroke="#333333" stroke-width="3"/>`;
};

export const toeGuide = (forward: number[], backward: number[]) => {
  const count = `${forward.length} FORWARD + ${backward.length} BACKWARD ON EACH FOOT`;
  return sheet(`
    ${label(65, 55, count, 36)}
    ${label(65, 105, "Digits are separate articulated toes, not extra claws. Ankle is not a toe.")}
    ${label(90, 165, "OBLIQUE VIEW - BIRD FACES RIGHT", 26)}
    <g transform="translate(65 170) scale(1.2)">${obliqueFoot(forward, backward)}</g>
    ${label(845, 165, "TOP VIEW - HEAD / FRONT", 26)}
    <g transform="translate(815 195) scale(1.1)">${planFoot(forward, backward)}</g>
    ${label(900, 650, "TAIL / BACK", 25)}
    <path d="M60 710 H1380" stroke="#cccccc" stroke-width="2"/>
    ${label(65, 760, "BOTH FEET: REPEAT THE SAME ARRANGEMENT - KEEP ALL TOES VISIBLE", 28)}
    <g transform="translate(180 770) scale(.65)">${obliqueFoot(forward, backward)}</g>
    <g transform="translate(760 770) scale(.65)">${obliqueFoot(forward, backward)}</g>
    ${label(110, 1060, "LEFT FOOT", 24)}${label(740, 1060, "RIGHT FOOT", 24)}
  `);
};

// Surface examples only: no species, whole-foot digit count or toe directions.
// Each outline is connected, including all lateral lobes and the central toe.
export const lobedToeGuide = () => {
  const digit = (x: number, y: number, length: number, angle: number) => {
    const side = (sign: number) => Array.from({ length: 81 }, (_, i) => {
      const t = i / 80;
      const wave = t > 0.12 && t < 0.96 ? Math.sin((t - 0.12) / 0.84 * 4 * Math.PI) ** 2 : 0;
      const width = (10 + 21 * wave) * (t > 0.92 ? 1 - (t - 0.92) * 8 : 1);
      return `${(sign * width).toFixed(2)},${(-t * length).toFixed(2)}`;
    });
    return `<g transform="translate(${x} ${y}) rotate(${angle} 0 0)">
      <polygon points="${[...side(-1), ...side(1).reverse()].join(" ")}" fill="url(#skin)" stroke="#333333" stroke-width="3"/>
      <path d="M-5 ${-length} Q0 ${-length - 33} 8 ${-length - 8} L5 ${-length + 8}Z" fill="#303030"/>
      <path d="M0 -14 V${-length + 15}" stroke="#777777" stroke-width="2" fill="none"/>
    </g>`;
  };
  return sheet(`
    ${label(55, 65, "LOBED TOE EDGES - SURFACE SHAPE ONLY", 36)}
    ${label(55, 115, "Each drawing is an individual TOE example, not the number of toes on a foot.", 27)}
    ${digit(260, 660, 410, -12)}${digit(690, 660, 485, 0)}${digit(1120, 660, 390, 12)}
    ${label(70, 750, "SCALLOPED SIDE LOBES ATTACH TO THEIR OWN TOE ONLY", 30)}
    ${label(70, 810, "White gaps stay OPEN between neighboring toes and their lobes.", 29)}
    ${label(70, 870, "Do not fill those gaps with a shared skin sheet or a fan-shaped paddle.", 27)}
    ${label(70, 960, "Keep the user's toe count, directions, colors and natural skin texture.", 27)}
  `);
};

export const billGuide = (up: boolean) => {
  // Both mandibles share the curvature; bill tip is well above/below base.
  const outline = up
    ? "M360 430 C580 450 840 350 1120 150 C890 410 600 500 360 475Z"
    : "M360 430 C580 410 840 510 1120 710 C890 450 600 360 360 385Z";
  const seam = up
    ? "M360 453 C600 474 880 385 1120 150"
    : "M360 407 C600 386 880 475 1120 710";
  const drawing = `<ellipse cx="240" cy="445" rx="150" ry="140" fill="#eeeeee" stroke="#555555" stroke-width="4"/>
    <circle cx="275" cy="395" r="11" fill="#222222"/>
    <path d="${outline}" fill="url(#skin)" stroke="#222222" stroke-width="4"/>
    <path d="${seam}" fill="none" stroke="#444444" stroke-width="2"/>`;
  return sheet(`
    ${label(65, 55, up ? "REQUIRED: BILL CURVES UPWARD - HEAD REMAINS LEVEL" : "REQUIRED: BILL CURVES DOWNWARD - HEAD REMAINS LEVEL", 32)}
    ${label(65, 105, "Closed upper AND lower mandibles follow the same curve. Copy curvature, not grey color.")}
    <path d="M80 453 H1340" stroke="#aaaaaa" stroke-width="3" stroke-dasharray="12 10"/>
    ${drawing}
    ${label(1140, up ? 160 : 720, up ? "RAISED TIP" : "LOWERED TIP", 24)}
    ${label(70, 650, "LEVEL HEAD", 24)}
    ${label(65, 790, "SAME CURVATURE AT A SMALLER SCALE - USE THE SELECTED LENGTH AND THICKNESS", 25)}
    <g transform="translate(430 720) scale(.48)">${drawing}</g>
    ${label(65, 1035, "Geometry reference only. Final output: one natural-looking bird, without labels or panels.", 25)}
  `);
};

// A spatial construction reference eliminates the extra top-view -> posed-foot
// interpretation step. It is an invented scaffold, not a real species portrait.
export function anatomyPoseGuide(forward: number[], backward: number[], bill: "upcurved" | "downcurved" | undefined, body: string, lobed = false): string {
  // Only familiar predefined torso labels affect the placeholder proportions.
  // Custom torso anatomy remains governed by the original descriptive data.
  const horizontal = /waterfowl|pheasant|pigeon/i.test(body);
  const upright = /owl|raptor/i.test(body);
  const bodyRx = horizontal ? 320 : upright ? 265 : 235;
  const bodyRy = horizontal ? 210 : upright ? 300 : 270;
  const largeHead = /owl/i.test(body);
  const billShape = bill === "upcurved"
    ? "M972 356 C1080 367 1190 317 1340 192 C1200 351 1080 394 972 386Z"
    : "M972 356 C1080 345 1190 395 1340 520 C1200 361 1080 318 972 346Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1440" viewBox="0 0 1440 1440">
    <defs><linearGradient id="skin" x1="0" x2="0.7" y1="0" y2="1"><stop stop-color="#eeeeee"/><stop offset=".5" stop-color="#aaaaaa"/><stop offset="1" stop-color="#666666"/></linearGradient></defs>
    <rect width="1440" height="1440" fill="white"/>
    ${label(55, 60, "CONSTRUCTION BASE: TRANSFER TOE BRANCHES TO THE FINAL BIRD", 30)}
    ${label(55, 110, "Grey body is a placeholder. Use all selected body, leg, plumage and color traits.", 26)}
    <path d="M470 770 L130 1000 L190 1040 L560 865Z" fill="#dddddd" stroke="#888888" stroke-width="3"/>
    <ellipse cx="640" cy="680" rx="${bodyRx}" ry="${bodyRy}" transform="rotate(22 640 680)" fill="#eeeeee" stroke="#999999" stroke-width="3"/>
    <ellipse cx="620" cy="685" rx="150" ry="210" transform="rotate(40 620 685)" fill="#dddddd" stroke="#999999" stroke-width="3"/>
    <ellipse cx="850" cy="360" rx="${largeHead ? 175 : 140}" ry="${largeHead ? 160 : 120}" fill="#eeeeee" stroke="#999999" stroke-width="3"/>
    <path d="M740 420 Q765 470 745 500 L850 550 Q890 490 905 460" fill="#eeeeee"/>
    <circle cx="890" cy="330" r="13" fill="#444444"/>
    ${bill ? `<path d="${billShape}" fill="url(#skin)" stroke="#333333" stroke-width="4"/>` : ""}
    <path d="M610 905 L532 1026 M775 905 L772 1056" stroke="#777777" stroke-width="23" stroke-linecap="round"/>
    <g transform="translate(439 996) scale(.55)">${obliqueFoot(forward, backward, lobed)}</g>
    <g transform="translate(679 1026) scale(.55)">${obliqueFoot(forward, backward, lobed)}</g>
    ${label(75, lobed ? 1365 : 1300, lobed ? "KEEP INDIVIDUAL SCALLOPED LOBES AND OPEN GAPS BETWEEN NEIGHBORING TOES" : "KEEP EACH FOOT'S EXACT FORWARD / BACKWARD BRANCHING - NOT NORMAL 3+1 FEET", 27)}
    ${label(75, lobed ? 1410 : 1350, "Replace grey with natural skin, scales, claws and the selected colors. Output no labels.", 26)}
  </svg>`;
}
