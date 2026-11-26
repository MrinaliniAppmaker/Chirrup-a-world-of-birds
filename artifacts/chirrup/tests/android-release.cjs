const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { productionConfig } = require('../scripts/production-config.cjs');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
assert.equal(config.android.package, 'app.chirrupaworldofbirdsgeneratingapp.mrinalinikhetan');
assert.ok(Number.isInteger(config.android.versionCode) && config.android.versionCode > 0);
assert.equal(config.icon, './assets/images/chirrup-icon.png');
assert.equal(config.android.adaptiveIcon.foregroundImage, config.icon);
assert.ok(fs.existsSync(path.resolve(root, config.android.adaptiveIcon.foregroundImage)));
for (const permission of [
  'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION',
  'CAMERA', 'RECORD_AUDIO', 'SYSTEM_ALERT_WINDOW', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
  'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_MEDIA_AUDIO',
]) assert.ok(config.android.blockedPermissions.includes(`android.permission.${permission}`), permission);
const pickerPlugin = config.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-image-picker');
assert.equal(pickerPlugin[1].cameraPermission, false);
assert.equal(pickerPlugin[1].microphonePermission, false);

const live = { CLERK_PUBLISHABLE_KEY: 'pk_live_test_fixture_not_a_real_key' };
assert.deepEqual(productionConfig({ ...live, EXPO_PUBLIC_DOMAIN: 'birds.example.org' }), { domain: 'birds.example.org' });
assert.deepEqual(productionConfig({
  ...live, REPLIT_INTERNAL_APP_DOMAIN: 'https://birds.example.org',
  REPLIT_DEV_DOMAIN: 'workspace.replit.dev',
}), { domain: 'birds.example.org' });
for (const value of [
  'workspace.replit.dev', 'https://workspace.replit.dev', 'http://birds.example.org',
  'localhost', '127.0.0.1', '[::1]', 'birds.local', 'birds.test', 'birds.invalid',
  'https://user:password@birds.example.org', 'https://birds.example.org/api',
  'https://birds.example.org?query=yes', 'https://birds.example.org#fragment',
  'https://birds.example.org:8080', 'https://',
]) assert.throws(() => productionConfig({ ...live, EXPO_PUBLIC_DOMAIN: value }), value);
assert.throws(() => productionConfig({ ...live, REPLIT_DEV_DOMAIN: 'workspace.replit.dev' }), /published backend/);
for (const key of [undefined, '', 'pk_test_not_a_real_key', 'sk_live_not_a_real_key']) {
  assert.throws(() => productionConfig({ EXPO_PUBLIC_DOMAIN: 'birds.example.org', CLERK_PUBLISHABLE_KEY: key }), /live Clerk/);
}

// Exercise the actual profile picker handler on each platform, without a
// device or uploading/replacing anybody's real profile picture.
const authKit = fs.readFileSync(path.join(root, 'components/AuthKit.tsx'), 'utf8');
const source = ts.createSourceFile('AuthKit.tsx', authKit, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'changePhoto') handler = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handler);
async function checkPicker(os, granted, cancelled = false) {
  const calls = [];
  let pending = null;
  const code = ts.transpileModule(`module.exports = ${handler}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, Platform: { OS: os }, photoLock: { current: false },
    user: { id: 'test-profile-owner' }, setPhotoError: (e) => { if (e) calls.push('error'); },
    setPhotoNotice: () => {}, setPendingPhoto: (p) => { pending = p; },
    readableError: () => 'picker failed',
    ImagePicker: {
      requestMediaLibraryPermissionsAsync: async () => { calls.push('permission'); return { granted }; },
      launchImageLibraryAsync: async () => {
        calls.push('picker');
        return cancelled ? { canceled: true } : { canceled: false, assets: [{ uri: 'test://portrait', base64: 'fixture', mimeType: 'image/jpeg' }] };
      },
    },
  });
  await mod.exports();
  return { calls, pending };
}
(async () => {
  for (const os of ['android', 'web']) {
    const result = await checkPicker(os, false);
    assert.deepEqual(result.calls, ['picker'], `${os} uses selected-photo access without broad permission`);
    assert.equal(result.pending.owner, 'test-profile-owner');
    assert.equal((await checkPicker(os, false, true)).pending, null);
  }
  assert.deepEqual((await checkPicker('ios', false)).calls, ['permission', 'error']);
  assert.deepEqual((await checkPicker('ios', true)).calls, ['permission', 'picker']);
  console.log('PASS: Android release configuration, production-domain/live-key safeguards, and profile picker permission/cancellation behaviour.');
})().catch(error => { console.error(error); process.exitCode = 1; });
