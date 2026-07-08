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
import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";

import type { FileCategory } from "@enistere/api-client-fetch";

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

const SUBJECT_ID_MAX = 128;

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

  const [file, setFile] = useState<File | undefined>(undefined);
  const [category, setCategory] = useState<FileCategory | "">("");
  const [subjectId, setSubjectId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileError = submitted && !file ? "Fichier requis." : undefined;
  const categoryError = submitted && !category ? "Catégorie requise." : undefined;
  const subjectIdError =
    submitted && subjectId.length > SUBJECT_ID_MAX
      ? `Maximum ${String(SUBJECT_ID_MAX)} caractères.`
      : undefined;

  const handleReset = (): void => {
    reset();
    setFile(undefined);
    setCategory("");
    setSubjectId("");
    setSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (ev: FormEvent<HTMLFormElement>): void => {
    ev.preventDefault();
    setSubmitted(true);
    if (!file || !category || subjectId.length > SUBJECT_ID_MAX) return;
    reset();
    upload({ file, category, subjectId: subjectId.trim() || undefined });
  };

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>): void => {
    setFile(ev.target.files?.[0] ?? undefined);
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
      onSubmit={handleSubmit}
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
          ref={fileInputRef}
          id={fileInputId}
          name="file"
          type="file"
          required
          invalid={fileError !== undefined}
          aria-describedby={fileError !== undefined ? fileErrorId : undefined}
          disabled={isPending}
          onChange={handleFileChange}
        />
        {fileError ? <FormFieldError id={fileErrorId}>{fileError}</FormFieldError> : null}
      </FormField>

      <FormField>
        <FormFieldLabel htmlFor={categoryId} required>
          Catégorie
        </FormFieldLabel>
        <Select
          id={categoryId}
          name="category"
          required
          invalid={categoryError !== undefined}
          aria-describedby={categoryError !== undefined ? categoryErrorId : undefined}
          disabled={isPending}
          value={category}
          onChange={(ev) => {
            setCategory(ev.target.value as FileCategory | "");
          }}
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
          id={subjectIdId}
          name="subjectId"
          type="text"
          maxLength={SUBJECT_ID_MAX}
          invalid={subjectIdError !== undefined}
          aria-describedby={subjectIdError !== undefined ? subjectIdErrorId : undefined}
          disabled={isPending}
          value={subjectId}
          onChange={(ev) => {
            setSubjectId(ev.target.value);
          }}
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
