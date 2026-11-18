type Participant = { diet: string };

// Insects do not make a bird a predator of other participating birds.
// Use diet, never a user-chosen name or a hooked bill alone, as evidence.
function feedingRole(diet: string) {
  const food = diet.split(/[.;]|\bbut\b/i)
    .filter((clause) => !/\b(?:never|does not|doesn't|no|not|without|avoids?)\b/i.test(clause))
    .join(" ");
  const birds = /\b(?:birds?|songbirds?|nestlings?|fledglings?|chicks?|avian prey)\b/i.test(food);
  const vertebrates = birds || /\b(?:fish|fishes|frogs?|lizards?|mice|rats?|rodents?|mammals?|vertebrates?)\b/i.test(food);
  return { birds, vertebrates };
}

export function encounterMortalityPolicy(birds: readonly Participant[], random: () => number = Math.random): string {
  const roles = birds.map((bird) => feedingRole(bird.diet));
  const preyPairs: string[] = [];
  const predatorPairs: string[] = [];
  roles.forEach((role, hunter) => {
    roles.forEach((other, target) => {
      if (hunter === target) return;
      if (role.birds && !other.vertebrates) preyPairs.push(`BIRD_${hunter + 1} hunting BIRD_${target + 1}`);
      if (hunter < target && role.vertebrates && other.vertebrates) predatorPairs.push(`BIRD_${hunter + 1} and BIRD_${target + 1}`);
    });
  });
  if (preyPairs.length && random() < 0.35) {
    return `A fatal predation outcome is PERMITTED ONLY for these suitable diet-based hunter/prey pairs, and only if size, opportunity and defenses make it likely: ${preyPairs.join("; ")}. It is not required. All other pairs must remain nonfatal. Never invent a new bird-eating diet to justify a kill.`;
  }
  if (predatorPairs.length && random() < 0.08) {
    return `An exceptional fatal conflict is PERMITTED ONLY between these competing vertebrate predators, if relative size and circumstances strongly justify it: ${predatorPairs.join("; ")}. Death is optional, not compulsory. Do not kill any non-predatory participant or invent predation between incompatible diets.`;
  }
  return "NONFATAL ENCOUNTER: all participants survive all five minutes. Hunting attempts, fleeing, threat displays and nonfatal competition are allowed; no killing, eating a participant, lethal injury, accidental death or implied off-screen death. Do not invent deaths for drama.";
}
