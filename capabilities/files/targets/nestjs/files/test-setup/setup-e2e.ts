// Variables d'environnement de test, positionnées avant le chargement des modules.
// Variante composée `base + auth + rbac + files` : ce fichier REMPLACE (remplacement
// déclaré par l'overlay Files) le setup e2e de la composition Auth pour ajouter les
// variables Files. Il en est donc un sur-ensemble strict.
// Ce sont des placeholders de test, jamais des secrets réels.
//
// Affectation via `??=` : une valeur déjà présente dans l'environnement (par exemple
// un `DATABASE_URL` pointant vers une base PostgreSQL de test jetable, ou les valeurs
// S3 fournies par la CI) est respectée.
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3000';
process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/enistere_api_core_test';
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
// --- Capability Auth ---
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-placeholder';
process.env.JWT_ACCESS_TTL ??= '900';
process.env.REFRESH_TOKEN_TTL ??= '1209600';
process.env.REFRESH_TOKEN_HASH_SECRET ??= 'test-refresh-hash-secret-placeholder';
// Paramètres Argon2id réduits pour des tests rapides (uniquement en environnement test).
process.env.ARGON2_MEMORY_COST ??= '512';
process.env.ARGON2_TIME_COST ??= '1';
process.env.ARGON2_PARALLELISM ??= '1';
// Limites de rate limiting généreuses par défaut pour ne pas faire échouer les tests
// fonctionnels ; les specs dédiées au throttling fixent leur propre limite.
process.env.AUTH_LOGIN_RATE_LIMIT ??= '50';
process.env.AUTH_LOGIN_RATE_TTL ??= '60';
process.env.AUTH_REFRESH_RATE_LIMIT ??= '50';
process.env.AUTH_REFRESH_RATE_TTL ??= '60';
// --- Capability Files ---
// Objet de stockage : placeholders alignés sur le MinIO jetable du harnais e2e.
process.env.S3_ENDPOINT ??= 'http://localhost:9000';
process.env.S3_REGION ??= 'us-east-1';
process.env.S3_ACCESS_KEY_ID ??= 'test-access-key-placeholder';
process.env.S3_SECRET_ACCESS_KEY ??= 'test-secret-key-placeholder';
process.env.S3_BUCKET ??= 'enistere-files-test';
process.env.S3_FORCE_PATH_STYLE ??= 'true';
// Âge minimal d'un objet avant qu'il soit considéré orphelin. La valeur de production
// (86400 s) rendrait la réconciliation intestable : la spec de cycle de vie crée un
// objet puis attend qu'il devienne éligible. 1 s garde le test rapide et déterministe.
process.env.FILES_ORPHAN_MIN_AGE_SECONDS ??= '1';
