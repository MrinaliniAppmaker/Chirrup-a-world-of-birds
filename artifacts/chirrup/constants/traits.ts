export type TraitKey = 'body' | 'beak' | 'colors' | 'feathers' | 'legs' | 'feet';

export interface TraitOption {
  id: string;
  label: string;
  value: string;
  illustration?: string;
  description?: string;
  swatch?: string[];
}

export interface TraitGroup {
  key: TraitKey;
  title: string;
  hint: string;
  options: TraitOption[];
}

export const TRAIT_GROUPS: TraitGroup[] = [
  {
    key: 'body', title: 'Body shape', hint: 'Start here',
    options: [
      { id: 'songbird', label: 'Songbird', value: 'small, compact songbird body', illustration: 'songbird', description: 'Small & perching' },
      { id: 'waterfowl', label: 'Waterfowl', value: 'buoyant waterfowl body, broad and low', illustration: 'waterfowl', description: 'Rounded & buoyant' },
      { id: 'pheasant', label: 'Pheasant', value: 'full pheasant body with trailing tail', illustration: 'pheasant', description: 'Full body, trailing tail' },
      { id: 'raptor', label: 'Raptor', value: 'muscular raptor body with broad shoulders', illustration: 'raptor', description: 'Broad chest, strong stance' },
      { id: 'wader', label: 'Wader', value: 'slender long-necked wading bird body', illustration: 'wader', description: 'Long neck & slender legs' },
      { id: 'owl', label: 'Owl', value: 'rounded upright owl body with large head', illustration: 'owl', description: 'Upright & round-headed' },
      { id: 'hummingbird', label: 'Hummingbird', value: 'tiny hovering hummingbird body', illustration: 'hummingbird', description: 'Tiny & streamlined' },
      { id: 'pigeon', label: 'Pigeon', value: 'plump pigeon body with small head', illustration: 'pigeon', description: 'Plump, with a small head' },
      { id: 'woodpecker', label: 'Woodpecker', value: 'upright woodpecker body with braced tail', illustration: 'woodpecker', description: 'Upright, with a braced tail' },
    ],
  },
  {
    key: 'beak', title: 'Beak', hint: 'How it feeds',
    options: [
      { id: 'conical', label: 'Conical', value: 'short conical seed-cracking beak', illustration: 'conical', description: 'Short & seed-cracking' },
      { id: 'hooked', label: 'Raptor', value: 'sharp hooked raptor beak', illustration: 'hooked', description: 'Hooked & powerful' },
      { id: 'flat', label: 'Duckbill', value: 'flat broad duck-like bill', illustration: 'flat', description: 'Broad & flattened' },
      { id: 'probe', label: 'Needle', value: 'long thin nectar-reaching beak', illustration: 'probe', description: 'Slender & nectar-reaching' },
      { id: 'chisel', label: 'Chisel', value: 'straight wood-tapping chisel beak', illustration: 'chisel', description: 'Straight & wood-tapping' },
      { id: 'spear', label: 'Spear', value: 'long sharply pointed spear beak', illustration: 'spear', description: 'Long & sharply pointed' },
      { id: 'downcurved', label: 'Downcurved', value: 'downcurved probing beak', illustration: 'downcurved', description: 'Curved for probing' },
      { id: 'upcurved', label: 'Upcurved', value: 'slender upcurved sweep-feeding beak', illustration: 'upcurved', description: 'Slender & sweep-feeding' },
      { id: 'crossbill', label: 'Crossbill', value: 'crossed bill tips for opening cones', illustration: 'crossbill', description: 'Crossed tips for cones' },
    ],
  },
  {
    key: 'colors', title: 'Feather colours', hint: 'Palette',
    options: [
      { id: 'olive', label: 'Olive & buff', value: 'olive green back with buff underparts', swatch: ['#6F7A4C', '#C9B48A', '#6A5244'] },
      { id: 'chestnut', label: 'Chestnut', value: 'warm chestnut, rust and cocoa tones', swatch: ['#A9673F', '#C98B5E', '#5E463A'] },
      { id: 'slate', label: 'Slate & ivory', value: 'slate grey with ivory and charcoal', swatch: ['#5E6A70', '#E8E2D2', '#2F3436'] },
      { id: 'teal', label: 'Teal sheen', value: 'iridescent teal with copper highlights', swatch: ['#2F6E6A', '#5FA39A', '#B26E3C'] },
      { id: 'saffron', label: 'Saffron', value: 'saffron yellow with black accents', swatch: ['#D9A42B', '#F0D27A', '#2A2722'] },
      { id: 'rose', label: 'Dusky rose', value: 'dusky rose with dove grey', swatch: ['#B9787A', '#E2C3BC', '#8C8A86'] },
    ],
  },
  {
    key: 'feathers', title: 'Feather types', hint: 'Texture',
    options: [
      { id: 'flight', label: 'Down + flight', value: 'soft down with crisp flight feathers', illustration: 'basic', description: 'Soft body, defined wings' },
      { id: 'contour', label: 'Contour', value: 'sleek tight contour feathers', illustration: 'basic', description: 'Smooth, layered coverage' },
      { id: 'fine-down', label: 'Fine down', value: 'fine delicate fluffy down feathers', illustration: 'basic', description: 'Delicate, fluffy softness' },
      { id: 'flight-feathers', label: 'Flight feathers', value: 'long structured flight feathers', illustration: 'flightFeather', description: 'Long, structured vanes' },
      { id: 'tail-feathers', label: 'Tail feathers', value: 'broad balanced tail feathers', illustration: 'tailFeather', description: 'Balance & steering' },
      { id: 'semiplume', label: 'Semiplume', value: 'loose semiplume feathers with soft barbs', illustration: 'semiplume', description: 'Soft, loosely branched' },
      { id: 'powder-down', label: 'Powder down', value: 'powder-producing down feathers', illustration: 'powderDown', description: 'Fine, protective down' },
      { id: 'bristles', label: 'Bristles', value: 'stiff protective bristle feathers around the beak', illustration: 'bristles', description: 'Stiff, protective shafts' },
      { id: 'filoplumes', label: 'Filoplumes', value: 'hairlike filoplume feathers with sparse tips', illustration: 'filoplumes', description: 'Fine, hairlike shafts' },
    ],
  },
];

export const LEG_OPTIONS: TraitOption[] = [
  { id: 'short-pink', label: 'Short, pinkish brown', value: 'short pinkish-brown legs' },
  { id: 'long-wading', label: 'Long, wading', value: 'long slender wading legs' },
  { id: 'feathered', label: 'Feathered', value: 'thickly feathered legs' },
  { id: 'stout-yellow', label: 'Stout, yellow', value: 'stout yellow scaled legs' },
  { id: 'tiny-black', label: 'Tiny, black', value: 'tiny delicate black legs' },
];

export const FEET_OPTIONS: TraitOption[] = [
  { id: 'perching', label: 'Perching feet', value: 'perching feet with three toes forward' },
  { id: 'webbed', label: 'Webbed feet', value: 'fully webbed paddling feet' },
  { id: 'talons', label: 'Talons', value: 'curved grasping talons' },
  { id: 'zygodactyl', label: 'Zygodactyl', value: 'zygodactyl climbing feet, two toes back' },
  { id: 'lobed', label: 'Lobed toes', value: 'lobed swimming toes' },
];

export const TRAIT_LABELS: Record<TraitKey, string> = {
  body: 'Body', beak: 'Beak', colors: 'Colours', feathers: 'Feathers', legs: 'Legs', feet: 'Feet',
};
