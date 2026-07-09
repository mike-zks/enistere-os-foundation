/**
 * ENISTERE — Types OpenAPI GÉNÉRÉS. NE PAS MODIFIER À LA MAIN.
 *
 * Source de vérité : cores/api-nestjs/openapi/openapi.json (contrat canonique, ADR-016).
 * Régénérer : npm run generate   ·   Vérifier la fraîcheur : npm run generate:check
 *
 * Fichier types-only (aucun runtime). Outil : openapi-typescript.
 */
export interface paths {
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Authentification par identifiants (login). */
        post: operations["auth_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Déconnexion idempotente (révocation de la famille de sessions). */
        post: operations["auth_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Profil public de l’utilisateur authentifié. */
        get: operations["auth_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me/authorization": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Rôles et permissions de l’utilisateur courant (UI conditionnelle). */
        get: operations["auth_getAuthorization"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rotation du refresh token (nouvelle paire de tokens). */
        post: operations["auth_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liste paginée des fichiers possédés (permission files.read ; ownership ; sans DELETED ; triés createdAt desc). */
        get: operations["files_list"];
        put?: never;
        /**
         * Upload multipart d’un fichier privé (permission files.upload, ownership = utilisateur courant).
         * @description Compatible `fetch + FormData` (web et React Native `{ uri, name, type }`). Le client NE force PAS `Content-Type: multipart/form-data` (boundary auto). Taille max = FILE_MAX_SIZE_BYTES ; types réels inspectés par signatures. Le client ne fournit ni ownerId ni clé de stockage.
         */
        post: operations["files_upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Métadonnées publiques d’un fichier possédé (permission files.read + ownership). */
        get: operations["files_getMetadata"];
        put?: never;
        post?: never;
        /** Supprime un fichier (objet S3 puis DELETED ; permission files.delete + ownership ; idempotent). */
        delete: operations["files_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Émet une URL signée de lecture courte (permission files.download + ownership ; non cacheable). */
        post: operations["files_createDownloadUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}/quarantine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Met un fichier en quarantaine (administratif : permission files.quarantine, sans ownership). */
        post: operations["files_quarantine"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Lève la quarantaine (administratif : permission files.restore, sans ownership). */
        post: operations["files_restore"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Statut applicatif général. */
        get: operations["health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liveness : le processus répond (aucune dépendance externe). */
        get: operations["health_live"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Readiness : dépendances dures disponibles (PostgreSQL). */
        get: operations["health_ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiErrorResponseDto: {
            /**
             * @description Détails structurés optionnels (ex. erreurs de validation). Jamais de secret ni de stack.
             * @example null
             */
            details?: Record<string, never> | null;
            /**
             * @description Code d’erreur applicatif stable.
             * @example FILE_NOT_FOUND
             */
            errorCode: string;
            /**
             * @description Message générique non sensible.
             * @example File not found.
             */
            message: string;
            /**
             * @description Chemin de la requête.
             * @example /files/123
             */
            path: string;
            /**
             * @description Identifiant de corrélation de la requête (en-tête X-Request-Id). Pas une donnée de sécurité.
             * @example b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d
             */
            requestId?: string;
            /**
             * @description Code de statut HTTP.
             * @example 404
             */
            statusCode: number;
            /**
             * @description Toujours false pour une réponse d’erreur.
             * @example false
             */
            success: boolean;
            /**
             * Format: date-time
             * @example 2026-06-09T12:00:00.000Z
             */
            timestamp: string;
        };
        AuthorizationSummaryResponseDto: {
            /**
             * @example [
             *       "files.read",
             *       "files.upload"
             *     ]
             */
            permissions: string[];
            /**
             * @example [
             *       "administrator"
             *     ]
             */
            roles: string[];
        };
        FileListResponseDto: {
            /** @description Fichiers de la page courante. */
            items: components["schemas"]["PublicStoredFileDto"][];
            /**
             * @description Limite appliquée.
             * @example 20
             */
            limit: number;
            /**
             * @description Offset de la page suivante, null si dernière page.
             * @example 20
             */
            nextOffset: number | null;
            /**
             * @description Offset appliqué.
             * @example 0
             */
            offset: number;
        };
        HealthResponseDto: {
            /** @example api-nestjs-core */
            service: string;
            /**
             * @example ok
             * @enum {string}
             */
            status: "ok";
            /**
             * Format: date-time
             * @example 2026-06-09T12:00:00.000Z
             */
            timestamp: string;
        };
        LivenessResponseDto: {
            /**
             * @example live
             * @enum {string}
             */
            status: "live";
        };
        LoginDto: {
            /** @example user@example.com */
            email: string;
            /**
             * Format: password
             * @description Mot de passe en clair. Jamais journalisé ni renvoyé.
             */
            password: string;
        };
        LoginResponseDto: {
            /**
             * @description Access token JWT court.
             * @example eyJhbGciOiJI...EXAMPLE.access.token
             */
            accessToken: string;
            /**
             * @description Durée de vie de l’access token (secondes).
             * @example 900
             */
            accessTokenExpiresIn: number;
            /**
             * @description Refresh token opaque (rotation).
             * @example 8f3a...EXAMPLE.refresh.token
             */
            refreshToken: string;
            /**
             * @description Durée de vie du refresh token (secondes).
             * @example 1209600
             */
            refreshTokenExpiresIn: number;
            /**
             * @example Bearer
             * @enum {string}
             */
            tokenType: "Bearer";
            user: components["schemas"]["UserProfileResponseDto"];
        };
        LogoutResponseDto: {
            /**
             * @example logged_out
             * @enum {string}
             */
            status: "logged_out";
        };
        PublicStoredFileDto: {
            /**
             * @example IMAGE
             * @enum {string}
             */
            category: "IMAGE" | "DOCUMENT" | "AVATAR" | "MEDIA" | "VIDEO" | "AUDIO" | "IDENTITY_DOCUMENT" | "ATTACHMENT" | "OTHER";
            /**
             * Format: date-time
             * @example 2026-06-09T12:00:00.000Z
             */
            createdAt: string;
            /** @example jpg */
            extension: string;
            /**
             * Format: uuid
             * @example b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d
             */
            id: string;
            /** @example image/jpeg */
            mimeType: string;
            /**
             * @description Métadonnée non fiable (UX uniquement).
             * @example photo.jpg
             */
            originalName: string;
            /**
             * @description Taille en octets (chaîne décimale, BigInt).
             * @example 1048576
             */
            size: string;
            /**
             * @example VALIDATED
             * @enum {string}
             */
            status: "PENDING" | "UPLOADED" | "VALIDATED" | "REJECTED" | "QUARANTINED" | "DELETED";
            /**
             * Format: date-time
             * @example 2026-06-09T12:00:00.000Z
             */
            updatedAt: string;
            /**
             * @example PRIVATE
             * @enum {string}
             */
            visibility: "PRIVATE" | "PUBLIC" | "SIGNED" | "INTERNAL";
        };
        QuarantineFileDto: Record<string, never>;
        ReadinessChecksDto: {
            /**
             * @example up
             * @enum {string}
             */
            database: "up";
        };
        ReadinessResponseDto: {
            checks: components["schemas"]["ReadinessChecksDto"];
            /**
             * @example ready
             * @enum {string}
             */
            status: "ready";
        };
        RefreshResponseDto: {
            /** @example eyJhbGciOiJI...EXAMPLE.access.token */
            accessToken: string;
            /**
             * @description Durée de vie de l’access token (secondes).
             * @example 900
             */
            accessTokenExpiresIn: number;
            /** @example 9c4b...EXAMPLE.refresh.token */
            refreshToken: string;
            /**
             * @description Durée de vie du refresh token (secondes).
             * @example 1209600
             */
            refreshTokenExpiresIn: number;
            /**
             * @example Bearer
             * @enum {string}
             */
            tokenType: "Bearer";
        };
        RefreshTokenDto: {
            /** @description Refresh token opaque délivré au login ou au refresh précédent. */
            refreshToken: string;
        };
        SignedDownloadResponseDto: {
            /**
             * Format: date-time
             * @description Expiration de l’URL.
             * @example 2026-06-09T12:05:00.000Z
             */
            expiresAt: string;
            /**
             * Format: uri
             * @description URL temporaire signée (courte). Exemple fictif ; ne pas journaliser ni persister.
             * @example https://storage.example.test/files/download?token=EXAMPLE-SIGNED-URL
             */
            url: string;
        };
        UserProfileResponseDto: {
            /**
             * Format: date-time
             * @example 2026-06-09T12:00:00.000Z
             */
            createdAt: string;
            /**
             * Format: date-time
             * @example null
             */
            deactivatedAt?: Record<string, never> | null;
            /** @example user@example.com */
            email: string;
            /**
             * Format: uuid
             * @example b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d
             */
            id: string;
            /**
             * @example ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
            /**
             * Format: date-time
             * @example 2026-06-09T12:00:00.000Z
             */
            updatedAt: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    auth_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            /** @description Authentification réussie : access token et refresh token émis. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["LoginResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Payload invalide. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Identifiants invalides. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Trop de tentatives. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    auth_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenDto"];
            };
        };
        responses: {
            /** @description Logout idempotent : la session courante et sa famille sont révoquées. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["LogoutResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Payload invalide. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    auth_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Profil public de l’utilisateur authentifié. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["UserProfileResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Authentification requise ou session invalide. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    auth_getAuthorization: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Rôles et permissions de l’utilisateur courant (codes triés, non réutilisables côté serveur). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AuthorizationSummaryResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Authentification requise ou session invalide. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    auth_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenDto"];
            };
        };
        responses: {
            /** @description Nouvelle paire de tokens (rotation du refresh token). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["RefreshResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Payload invalide. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Refresh token invalide. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Trop de tentatives. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_list: {
        parameters: {
            query?: {
                /** @description Nombre de fichiers par page (1–50). */
                limit?: number;
                /** @description Position de départ (≥ 0). */
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Page de fichiers possédés. nextOffset est null à la dernière page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["FileListResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Paramètres de pagination invalides (limit 1–50, offset ≥ 0). */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.read absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /**
                     * @description Catégorie générique (requise).
                     * @enum {string}
                     */
                    category: "IMAGE" | "DOCUMENT" | "AVATAR" | "MEDIA" | "VIDEO" | "AUDIO" | "IDENTITY_DOCUMENT" | "ATTACHMENT" | "OTHER";
                    /**
                     * Format: binary
                     * @description Contenu binaire (requis).
                     */
                    file: string;
                    /** @description Rattachement métier générique optionnel. */
                    subjectId?: string;
                };
            };
        };
        responses: {
            /** @description Fichier stocké et validé. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["PublicStoredFileDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Multipart invalide / contenu non détecté / extension incohérente. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.upload absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Quota propriétaire dépassé (nombre/octets). */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier trop volumineux. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Trop de requêtes d’upload. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Stockage objet indisponible. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_getMetadata: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Métadonnées publiques du fichier possédé (statut inclus). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["PublicStoredFileDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Identifiant invalide (UUID attendu). */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.read absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier absent ou non possédé (anti-énumération). */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Fichier supprimé (objet S3 + marquage DELETED), idempotent. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Identifiant invalide (UUID attendu). */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.delete absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier absent ou non possédé (anti-énumération). */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Finalisation DB impossible après suppression. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Stockage objet indisponible. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_createDownloadUrl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description URL signée temporaire (url + expiresAt). Réponse non mise en cache (no-store). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["SignedDownloadResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Identifiant invalide (UUID attendu). */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.download absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier absent ou non possédé (anti-énumération). */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier non téléchargeable (statut/visibilité). */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Trop de demandes d’URL de téléchargement. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Génération d’URL indisponible (objet manquant / signature). */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_quarantine: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuarantineFileDto"];
            };
        };
        responses: {
            /** @description Fichier mis en quarantaine (aucun accès/URL tant que la quarantaine dure). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Identifiant invalide / raison hors valeurs. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.quarantine absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier introuvable. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Transition de statut invalide. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    files_restore: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Quarantaine levée ; le propriétaire retrouve l’accès normal. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Identifiant invalide (UUID attendu). */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Authentification requise. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Permission files.restore absente. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Fichier introuvable. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Transition de statut invalide (objet présent et empreinte d’intégrité requis). */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
            /** @description Erreur interne. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
    health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Statut applicatif général. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["HealthResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
        };
    };
    health_live: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Le processus répond. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["LivenessResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
        };
    };
    health_ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Dépendances dures disponibles. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ReadinessResponseDto"];
                        /** @example true */
                        success: boolean;
                        /**
                         * Format: date-time
                         * @example 2026-06-09T12:00:00.000Z
                         */
                        timestamp: string;
                    };
                };
            };
            /** @description Une dépendance dure est indisponible (réponse générique). */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"];
                };
            };
        };
    };
}
