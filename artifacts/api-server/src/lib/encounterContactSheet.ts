import { Resvg } from "@resvg/resvg-js";
import type { Part } from "@google/genai";

// One visual input keeps larger casts together instead of asking the image
// model to bind four to six independent image inputs. These are pasted original
// portraits, never AI reconstructions. Names and descriptions cannot enter SVG.
export function encounterContactSheet(references: Part[]): { part: Part; map: string } {
  if (references.length < 4 || references.length > 6) {
    throw new Error("A group reference sheet requires four to six portraits.");
  }
  const columns = references.length === 4 ? 2 : 3;
  const tile = 640;
  const label = 48;
  const width = columns * tile;
  const height = 2 * (tile + label);
  const cells = references.map((reference, index) => {
    const image = reference.inlineData;
    if (!image?.data || !/^image\/(?:png|jpeg|webp)$/.test(image.mimeType ?? "") ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) {
      throw new Error("Unreadable group portrait.");
    }
    const x = (index % columns) * tile;
    const y = Math.floor(index / columns) * (tile + label);
    return `<g>
      <rect x="${x}" y="${y}" width="${tile}" height="${tile + label}" fill="white" stroke="#333" stroke-width="3"/>
      <text x="${x + tile / 2}" y="${y + 34}" text-anchor="middle" font-family="sans-serif" font-size="28" fill="black">BIRD_${index + 1}</text>
      <image x="${x + 8}" y="${y + label}" width="${tile - 16}" height="${tile - 8}"
        preserveAspectRatio="xMidYMid meet" href="data:${image.mimeType};base64,${image.data}"/>
    </g>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#e8e8e8"/>${cells}</svg>`;
  const png = new Resvg(svg).render().asPng();
  return {
    part: { inlineData: { mimeType: "image/png", data: png.toString("base64") } },
    map: references.map((_, index) =>
      `BIRD_${index + 1} = row ${Math.floor(index / columns) + 1}, column ${(index % columns) + 1}`
    ).join("; "),
  };
}
