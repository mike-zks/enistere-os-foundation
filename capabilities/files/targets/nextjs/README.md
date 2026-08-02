# Files — overlay Next.js actif

Surface Files web (BFF fichiers, routes `/api/files/*`, écrans protégés
`/protected/files`, clients/hooks, tests et e2e de composition complète). Le
descripteur `overlay.json` l'injecte lorsque Files est sélectionnée et le golden
`nest-next-files` en exécute les gates. La surface réutilise Auth/RBAC ; le BFF
reste un transport et l'API demeure l'unique autorité.
