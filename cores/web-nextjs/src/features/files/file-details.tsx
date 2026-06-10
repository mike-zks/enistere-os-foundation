"use client";

import type { ReactElement } from "react";

import { isUuid } from "../../core/files/uuid.js";
import { EmptyState } from "../../shared/components/empty-state.js";
import { ErrorState } from "../../shared/components/error-state.js";
import { ForbiddenState } from "../../shared/components/forbidden-state.js";
import { LoadingState } from "../../shared/components/loading-state.js";
import { ServiceUnavailableState } from "../../shared/components/service-unavailable-state.js";
import { UnauthorizedState } from "../../shared/components/unauthorized-state.js";
import { useAuthorization } from "../auth/use-authorization.js";
import { classifyFileError } from "./file-error.js";
import { FileMetadataView } from "./file-metadata-view.js";
import { useFileMetadata } from "./file-queries.js";
import { useCreateDownloadUrl } from "./use-create-download-url.js";

/**
 * Conteneur **client** du détail d'un fichier : métadonnées via TanStack Query, téléchargement via mutation,
 * et **états standardisés** (loading / introuvable / interdit / non authentifié / indisponible / erreur).
 * La session est déjà validée par le **layout protégé**. L'API reste l'autorité (ownership + permission) ;
 * `useAuthorization` ne sert qu'à l'**affichage conditionnel** du bouton.
 */
export function FileDetails({ fileId }: { readonly fileId: string }): ReactElement {
  const query = useFileMetadata(fileId);
  const authorization = useAuthorization();
  const downloader = useCreateDownloadUrl();

  if (!isUuid(fileId)) {
    return <EmptyState title="Fichier introuvable" description="Ce fichier est introuvable." />;
  }
  if (query.isPending) {
    return <LoadingState label="Chargement du fichier…" />;
  }
  if (query.isError) {
    const error = classifyFileError(query.error);
    switch (error.kind) {
      case "notfound":
        return <EmptyState title="Fichier introuvable" description="Ce fichier est introuvable." />;
      case "forbidden":
        return <ForbiddenState />;
      case "unauthorized":
        return <UnauthorizedState />;
      case "unavailable":
        return <ServiceUnavailableState requestId={error.requestId} onRetry={() => query.refetch()} />;
      default:
        return <ErrorState requestId={error.requestId} onReset={() => query.refetch()} />;
    }
  }

  const file = query.data;
  // Affichage conditionnel uniquement : VALIDATED + permission ; l'API revérifie (409/403 font autorité).
  const canDownload = file.status === "VALIDATED" && authorization.hasPermission("files.download");

  return (
    <FileMetadataView
      file={file}
      canDownload={canDownload}
      onDownload={() => downloader.download(fileId)}
      downloadPending={downloader.isPending}
      downloadError={downloader.error?.message}
    />
  );
}
