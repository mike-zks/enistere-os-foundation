import { z } from "zod";

export const FILE_CATEGORY_VALUES = [
  "IMAGE",
  "DOCUMENT",
  "AVATAR",
  "MEDIA",
  "VIDEO",
  "AUDIO",
  "IDENTITY_DOCUMENT",
  "ATTACHMENT",
  "OTHER",
] as const;

export const SUBJECT_ID_MAX_LENGTH = 128;

export const uploadFormSchema = z.object({
  file: z.instanceof(File, { message: "Fichier requis." }),
  category: z.enum(FILE_CATEGORY_VALUES, { error: "Catégorie requise." }),
  subjectId: z
    .string()
    .max(SUBJECT_ID_MAX_LENGTH, { message: `Maximum ${String(SUBJECT_ID_MAX_LENGTH)} caractères.` })
    .optional(),
});

export type UploadFormValues = z.infer<typeof uploadFormSchema>;
