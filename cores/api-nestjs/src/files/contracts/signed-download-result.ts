/**
 * Contrat PUBLIC d'un accès temporaire (Upload 3). Volontairement MINIMAL : seulement l'URL
 * signée et son instant d'expiration. N'expose jamais `bucket`, `storageKey`, `checksum`,
 * de credentials, de signature séparée ni de paramètre interne.
 *
 * Le contrat public du fichier (`file`) n'est pas inclus : il est déjà disponible via
 * `GET /files/:id`, ce qui évite de dupliquer/élargir la surface de cette réponse sensible.
 */
export interface SignedDownloadResult {
  url: string;
  expiresAt: Date;
}
