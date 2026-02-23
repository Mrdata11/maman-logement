/**
 * Mots-clés dans les URLs d'images qui indiquent un flyer/affiche/poster
 * plutôt qu'une photo naturelle.
 */
const FLYER_KEYWORDS = [
  "flyer",
  "affiche",
  "poster",
  "conferencia",
  "taller",
  "jornada",
  "anuncio",
  "cartel",
  "visuel_web",
  "CONFERENCIA",
  "TALLER",
  "JORNADA",
];

/**
 * Réordonne les images pour mettre les photos naturelles en premier
 * et les flyers/affiches en dernier.
 */
export function prioritizePhotos(images: string[]): string[] {
  if (images.length <= 1) return images;

  const isLikelyFlyer = (url: string) => {
    const lower = url.toLowerCase();
    return FLYER_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  };

  const photos = images.filter((img) => !isLikelyFlyer(img));
  const flyers = images.filter((img) => isLikelyFlyer(img));

  return [...photos, ...flyers];
}
