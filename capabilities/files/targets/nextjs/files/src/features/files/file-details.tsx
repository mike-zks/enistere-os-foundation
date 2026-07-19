"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@enistere/ui-kit";

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
import { useDeleteFile } from "./use-delete-file.js";

export interface FileDetailsProps {
  readonly fileId: string;
  /** Appelé après suppression réussie (navigation côté page). */
  readonly onDeleteSuccess?: () => void;
}

/**
 * Conteneur **client** du détail d'un fichier : métadonnées via TanStack Query, téléchargement via mutation,
 * suppression via mutation avec confirmation Dialog, et **états standardisés**.
 * La session est déjà validée par le **layout protégé**. L'API reste l'autorité (ownership + permission) ;
 * `useAuthorization` ne sert qu'à l'**affichage conditionnel** des boutons.
 */
export function FileDetails({ fileId, onDeleteSuccess }: FileDetailsProps): ReactElement {
  const query = useFileMetadata(fileId);
  const authorization = useAuthorization();
  const downloader = useCreateDownloadUrl();
  const deleter = useDeleteFile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (deleter.isSuccess) {
      onDeleteSuccess?.();
    }
  }, [deleter.isSuccess, onDeleteSuccess]);

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
  const canDownload = file.status === "VALIDATED" && authorization.hasPermission("files.download");
  const canDelete = authorization.hasPermission("files.delete");

  return (
    <>
      <FileMetadataView
        file={file}
        canDownload={canDownload}
        onDownload={() => downloader.download(fileId)}
        downloadPending={downloader.isPending}
        downloadError={downloader.error?.message}
      />

      {canDelete && (
        <div className="foundation-delete-section">
          <Button
            variant="danger"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleter.isPending}
          >
            Supprimer
          </Button>
          {deleter.error && (
            <Alert variant="danger" role="alert">
              {deleter.error.message}
            </Alert>
          )}
        </div>
      )}

      <Dialog
        open={deleteDialogOpen}
        onDismiss={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle id="delete-dialog-title">Confirmer la suppression</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <DialogDescription id="delete-dialog-desc">
            Cette action est irréversible. Le fichier sera définitivement supprimé.
          </DialogDescription>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteDialogOpen(false);
              deleter.requestDelete(fileId);
            }}
            disabled={deleter.isPending}
          >
            Supprimer définitivement
          </Button>
          <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
