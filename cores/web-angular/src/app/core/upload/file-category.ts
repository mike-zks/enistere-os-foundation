export type FileCategory =
  | 'IMAGE'
  | 'DOCUMENT'
  | 'AVATAR'
  | 'VIDEO'
  | 'AUDIO'
  | 'IDENTITY_DOCUMENT'
  | 'ATTACHMENT'
  | 'MEDIA'
  | 'OTHER';

export const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'AVATAR', label: 'Avatar' },
  { value: 'VIDEO', label: 'Vidéo' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'IDENTITY_DOCUMENT', label: "Pièce d'identité" },
  { value: 'ATTACHMENT', label: 'Pièce jointe' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'OTHER', label: 'Autre' },
];
