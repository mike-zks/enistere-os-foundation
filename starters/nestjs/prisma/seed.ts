/* eslint-disable */
/**
 * Seed de la baseline `base` : volontairement vide.
 *
 * La baseline ne définit aucune donnée structurelle. Les capabilities composées
 * qui nécessitent un seed (RBAC : rôles/permissions structurels) apportent le
 * leur via leur overlay. Ce fichier reste le point d'entrée `prisma db seed`
 * pour conserver un comportement stable des commandes npm.
 */
async function main(): Promise<void> {
  console.log(JSON.stringify({ seed: 'base', status: 'nothing-to-seed' }));
}

void main();
