"use client";

import type { ReactElement } from "react";

import { useRouter } from "next/navigation";

import { FileDetails } from "../../../../../features/files/file-details.js";

/** Wrapper client qui connecte `FileDetails` à la navigation Next.js (hors périmètre test). */
export function FileDetailsWithNav({ fileId }: { readonly fileId: string }): ReactElement {
  const router = useRouter();
  return <FileDetails fileId={fileId} onDeleteSuccess={() => router.replace("/protected")} />;
}
