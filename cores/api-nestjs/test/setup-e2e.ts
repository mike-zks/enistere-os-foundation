// Variables d'environnement de test, positionnées avant le chargement des modules.
// `ConfigModule.forRoot({ validate })` valide l'environnement dès l'import de
// `AppModule`, donc ces valeurs doivent exister avant ce chargement (setupFiles
// s'exécute avant l'évaluation du fichier de test et de ses imports).
// Ce sont des placeholders de test, jamais des secrets réels.
//
// Affectation via `??=` : une valeur déjà présente dans l'environnement (par exemple
// un `DATABASE_URL` pointant vers une base PostgreSQL de test jetable) est respectée.
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3000';
process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/enistere_api_core_test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-placeholder';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-placeholder';
process.env.JWT_ACCESS_TTL ??= '900';
process.env.REFRESH_TOKEN_TTL ??= '1209600';
process.env.REFRESH_TOKEN_HASH_SECRET ??= 'test-refresh-hash-secret-placeholder';
// Paramètres Argon2id réduits pour des tests rapides (uniquement en environnement test).
process.env.ARGON2_MEMORY_COST ??= '512';
process.env.ARGON2_TIME_COST ??= '1';
process.env.ARGON2_PARALLELISM ??= '1';
// Limite de login généreuse par défaut pour ne pas faire échouer les tests fonctionnels ;
// les specs dédiées au throttling fixent leur propre limite.
process.env.AUTH_LOGIN_RATE_LIMIT ??= '50';
process.env.AUTH_LOGIN_RATE_TTL ??= '60';
process.env.AUTH_REFRESH_RATE_LIMIT ??= '50';
process.env.AUTH_REFRESH_RATE_TTL ??= '60';
process.env.FILE_MAX_SIZE_BYTES ??= '10485760';
process.env.FILE_ORIGINAL_NAME_MAX_LENGTH ??= '255';
// Stockage objet : placeholders de test (un MinIO jetable est branché par les e2e qui en ont besoin).
process.env.S3_ENDPOINT ??= 'http://localhost:9000';
process.env.S3_REGION ??= 'us-east-1';
process.env.S3_ACCESS_KEY_ID ??= 'test-access-key';
process.env.S3_SECRET_ACCESS_KEY ??= 'test-secret-key';
process.env.S3_BUCKET ??= 'enistere-files-test';
process.env.S3_FORCE_PATH_STYLE ??= 'true';
process.env.FILES_UPLOAD_RATE_LIMIT ??= '50';
process.env.FILES_UPLOAD_RATE_TTL ??= '60';
// URL signée de lecture : TTL court (min autorisé) pour des e2e rapides et un test d'expiration.
process.env.FILES_SIGNED_READ_URL_TTL_SECONDS ??= '30';
// Limite généreuse par défaut ; les specs dédiées au throttling fixent leur propre limite.
process.env.FILES_DOWNLOAD_URL_RATE_LIMIT ??= '50';
process.env.FILES_DOWNLOAD_URL_RATE_TTL ??= '60';
// Cycle de vie / réconciliation : seuils courts pour des e2e rapides et déterministes.
process.env.FILES_PENDING_EXPIRATION_SECONDS ??= '1';
process.env.FILES_REJECTED_RETENTION_SECONDS ??= '604800';
process.env.FILES_DELETED_METADATA_RETENTION_SECONDS ??= '7776000';
process.env.FILES_ORPHAN_MIN_AGE_SECONDS ??= '1';
process.env.FILES_RECONCILIATION_BATCH_SIZE ??= '100';
// Quotas illimités par défaut en e2e ; les specs dédiées fixent leurs propres limites via la config.
process.env.FILES_OWNER_MAX_ACTIVE_FILES ??= '0';
process.env.FILES_OWNER_MAX_TOTAL_BYTES ??= '0';
process.env.CORS_ORIGINS ??= 'http://localhost:3000';
// Sécurité HTTP : petite limite JSON pour tester le rejet 413 ; aucun proxy de confiance en test.
process.env.JSON_BODY_LIMIT ??= '100kb';
process.env.URL_ENCODED_BODY_LIMIT ??= '100kb';
process.env.TRUST_PROXY_HOPS ??= '0';
// Logging : silencieux par défaut en test (les specs de logging activent une capture dédiée).
process.env.SERVICE_NAME ??= 'api-nestjs-core';
process.env.LOG_LEVEL ??= 'silent';
process.env.LOG_PRETTY ??= 'false';
process.env.LOG_HTTP_ENABLED ??= 'true';
process.env.LOG_HEALTH_SUCCESS_ENABLED ??= 'false';
