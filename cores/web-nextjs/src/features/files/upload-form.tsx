"use client";

import {
  Alert,
  Button,
  FormField,
  FormFieldError,
  FormFieldLabel,
  Input,
  Select,
  Text,
} from "@enistere/ui-kit";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef, type ReactElement } from "react";
import { useForm } from "react-hook-form";

import type { FileCategory } from "@enistere/api-client-fetch";

import {
  FILE_CATEGORY_VALUES,
  SUBJECT_ID_MAX_LENGTH,
  uploadFormSchema,
  type UploadFormValues,
} from "./upload-form-schema.js";
import { useUploadFile } from "./use-upload-file.js";

const FILE_CATEGORIES: ReadonlyArray<{ value: FileCategory; label: string }> = [
  { value: "IMAGE", label: "Image" },
  { value: "DOCUMENT", label: "Document" },
  { value: "AVATAR", label: "Avatar" },
  { value: "MEDIA", label: "Média" },
  { value: "VIDEO", label: "Vidéo" },
  { value: "AUDIO", label: "Audio" },
  { value: "IDENTITY_DOCUMENT", label: "Pièce d'identité" },
  { value: "ATTACHMENT", label: "Pièce jointe" },
  { value: "OTHER", label: "Autre" },
];

/**
 * Formulaire d'upload **présentationnel** (Client Component) : validation UX uniquement (l'API Core reste
 * l'autorité MIME/taille/permissions, ADR-007). Aucun log de nom/chemin/contenu. Anti-double-soumission
 * géré dans `useUploadFile`. Session via cookies HttpOnly (ADR-005).
 */
export function UploadForm(): ReactElement {
  const fileInputId = useId();
  const categoryId = useId();
  const subjectIdId = useId();
  const fileErrorId = `${fileInputId}-error`;
  const categoryErrorId = `${categoryId}-error`;
  const subjectIdErrorId = `${subjectIdId}-error`;

  const { upload, isPending, uploadedFile, error, reset } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset: rhfReset,
    formState: { errors, isSubmitted },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: { category: "" as UploadFormValues["category"], subjectId: "" },
  });

  const fileError = errors.file?.message;
  const categoryError = errors.category?.message;
  const subjectIdError = errors.subjectId?.message;

  const handleReset = (): void => {
    reset();
    rhfReset();
    setValue("file", undefined as unknown as File);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: UploadFormValues): void => {
    reset();
    upload({
      file: values.file,
      category: values.category,
      subjectId: values.subjectId?.trim() || undefined,
    });
  };

  if (uploadedFile) {
    return (
      <section aria-label="Fichier envoyé">
        <Alert variant="success" title="Fichier envoyé">
          {uploadedFile.originalName} — {uploadedFile.category}
        </Alert>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Envoyer un autre fichier
        </Button>
      </section>
    );
  }

  return (
    <form
      className="upload-form"
      aria-label="Envoi de fichier"
      aria-busy={isPending}
      noValidate
      onSubmit={(ev) => void handleSubmit(onSubmit)(ev)}
    >
      <Text as="h1" variant="display">
        Envoyer un fichier
      </Text>

      {error ? (
        <Alert variant="danger" title="Erreur lors de l'envoi">
          {error.message}
        </Alert>
      ) : null}

      <FormField>
        <FormFieldLabel htmlFor={fileInputId} required>
          Fichier
        </FormFieldLabel>
        <Input
          ref={(el) => {
            fileInputRef.current = el;
          }}
          id={fileInputId}
          name="file"
          type="file"
          required
          invalid={fileError !== undefined}
          aria-describedby={fileError !== undefined ? fileErrorId : undefined}
          disabled={isPending}
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            setValue("file", f ?? (undefined as unknown as File), {
              shouldValidate: isSubmitted,
            });
          }}
        />
        {fileError ? <FormFieldError id={fileErrorId}>{fileError}</FormFieldError> : null}
      </FormField>

      <FormField>
        <FormFieldLabel htmlFor={categoryId} required>
          Catégorie
        </FormFieldLabel>
        <Select
          {...register("category")}
          id={categoryId}
          required
          invalid={categoryError !== undefined}
          aria-describedby={categoryError !== undefined ? categoryErrorId : undefined}
          disabled={isPending}
        >
          <option value="">-- Choisir une catégorie --</option>
          {FILE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        {categoryError ? (
          <FormFieldError id={categoryErrorId}>{categoryError}</FormFieldError>
        ) : null}
      </FormField>

      <FormField>
        <FormFieldLabel htmlFor={subjectIdId}>Référence (optionnelle)</FormFieldLabel>
        <Input
          {...register("subjectId")}
          id={subjectIdId}
          type="text"
          maxLength={SUBJECT_ID_MAX_LENGTH}
          invalid={subjectIdError !== undefined}
          aria-describedby={subjectIdError !== undefined ? subjectIdErrorId : undefined}
          disabled={isPending}
        />
        {subjectIdError ? (
          <FormFieldError id={subjectIdErrorId}>{subjectIdError}</FormFieldError>
        ) : null}
      </FormField>

      <Button
        type="submit"
        variant="primary"
        loading={isPending}
        loadingText="Envoi en cours…"
        disabled={isPending}
      >
        Envoyer
      </Button>
    </form>
  );
}
