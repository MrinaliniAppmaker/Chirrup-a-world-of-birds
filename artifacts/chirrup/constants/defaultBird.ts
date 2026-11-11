import type { EncounterBird } from '@workspace/api-client-react';

export const DEFAULT_BIRD_ID = 'reference-mallard';

// Factual reference species. Never written to the user's collection.
export const DEFAULT_MALLARD: EncounterBird & { scientificName: string } = {
  id: DEFAULT_BIRD_ID,
  name: 'Mallard',
  scientificName: 'Anas platyrhynchos',
  traits: {
    body: 'Medium-large dabbling duck with a heavy, boat-shaped body',
    beak: 'Broad, flat yellow duckbill',
    colors: 'Iridescent green head, white neck ring, chestnut-brown breast, gray body',
    feathers: 'Waterproof plumage with a blue speculum bordered in white; curled black tail feathers',
    legs: 'Short orange legs',
    feet: 'Orange webbed feet',
    extra: 'Breeding male plumage',
  },
  appearance: 'A male mallard: glossy green head, narrow white collar, chestnut-brown breast, pale gray flanks and back, black rump with curled tail feathers, a broad yellow bill and bright orange legs and webbed feet.',
  habitat: 'Freshwater wetlands of almost every kind: ponds, marshes, lakes, rivers, flooded fields and city parks across the Northern Hemisphere.',
  diet: 'Omnivorous dabbler. Tips up to feed on aquatic plants, seeds, grains, insects and their larvae, snails, and small crustaceans near the surface.',
  behavior: 'Social and adaptable. Dabbles rather than dives, takes off almost vertically from water, gathers in loose flocks outside the breeding season, and drakes give a soft raspy call while females make the familiar loud quack.',
};

export const MALLARD_IMAGE = require('@/assets/images/mallard-reference.png');
