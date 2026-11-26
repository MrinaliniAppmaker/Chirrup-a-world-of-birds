const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const file = path.resolve(__dirname, '../components/ReportContent.tsx');
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'send') handler = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handler);
const js = ts.transpileModule(`module.exports = ${handler}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ imageFails = false, rejects = 0, received = true } = {}) {
  const results = { requests: [], errors: [], receipts: [], prepared: 0 };
  const pending = { current: null };
  const lock = { current: false };
  const mod = { exports: {} };
  const context = {
    module: mod, snapshot: { id: 'bird-one', title: 'My bird', text: 'Exact traits', imageUri: 'file://fixture' },
    lock, pending, submissionId: { current: 'same-id-on-retry' },
    includeImage: true, surface: 'creation', reason: 'inaccurate', details: '  Wrong toes  ',
    setBusy: () => {}, setError: e => results.errors.push(e), setReceipt: r => results.receipts.push(r),
    portraitReference: async () => { results.prepared++; if (imageFails) throw new Error('unreadable'); return 'data:image/jpeg;base64,fixture'; },
    submit: { mutateAsync: async payload => {
      results.requests.push(payload.data);
      if (rejects-- > 0) throw new Error('network lost');
      return { id: 'stored-reference', received };
    } },
  };
  vm.runInNewContext(js, context);
  return { send: mod.exports, results, context };
}

(async () => {
  const retry = setup({ rejects: 1 });
  await retry.send();
  assert.equal(retry.results.receipts.length, 0, 'never claim success before backend receipt');
  assert.equal(retry.context.lock.current, false, 'failure releases submit lock');
  await retry.send();
  assert.equal(retry.results.prepared, 1);
  assert.equal(retry.results.requests[0], retry.results.requests[1], 'retry sends the exact cached report');
  assert.equal(retry.results.requests[0].details, 'Wrong toes');
  assert.equal(retry.results.receipts[0], 'stored-reference');
  const noImage = setup({ imageFails: true });
  await noImage.send();
  assert.equal(noImage.results.requests.length, 0, 'do not silently omit requested image evidence');
  assert.equal(noImage.results.receipts.length, 0);
  noImage.context.includeImage = false;
  await noImage.send();
  assert.equal(noImage.results.requests.length, 1, 'user can explicitly submit without the picture');
  const falseReceipt = setup({ received: false });
  await falseReceipt.send();
  assert.equal(falseReceipt.results.receipts.length, 0);
  const locked = setup();
  locked.context.lock.current = true;
  await locked.send();
  assert.equal(locked.results.requests.length, 0, 'double taps do not duplicate submissions');
  console.log('PASS: report form retries, stored receipts, explicit image consent, failure preservation and double-submit guard.');
})().catch(error => { console.error(error); process.exitCode = 1; });
