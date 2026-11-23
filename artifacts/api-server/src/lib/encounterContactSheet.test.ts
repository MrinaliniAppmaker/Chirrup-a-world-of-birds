import { test } from "node:test";
import assert from "node:assert/strict";
import { Resvg } from "@resvg/resvg-js";
import { encounterContactSheet } from "./encounterContactSheet";

const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
const references = colors.map((color) => ({
  inlineData: {
    mimeType: "image/png",
    data: new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="40"><rect width="20" height="40" fill="${color}"/></svg>`).render().asPng().toString("base64"),
  },
}));

test("four, five and six original images occupy the matching labelled cells without cropping", () => {
  for (const count of [4, 5, 6]) {
    const sheet = encounterContactSheet(references.slice(0, count));
    const columns = count === 4 ? 2 : 3;
    const image = sheet.part.inlineData!;
    const rendered = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${columns * 640}" height="1376"><image width="100%" height="100%" href="data:image/png;base64,${image.data}"/></svg>`).render();
    const pixel = (x: number, y: number) => [...rendered.pixels.subarray((y * rendered.width + x) * 4, (y * rendered.width + x) * 4 + 3)];
    for (let i = 0; i < count; i++) {
      const x = (i % columns) * 640 + 320;
      const y = Math.floor(i / columns) * 688 + 48;
      const rgb = colors[i].slice(1).match(/../g)!.map((v) => parseInt(v, 16));
      assert.deepEqual(pixel(x, y + 3), rgb); // top survives
      assert.deepEqual(pixel(x, y + 316), rgb);
      assert.deepEqual(pixel(x, y + 628), rgb); // bottom survives
      assert.match(sheet.map, new RegExp(`BIRD_${i + 1} = row ${Math.floor(i / columns) + 1}, column ${(i % columns) + 1}`));
    }
    assert.equal(rendered.width, columns * 640);
    assert.equal(rendered.height, 1376);
  }
});

test("sheet rejects unsupported counts and non-image or external inputs", () => {
  for (const count of [0, 2, 3, 7]) {
    assert.throws(() => encounterContactSheet(Array.from({ length: count }, () => references[0])));
  }
  assert.throws(() => encounterContactSheet(Array(4).fill({ text: "https://example.com" })));
  assert.throws(() => encounterContactSheet(Array(4).fill({ inlineData: { mimeType: 'image/png" onload="bad', data: "AAAA" } })));
});
