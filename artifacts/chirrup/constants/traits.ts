export type TraitKey = 'body' | 'beak' | 'colors' | 'feathers' | 'legs' | 'feet';

export interface TraitOption {
  id: string;
  label: string;
  value: string;
  icon?: string; // MaterialCommunityIcons name
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
      { id: 'songbird', label: 'Songbird', value: 'small, compact songbird body', icon: 'bird' },
      { id: 'waterfowl', label: 'Waterfowl', value: 'buoyant waterfowl body, broad and low', icon: 'duck' },
      { id: 'raptor', label: 'Raptor', value: 'muscular raptor body with broad shoulders', icon: 'bird' },
      { id: 'wader', label: 'Wader', value: 'slender long-necked wading bird body', icon: 'feather' },
      { id: 'hummingbird', label: 'Hummer', value: 'tiny hovering hummingbird body', icon: 'flower-tulip-outline' },
      { id: 'owl', label: 'Owl', value: 'rounded upright owl body with large head', icon: 'owl' },
    ],
  },
  {
    key: 'beak', title: 'Beak', hint: 'How it feeds',
    options: [
      { id: 'conical', label: 'Conical', value: 'short conical seed-cracking beak', icon: 'triangle-outline' },
      { id: 'hooked', label: 'Hooked', value: 'sharp hooked raptor beak', icon: 'hook' },
      { id: 'flat', label: 'Flat bill', value: 'flat broad duck-like bill', icon: 'minus-thick' },
      { id: 'probe', label: 'Long probe', value: 'long thin probing beak', icon: 'needle' },
      { id: 'thin', label: 'Fine tip', value: 'fine pointed insect-catching beak', icon: 'pencil-outline' },
      { id: 'casque', label: 'Casqued', value: 'large curved beak with a casque', icon: 'banana' },
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
      { id: 'flight', label: 'Down + flight', value: 'soft down with crisp flight feathers', icon: 'feather' },
      { id: 'contour', label: 'Contour', value: 'sleek tight contour feathers', icon: 'waves' },
      { id: 'crest', label: 'Crested', value: 'tall upright crest of plumes', icon: 'crown-outline' },
      { id: 'streamers', label: 'Streamers', value: 'long ornamental tail streamers', icon: 'tailwind' },
      { id: 'fluffy', label: 'Fluffy', value: 'fluffy puffed-out plumage', icon: 'cloud-outline' },
      { id: 'scaled', label: 'Scalloped', value: 'scalloped scale-like patterning', icon: 'texture' },
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
