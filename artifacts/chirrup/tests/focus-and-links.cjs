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

const { traitHighlightParts, traitInputRanges } = load('lib/traitHighlights.ts');
const highlighted = traitHighlightParts('white feathers, catlike ears', [{ start: 16, end: 28 }]);
assert.equal(highlighted.map(part => part.text).join(''), 'white feathers, catlike ears');
assert.equal(highlighted.filter(part => part.invalid).map(part => part.text).join(''), 'catlike ears');
const overlap = traitHighlightParts('abcdef', [{ start: 1, end: 4 }, { start: 2, end: 5 }]);
assert.equal(overlap.map(part => part.text).join(''), 'abcdef', 'overlapping spans never duplicate text');
assert.equal(overlap.filter(part => part.invalid)[0].text, 'bcde');
assert.equal(traitHighlightParts('abc', [{ start: 30, end: 40 }]).map(part => part.text).join(''), 'abc');
console.log('PASS: exact invalid-word highlighting, overlapping and out-of-range spans');

const rawTrait = ' \n  forked tail, butterfly wings  ';
const trimmedStart = rawTrait.trim().indexOf('butterfly wings');
const rawRanges = traitInputRanges(rawTrait, [{ start: trimmedStart, end: trimmedStart + 15 }]);
assert.equal(rawTrait.slice(rawRanges[0].start, rawRanges[0].end), 'butterfly wings');
assert.equal(traitHighlightParts(rawTrait, rawRanges).map(p => p.text).join(''), rawTrait);
assert.deepEqual(JSON.parse(JSON.stringify(traitInputRanges('zygodactyl toes', []))), []);
console.log('PASS: in-field offsets preserve leading whitespace and multiline source text');

const interactionDraft = load('lib/interactionDraft.ts');
const sampleBird = { id: 'unit-bird', name: 'Unit bird', imageUri: 'test-only-portrait' };
const handoff = interactionDraft.stageInteractionBird('unit-owner', sampleBird);
assert.equal(interactionDraft.readInteractionBird('unit-owner', handoff).imageUri, sampleBird.imageUri);
assert.equal(interactionDraft.readInteractionBird('other-owner', handoff), undefined);
assert.equal(interactionDraft.readInteractionBird('unit-owner', 'wrong-token'), undefined);
assert.equal(interactionDraft.readInteractionBird('unit-owner', undefined), undefined);
sampleBird.name = 'Changed after staging';
assert.equal(interactionDraft.readInteractionBird('unit-owner', handoff).name, 'Unit bird');
const replacement = interactionDraft.stageInteractionBird('unit-owner', sampleBird);
assert.equal(interactionDraft.readInteractionBird('unit-owner', handoff), undefined);
clock += 30 * 60 * 1000 + 1;
assert.equal(interactionDraft.readInteractionBird('unit-owner', replacement), undefined);
console.log('PASS: unsaved interaction handoff preserves portrait, isolates owners, replaces stale drafts and expires');

const recovery = load('lib/createRecovery.ts');
const generatedDraft = {
  step: 'result', mode: 'typed', sel: {}, typed: { body: 'compact' },
  expanded: {}, showExtra: true, extra: 'white eye spot',
  bird: sampleBird, birdName: '', nameDraft: 'My unfinished name',
  editingName: true, showNameDialog: true, popupName: '',
};
recovery.keepCreateRecoveryDraft('guest', generatedDraft);
recovery.parkGuestBirdForSignIn('guest', 'index', recovery.getCreateRecoveryDraft('guest'));
recovery.discardCreateRecoveryDraft('guest');
recovery.changeCreateRecoveryOwner('guest', 'signed-in-owner');
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner').bird.imageUri, sampleBird.imageUri);
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner').nameDraft, 'My unfinished name');
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner').extra, 'white eye spot');
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner').showNameDialog, false);
assert.equal(recovery.getCreateRecoveryDraft('guest'), undefined);
recovery.changeCreateRecoveryOwner('signed-in-owner', 'other-owner');
assert.equal(recovery.getCreateRecoveryDraft('other-owner'), undefined, 'never transfer between signed-in accounts');
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner'), undefined);
for (const destination of ['library', 'interactions', undefined]) {
  recovery.clearCreateRecoveryDrafts();
  recovery.parkGuestBirdForSignIn('guest', destination, generatedDraft);
  recovery.changeCreateRecoveryOwner('guest', 'signed-in-owner');
  assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner'), undefined, 'ordinary exits do not transfer');
}
recovery.parkGuestBirdForSignIn('guest', 'index', { ...generatedDraft, bird: null, step: 'build' });
recovery.changeCreateRecoveryOwner('guest', 'signed-in-owner');
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner'), undefined, 'only completed generated birds transfer');
recovery.parkGuestBirdForSignIn('guest', 'index', generatedDraft);
recovery.discardGuestSignInBird();
recovery.changeCreateRecoveryOwner('guest', 'signed-in-owner');
assert.equal(recovery.getCreateRecoveryDraft('signed-in-owner'), undefined, 'explicit reset cancels parked draft');
console.log('PASS: guest Home/sign-in handoff preserves generated bird and editing state without cross-account leakage');

recovery.clearCreateRecoveryDrafts();
recovery.parkGuestBirdForSignIn('guest', 'index', generatedDraft);
assert.equal(recovery.getCreateRecoveryDraft('early-mounted-owner').bird.id, sampleBird.id);
assert.equal(recovery.getCreateRecoveryDraft('unrelated-owner'), undefined, 'only the first authenticated owner can claim');
recovery.changeCreateRecoveryOwner('guest', 'early-mounted-owner');
assert.equal(recovery.getCreateRecoveryDraft('early-mounted-owner').nameDraft, generatedDraft.nameDraft,
  'parent auth cleanup preserves a draft claimed by an earlier child mount');
recovery.changeCreateRecoveryOwner('early-mounted-owner', 'guest');
assert.equal(recovery.getCreateRecoveryDraft('guest'), undefined, 'signing out never exposes account drafts');
console.log('PASS: early account screen mount and later auth cleanup preserve one-time guest handoff');
