// Deterministic gradient for an NPO's hero/avatar, derived from its name so the
// same NPO always gets the same colour across every dashboard (Individual, NPO,
// Business). Used as the fallback background when there's no profile image.
const NPO_GRADIENTS = [
  "from-orange-400 to-orange-600",
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
  "from-amber-400 to-amber-600",
  "from-indigo-400 to-indigo-600",
];

export function getNpoColor(name: string): string {
  const key = name && name.length > 0 ? name.charCodeAt(0) : 0;
  return NPO_GRADIENTS[key % NPO_GRADIENTS.length];
}
