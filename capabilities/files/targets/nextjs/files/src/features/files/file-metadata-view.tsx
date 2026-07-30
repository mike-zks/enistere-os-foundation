import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

import type { PublicStoredFile } from "./client/files-bff-client.js";
import { formatDateTime, formatFileSize } from "./format.js";
import { PageHeader } from "../../shared/components/page-header.js";

export interface FileMetadataViewProps {
  readonly file: PublicStoredFile;
  /** Affiche l'action de téléchargement (affichage conditionnel — l'API reste l'autorité). */
  readonly canDownload?: boolean;
  readonly onDownload?: () => void;
  readonly downloadPending?: boolean;
  /** Message d'erreur **générique** de téléchargement (ex. 409 non téléchargeable). */
  readonly downloadError?: string;
}

/**
 * Vue **présentationnelle** des métadonnées **publiques** d'un fichier. Affiche uniquement des champs
 * publics (jamais bucket/storageKey/checksum/ownerId/metadata interne). `originalName` est rendu en **texte**
 * (React échappe ; aucun `dangerouslySetInnerHTML`). Tailles/dates via helpers purs.
 */
export function FileMetadataView({
  file,
  canDownload,
  onDownload,
  downloadPending,
  downloadError,
}: FileMetadataViewProps): ReactElement {
  const rows: ReadonlyArray<readonly [string, string]> = [
    ["Type", file.mimeType],
    ["Extension", file.extension],
    ["Taille", formatFileSize(file.size)],
    ["Catégorie", file.category],
    ["Statut", file.status],
    ["Visibilité", file.visibility],
    ["Créé le", formatDateTime(file.createdAt)],
    ["Mis à jour le", formatDateTime(file.updatedAt)],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Fichier"
        title={file.originalName}
        description="Métadonnées publiques (lecture seule)."
      />
      <Card>
        <CardHeader>
          <CardTitle as="h2">Métadonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="file-meta">
            {rows.map(([label, value]) => (
              <div key={label} className="file-meta__row">
                <dt>
                  <Text as="span" variant="label" tone="muted">
                    {label}
                  </Text>
                </dt>
                <dd>
                  <Text as="span" variant="body">
                    {value}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
          {canDownload === true && onDownload !== undefined ? (
            <div className="file-meta__actions">
              <Button
                variant="primary"
                loading={downloadPending === true}
                loadingText="Préparation…"
                onClick={onDownload}
              >
                Télécharger
              </Button>
              {downloadError !== undefined ? (
                <Alert variant="danger" role="alert">
                  {downloadError}
                </Alert>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
