// Variables d'environnement de test, positionnées avant le chargement des modules.
// `ConfigModule.forRoot({ validate })` valide l'environnement dès l'import de
// `AppModule`, donc ces valeurs doivent exister avant ce chargement (setupFiles
// s'exécute avant l'évaluation du fichier de test et de ses imports).
// Ce sont des placeholders de test, jamais des secrets réels.
//
// Baseline `base` : uniquement les variables de la baseline. Les capabilities
// composées remplacent ce fichier via leur overlay (remplacement déclaré) pour
// ajouter leurs propres variables.
//
// Affectation via `??=` : une valeur déjà présente dans l'environnement (par exemple
// un `DATABASE_URL` pointant vers une base PostgreSQL de test jetable) est respectée.
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
