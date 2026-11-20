const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the shipped policy with a controlled OS lifecycle, without requiring
// a native runtime in Node. Browser interaction tests cover the actual inputs.
const appState = { currentState: 'active' };
let clock = 1000;
function load(relative) {
  const filename = resolve(__dirname, '..', relative);
  const mod = { exports: {} };
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(output, {
    exports: mod.exports,
    module: mod,
    Date: { now: () => clock },
    require: (name) => {
      if (name === 'react-native') return { AppState: appState };
      // The link parser itself must not use clipboard, storage, or the network.
      return new Proxy({}, { get: (_, key) => {
        if (key === '__esModule') return false;
        throw new Error(`Unexpected dependency: ${name}.${String(key)}`);
      } });
    },
  }, { filename });
  return mod.exports;
}

const focus = load('lib/inputFocus.ts');
const a = {};
const b = {};
const touch = (target) => ({ nativeEvent: { target } });
focus.noteInputFocus(a, 101);
assert.equal(focus.recoverInputBlur(a), true, 'unexpected blur can be recovered');
assert.equal(focus.stillOwnsInputFocus(a), true);
focus.noteInputTouch(touch(202));
assert.equal(focus.inputBlurWasRequested(a), true, 'outside tap is intentional');
assert.equal(focus.recoverInputBlur(a), false, 'do not steal focus from outside taps');
focus.noteInputFocus(b, 202);
assert.equal(focus.stillOwnsInputFocus(a), false, 'new field cancels previous recovery');
focus.noteInputTouch(touch(202));
assert.equal(focus.inputBlurWasRequested(b), false, 'touching same field keeps editing');
focus.allowInputBlur(b);
assert.equal(focus.recoverInputBlur(b), false, 'Tab/submit focus changes are intentional');
focus.resumeInputEditing(b);
assert.equal(focus.recoverInputBlur(b), true, 'further typing resets a previous submit');
appState.currentState = 'background';
assert.equal(focus.recoverInputBlur(b), false, 'never restore focus into background');
assert.equal(focus.stillOwnsInputFocus(b), false);
appState.currentState = 'active';
focus.resumeInputEditing(b);
assert.equal(focus.recoverInputBlur(b), true);
focus.noteInputFocus(b, 202);
assert.equal(focus.recoverInputBlur(b), true);
focus.noteInputFocus(b, 202);
assert.equal(focus.recoverInputBlur(b), false, 'bounded recovery cannot create focus loops');
clock += 500;
assert.equal(focus.recoverInputBlur(b), true, 'a later interruption does not exhaust focus for the rest of the edit');
focus.releaseInputFocus(b);
assert.equal(focus.stillOwnsInputFocus(b), false, 'unmount cancels queued recovery');

const { parseBirdShareToken } = load('lib/birdSharing.ts');
const token = 'aB9_-'.repeat(8) + 'XYZ';
const url = `https://example.test/api/bird-shares/open?token=${token}`;
for (const input of [
  token, url, `  ${url}\n`, `<${url}>`,
  `Open this bird:\n${url}\nThanks!`,
  `https://redirect.test/?url=${encodeURIComponent(url)}`,
  encodeURIComponent(encodeURIComponent(url)),
  `https://example.test/?other=yes&amp;token=${token}`,
  `chirrup:///receive-bird?token=${token}`,
]) assert.equal(parseBirdShareToken(input), token, `read copied link: ${input}`);
for (const input of ['', 'not a link', url + 'extra', '?token=short', '%broken%']) {
  assert.equal(parseBirdShareToken(input), null, 'invalid links must not be imported');
}
console.log('PASS: focus ownership, deliberate dismissal, background/unmount safety, bounded recovery, copied sharing links');

const { externalBrowserInputValue } = load('lib/browserInputValue.ts');
const inputState = { prop: 'soft down', reported: 'soft down' };
inputState.reported = ''; // Browser deletion, before the parent commits it.
assert.equal(externalBrowserInputValue(inputState, 'soft down', ''), undefined,
  'an identical prop replay must not restore stale text over a pending deletion');
assert.equal(externalBrowserInputValue(inputState, '', ''), undefined, 'acknowledge parent echo without writing');
inputState.reported = 'soft d';
assert.equal(externalBrowserInputValue(inputState, 'soft d', 'soft d'), undefined);
assert.equal(externalBrowserInputValue(inputState, 'soft d', 'soft down'), undefined,
  'identical rerenders must not overwrite more recent browser typing');
inputState.reported = 'soft down';
assert.equal(externalBrowserInputValue(inputState, 'soft down', 'soft down'), undefined);
assert.equal(externalBrowserInputValue(inputState, '', 'soft down'), '', 'an intentional parent reset still clears the field');
assert.equal(externalBrowserInputValue(inputState, 'restored draft', ''), 'restored draft', 'external prefilling still works');
console.log('PASS: stale prop replays, keystroke echoes, explicit resets and restored drafts');

const { traitHighlightParts } = load('lib/traitHighlights.ts');
const highlighted = traitHighlightParts('white feathers, catlike ears', [{ start: 16, end: 28 }]);
assert.equal(highlighted.map(part => part.text).join(''), 'white feathers, catlike ears');
assert.equal(highlighted.filter(part => part.invalid).map(part => part.text).join(''), 'catlike ears');
const overlap = traitHighlightParts('abcdef', [{ start: 1, end: 4 }, { start: 2, end: 5 }]);
assert.equal(overlap.map(part => part.text).join(''), 'abcdef', 'overlapping spans never duplicate text');
assert.equal(overlap.filter(part => part.invalid)[0].text, 'bcde');
assert.equal(traitHighlightParts('abc', [{ start: 30, end: 40 }]).map(part => part.text).join(''), 'abc');
console.log('PASS: exact invalid-word highlighting, overlapping and out-of-range spans');
