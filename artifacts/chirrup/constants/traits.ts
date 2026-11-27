export type TraitKey = 'body' | 'beak' | 'colors' | 'feathers' | 'legs' | 'feet';

export interface TraitOption {
  id: string;
  label: string;
  value: string;
  reviewLabel?: string;
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

// Specialist profiles from the user's expanded Refine Beak Silhouettes screen.
export const WATERBIRD_BEAK_OPTIONS: TraitOption[] = [
  { id: 'spear', label: 'Spear', value: 'long, straight, sharply pointed spear-shaped beak', illustration: 'spear', description: 'Long & sharply pointed' },
  { id: 'water-probe', label: 'Probe', value: 'long slender mud-probing beak, gently downcurved toward its fine tip', illustration: 'water-probe', description: 'Slender & mud-probing' },
  { id: 'spoonbill', label: 'Spoonbill', value: 'long flat bill with a distinctly widened spoon-shaped tip', illustration: 'spoonbill', description: 'Flat & spoon-tipped' },
  { id: 'pelican', label: 'Pelican', value: 'long pelican-like bill with an expandable pouch beneath the lower mandible', illustration: 'pelican', description: 'Long with a deep pouch' },
  { id: 'skimmer', label: 'Skimmer', value: 'laterally compressed skimmer bill with the lower mandible visibly longer than the upper mandible', illustration: 'skimmer', description: 'Long lower mandible' },
  { id: 'flamingo', label: 'Flamingo', value: 'deep filter-feeding bill with a pronounced downward bend halfway along its length', illustration: 'flamingo', description: 'Bent & filter-feeding' },
  { id: 'shoebill', label: 'Shoebill', value: 'massive broad shoe-shaped bill with a deep upper mandible and a hooked tip', illustration: 'shoebill', description: 'Massive & shoe-shaped' },
  { id: 'avocet', label: 'Avocet', value: 'long slender upcurved beak, with both mandibles curving upward toward the raised fine tip', illustration: 'avocet', description: 'Slender & upcurved' },
  { id: 'openbill', label: 'Openbill', value: 'arched openbill beak with a conspicuous central gap between the closed upper and lower mandibles, meeting only at the base and tip', illustration: 'openbill', description: 'Arched with a snail gap' },
  { id: 'merganser', label: 'Merganser', value: 'long narrow saw-toothed bill with visible fine serrations along the cutting edges of both mandibles', illustration: 'merganser', description: 'Narrow & saw-toothed' },
  { id: 'cormorant', label: 'Cormorant', value: 'long slender mostly straight bill ending in a distinctly down-hooked upper tip', illustration: 'cormorant', description: 'Slender with a hooked tip' },
];

export const TRAIT_GROUPS: TraitGroup[] = [
  {
    key: 'body', title: 'Body shape', hint: 'Start here',
    options: [
      { id: 'songbird', label: 'Perching bird', value: 'small, compact perching bird body', illustration: 'songbird', description: 'Small & perching' },
      { id: 'waterfowl', label: 'Waterfowl', value: 'buoyant waterfowl body, broad and low', illustration: 'waterfowl', description: 'Rounded & buoyant' },
      { id: 'pheasant', label: 'Pheasant', value: 'full pheasant body with trailing tail', illustration: 'pheasant', description: 'Full body, trailing tail' },
      { id: 'raptor', label: 'Raptor', value: 'muscular raptor body with broad shoulders', illustration: 'raptor', description: 'Broad chest, strong stance' },
      { id: 'wader', label: 'Wading bird', value: 'slender long-necked wading bird body', illustration: 'wader', description: 'Long-legged & long-necked' },
      { id: 'penguin', label: 'Penguin', value: 'upright streamlined flightless penguin body with short flipper-shaped wings', illustration: 'penguin', description: 'Upright & flightless' },
      { id: 'ratite', label: 'Ratite', value: 'large-bodied flightless ratite body with a long neck and small wings', illustration: 'ratite', description: 'Large-bodied & long-legged' },
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
      { id: 'downcurved', label: 'Downcurved', value: 'downcurved flower-probing beak', illustration: 'downcurved', description: 'Curved & flower-probing' },
      { id: 'crossbill', label: 'Crossbill', value: 'crossed bill tips for opening cones', illustration: 'crossbill', description: 'Crossed tips for cones' },
      { id: 'parrot', label: 'Parrot', value: 'deep curved nut-cracking parrot beak with a thick hooked upper mandible', illustration: 'parrot', description: 'Deep & nut-cracking' },
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
      { id: 'contour', label: 'Contour', value: 'sleek tight contour feathers', illustration: 'contour', description: 'Smooth, layered coverage' },
      { id: 'fine-down', label: 'Fine down', value: 'fine delicate fluffy down feathers', illustration: 'fineDown', description: 'Delicate, fluffy softness' },
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
  { id: 'lobed', label: 'Lobed toes', reviewLabel: 'lobed, scalloped paddling toes', value: 'lobed swimming toes, each toe edged with scalloped side lobes and open gaps between toes, no webbing between toes' },
];

export const TRAIT_LABELS: Record<TraitKey, string> = {
  body: 'Body', beak: 'Beak', colors: 'Colours', feathers: 'Feathers', legs: 'Legs', feet: 'Feet',
};
