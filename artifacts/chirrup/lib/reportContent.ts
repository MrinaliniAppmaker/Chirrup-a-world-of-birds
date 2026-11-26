import type { GeneratedBird, GeneratedEncounter } from '@workspace/api-client-react';
import type { ReportableContent } from '@/components/ReportContent';

export function birdReportContent(bird: GeneratedBird, name = bird.name): ReportableContent {
  return {
    id: bird.id, title: name.trim() || 'Unnamed bird', imageUri: bird.imageUri,
    text: [
      bird.tagline, bird.appearance, bird.habitat, bird.diet, bird.behavior,
      ...Object.entries(bird.traits).map(([key, value]) => `${key}: ${value}`),
    ].filter(Boolean).join('\n\n'),
  };
}

export function encounterReportContent(result: GeneratedEncounter): ReportableContent {
  return {
    id: 'interaction', title: result.title, imageUri: result.imageUri,
    text: [result.habitat, result.summary, ...result.minutes.map(m => `Minute ${m.minute}: ${m.title}\n${m.description}`)].join('\n\n'),
  };
}
