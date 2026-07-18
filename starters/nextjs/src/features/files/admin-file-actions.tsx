"use client";

import type { ReactElement } from "react";

import { Alert, Button } from "@enistere/ui-kit";

import { useAuthorization } from "../auth/use-authorization.js";
import { useQuarantineFile } from "./use-quarantine-file.js";
import { useRestoreFile } from "./use-restore-file.js";

export interface AdminFileActionsProps {
  readonly fileId: string;
}

/**
 * Actions **admin** de quarantaine/restauration. Rendu conditionnel pur : retourne `null` si l'utilisateur
 * n'a ni `files.quarantine` ni `files.restore`. L'API reste l'autorité finale — les boutons ne sont qu'un
 * raccourci visuel. Jamais de champ interne, token ou URL signée exposés.
 */
export function AdminFileActions({ fileId }: AdminFileActionsProps): ReactElement | null {
  const authorization = useAuthorization();
  const quarantiner = useQuarantineFile();
  const restorer = useRestoreFile();

  const canQuarantine = authorization.hasPermission("files.quarantine");
  const canRestore = authorization.hasPermission("files.restore");

  if (!canQuarantine && !canRestore) return null;

  return (
    <div className="foundation-admin-actions" role="region" aria-label="Actions administrateur">
      {canQuarantine && (
        <div className="foundation-admin-action">
          <Button
            variant="danger"
            onClick={() => quarantiner.requestQuarantine(fileId)}
            disabled={quarantiner.isPending || quarantiner.isSuccess}
          >
            {quarantiner.isPending ? "Mise en quarantaine…" : "Mettre en quarantaine"}
          </Button>
          {quarantiner.error && (
            <Alert variant="danger" role="alert">
              {quarantiner.error.message}
            </Alert>
          )}
          {quarantiner.isSuccess && (
            <Alert variant="success" role="status">
              Fichier mis en quarantaine.
            </Alert>
          )}
        </div>
      )}

      {canRestore && (
        <div className="foundation-admin-action">
          <Button
            variant="secondary"
            onClick={() => restorer.requestRestore(fileId)}
            disabled={restorer.isPending || restorer.isSuccess}
          >
            {restorer.isPending ? "Restauration…" : "Restaurer"}
          </Button>
          {restorer.error && (
            <Alert variant="danger" role="alert">
              {restorer.error.message}
            </Alert>
          )}
          {restorer.isSuccess && (
            <Alert variant="success" role="status">
              Fichier restauré.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
