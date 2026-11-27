const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, mocks) {
  const filename = resolve(__dirname, '..', relative);
  const mod = { exports: {} };
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React, esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(output, {
    exports: mod.exports, module: mod, queueMicrotask,
    require(name) {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected import ${name}`);
    },
  }, { filename });
  return mod.exports;
}

async function checkPortraits() {
  const platform = { OS: 'android' };
  const constants = { expoConfig: { android: { package: 'app.test.chirrup' } } };
  let assetUri = 'assets_images_mallardreference';
  let preparedBase64 = '/9j/AA==';
  let imageInput;
  let deleted = [];
  const portraits = load('lib/portraitReference.ts', {
    'expo-asset': { Asset: { fromModule: () => ({
      localUri: assetUri, uri: assetUri, downloadAsync: async () => {},
    }) } },
    'expo-constants': constants,
    'expo-image-manipulator': {
      SaveFormat: { JPEG: 'jpeg' },
      manipulateAsync: async (uri, actions, options) => {
        imageInput = uri;
        assert.equal(actions[0].resize.width, 768);
        assert.equal(options.base64, true);
        return { uri: 'file:///cache/prepared.jpg', base64: preparedBase64 };
      },
    },
    'expo-file-system/legacy': { deleteAsync: async (uri) => { deleted.push(uri); } },
    'react-native': { Platform: platform },
  });
  assert.equal(await portraits.portraitReference(17), 'data:image/jpeg;base64,/9j/AA==');
  assert.equal(imageInput, 'android.resource://app.test.chirrup/drawable/assets_images_mallardreference');
  assert.deepEqual(deleted, ['file:///cache/prepared.jpg']);

  for (const uri of ['file:///cache/mallard.png', 'https://example.org/mallard.png', 'asset:///mallard.png']) {
    assetUri = uri;
    await portraits.portraitReference(17);
    assert.equal(imageInput, uri, 'URI-based bundled assets must remain unchanged');
  }
  for (const uri of ['file:///journal/original.jpg', 'data:image/png;base64,iVBORw==']) {
    await portraits.portraitReference(uri);
    assert.equal(imageInput, uri, 'User portraits must remain unchanged');
    assert.ok(!deleted.includes(uri), 'Never delete a user portrait');
  }
  preparedBase64 = undefined;
  await assert.rejects(() => portraits.portraitReference(17), /could not be prepared/);
  preparedBase64 = 'A'.repeat(1_400_001);
  await assert.rejects(() => portraits.portraitReference(17), /too large/);
  assert.equal(deleted.at(-1), 'file:///cache/prepared.jpg', 'Clean temporary images even when preparation is rejected');
  preparedBase64 = '/9j/AA==';
  platform.OS = 'web';
  assetUri = '/assets/mallard.png';
  deleted = [];
  await portraits.portraitReference(17);
  assert.equal(imageInput, assetUri);
  assert.equal(deleted.length, 0);

  platform.OS = 'ios';
  assetUri = 'file:///bundle/mallard.png';
  await portraits.portraitReference(17);
  assert.equal(imageInput, assetUri);

  platform.OS = 'android';
  assetUri = 'assets_images_mallardreference';
  constants.expoConfig.android.package = undefined;
  await assert.rejects(() => portraits.portraitReference(17), /Android app package is missing/);
  console.log('PASS: Android release drawable resolution, ordinary URIs, iOS/web, bounded payload and original-image preservation');
}

function checkHighlightRendering() {
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    forwardRef: (render) => render,
    useCallback: (fn) => fn, useEffect: () => {}, useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => {}],
  };
  const palette = { primary: 'green', secondary: 'cream', destructive: 'red' };
  const { FieldInput } = load('components/FieldInput.tsx', {
    react,
    'react-native': {
      Platform: { OS: 'android' }, Text: 'Text', TextInput: 'TextInput', View: 'View',
      StyleSheet: { flatten: (style) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean)) },
    },
    '@/hooks/useColors': { useColors: () => palette },
    '@/lib/inputFocus': {},
    '@/lib/traitHighlights': load('lib/traitHighlights.ts', {}),
  });
  function elements(node) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...(node.children ?? []).flat(Infinity).flatMap(elements)];
  }
  const props = { testID: 'typed-trait', value: 'white feathers, catlike ears', onChangeText: () => {} };
  for (const ranges of [undefined, [], [{ start: 2, end: 2 }]]) {
    const nodes = elements(FieldInput({ ...props, highlightRanges: ranges }, null));
    assert.equal(nodes.filter(n => n.type === 'TextInput').length, 1);
    assert.equal(nodes.filter(n => n.type === 'Text').length, 0, 'Valid input must have no duplicated text layer');
  }
  const nodes = elements(FieldInput({ ...props, highlightRanges: [{ start: 16, end: 28 }] }, null));
  const spans = nodes.filter(n => n.type === 'Text');
  assert.ok(spans.length > 1, 'Keep in-field invalid-word highlighting');
  for (const span of spans) assert.equal(span.props.style.color, 'transparent', 'Every decoration must have invisible glyphs');
  assert.equal(spans.filter(n => n.props.style.backgroundColor === 'red').length, 1);
  assert.equal(nodes.find(n => n.type === 'TextInput').props.value, props.value);
  const overlay = nodes.find(n => n.props.testID === 'typed-trait-highlights');
  assert.equal(overlay.props.pointerEvents, 'none');
  assert.equal(overlay.props.importantForAccessibility, 'no-hide-descendants');
  console.log('PASS: no duplicate glyph layer in valid fields; invalid spans transparent, noninteractive and editable');
}

function checkLibrarySearchLifecycle() {
  let query = '';
  let focusEffect;
  const birds = [
    { id: 'duck', name: 'Mallard', habitat: 'Pond' },
    { id: 'owl', name: 'Owl', habitat: 'Forest' },
  ];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useCallback: (fn) => fn, useMemo: (fn) => fn(),
    useState: () => [query, (text) => { query = text; }],
  };
  const { default: Library } = load('app/(tabs)/library.tsx', {
    react,
    'react-native': {
      FlatList: 'FlatList', Image: 'Image', Platform: { OS: 'android' },
      Pressable: 'Pressable', Text: 'Text', View: 'View',
      StyleSheet: { create: (styles) => styles, hairlineWidth: 1 },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@expo/vector-icons': { Feather: 'Icon' },
    'expo-router': { useRouter: () => ({}), useFocusEffect: (fn) => { focusEffect = fn; } },
    '@/components/ui': { Button: 'Button', Eyebrow: 'Eyebrow', tap: () => {} },
    '@/components/ChirrupBrand': { ChirrupBrand: 'Brand' },
    '@/hooks/useColors': { useColors: () => ({ radius: 8 }) },
    '@/context/CollectionContext': { useCollection: () => ({ birds, loaded: true }) },
    '@/constants/fonts': { sans: {}, serif: 'Serif' },
    '@/lib/collectionStorage': { MAX_BIRDS: 100 },
    '@/components/FieldInput': { FieldInput: 'FieldInput' },
    '@/components/ScreenRecovery': { ScreenRecovery: 'ScreenRecovery' },
  });
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...(node.children ?? []).flat(Infinity).flatMap(nodes)];
  }
  const render = () => nodes(Library());
  const initial = render();
  assert.equal(initial.find(n => n.props.testID === 'search').props.value, '');
  const leaveLibrary = focusEffect();
  initial.find(n => n.props.testID === 'search').props.onChangeText('mallard');
  const searching = render();
  assert.equal(searching.find(n => n.props.testID === 'search').props.value, 'mallard');
  assert.equal(searching.find(n => n.type === 'FlatList').props.data.length, 1);
  assert.equal(query, 'mallard', 'Rerenders must not interrupt an active search');
  leaveLibrary();
  const returned = render();
  assert.equal(returned.find(n => n.props.testID === 'search').props.value, '');
  assert.equal(returned.find(n => n.type === 'FlatList').props.data.length, 2);
  const leaveAgain = focusEffect();
  returned.find(n => n.props.testID === 'search').props.onChangeText('owl');
  assert.equal(render().find(n => n.type === 'FlatList').props.data.length, 1);
  leaveAgain();
  assert.equal(render().find(n => n.props.testID === 'search').props.value, '');
  assert.equal(birds.length, 2, 'Clearing a search must not remove saved birds');
  console.log('PASS: library filters while typing, clears on route departure, restores all birds and resets on repeated visits');
}

(async () => {
  await checkPortraits();
  checkHighlightRendering();
  checkLibrarySearchLifecycle();
})().catch((error) => { console.error(error); process.exitCode = 1; });
