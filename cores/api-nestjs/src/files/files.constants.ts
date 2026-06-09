import { FileCategory } from '@prisma/client';

/**
 * Politique déclarative MIME/extension (ADR-007 §16), configuration interne structurée
 * (préférée à une multiplication de variables d'environnement). Le MIME déclaré par le
 * client n'est PAS une preuve : l'inspection du contenu/signatures magiques relèvera
 * d'Upload 2.
 */
export const ALLOWED_MIME_BY_CATEGORY: Record<FileCategory, readonly string[]> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  AVATAR: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENT: ['application/pdf'],
  IDENTITY_DOCUMENT: ['application/pdf', 'image/jpeg', 'image/png'],
  VIDEO: ['video/mp4', 'video/webm'],
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
  MEDIA: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg'],
  ATTACHMENT: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
  OTHER: ['application/octet-stream'],
};

/** Extensions attendues par MIME (cohérence extension ↔ MIME). */
export const EXTENSIONS_BY_MIME: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'audio/mpeg': ['mp3'],
  'audio/ogg': ['ogg'],
  'audio/wav': ['wav'],
  'text/plain': ['txt'],
  'application/octet-stream': ['bin'],
};

/** Extension normalisée valide : minuscules alphanumériques, bornée (anti-traversal). */
export const EXTENSION_PATTERN = /^[a-z0-9]{1,12}$/;
