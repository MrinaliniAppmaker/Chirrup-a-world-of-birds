const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const mod = { exports: {} };
let timers = 0;
const output = ts.transpileModule(readFileSync(resolve(__dirname, '../lib/googlePopup.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(output, {
  exports: mod.exports, module: mod,
  setInterval(fn, delay) { timers++; return setInterval(fn, delay); },
  clearInterval(id) { timers--; clearInterval(id); },
});
const { waitForGooglePopup } = mod.exports;
const options = { pollMs: 1, closeGraceMs: 3, maxWaitMs: 100 };
const never = () => new Promise(() => {});
async function main() {
  const completed = await waitForGooglePopup(Promise.resolve('signed in'), () => false, new AbortController().signal, options);
  assert.equal(completed.kind, 'completed'); assert.equal(completed.value, 'signed in');
  assert.equal((await waitForGooglePopup(never(), () => true, new AbortController().signal, options)).kind, 'closed');
  const successfulClose = new Promise(resolve => setTimeout(() => resolve('callback'), 3));
  assert.equal((await waitForGooglePopup(successfulClose, () => true, new AbortController().signal, { ...options, closeGraceMs: 30 })).kind, 'completed');
  const controller = new AbortController();
  const aborted = waitForGooglePopup(never(), () => false, controller.signal, options);
  controller.abort();
  assert.equal((await aborted).kind, 'aborted');
  assert.equal((await waitForGooglePopup(never(), () => false, new AbortController().signal, { ...options, maxWaitMs: 3 })).kind, 'timeout');
  await assert.rejects(waitForGooglePopup(Promise.reject(new Error('provider error')), () => false, new AbortController().signal, options), /provider error/);
  assert.equal(timers, 0);
  console.log('PASS: popup success, cancellation, successful-close grace, unmount, timeout, provider errors and timer cleanup');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
