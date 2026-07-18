# Stratégie IA

L'IA appartient au control plane de la Factory. Elle accélère l'analyse, la génération, la revue et la
maintenance ; elle ne remplace ni le moteur déterministe, ni la décision humaine.

## Adapters officiels

Codex, Claude Code et Gemini sont invoqués comme agents locaux. Aucun SDK ou modèle distant n'est requis
par le kernel et aucune clé fournisseur n'est transmise par la Factory.

## Contrat de mission

Chaque mission contient : objectif, contexte autorisé, périmètre, interdits, livrables, gates, critères
d'acceptation et format de rapport. L'agent doit arrêter sur ambiguïté structurante ou secret.

## Contrôles

1. Contexte construit par allow-list et redaction.
2. Plan approuvé par un humain.
3. Exécution dans un worktree temporaire.
4. Gates adaptés au changement.
5. Diff et rapport revus.
6. Application approuvée par un humain.

## Délégation

- L'architecte choisit la mission, les décisions et le niveau de risque.
- Claude Code peut exécuter des incréments bornés et produire les tests.
- Codex assure la cohérence transversale, la revue et l'intégration.
- Un second agent peut réaliser une revue indépendante sécurité ou architecture.

## Mesure

Suivre taux d'acceptation des diffs, retours de revue, incidents évités, temps gagné et corrections après
génération. Une production documentaire sans impact vérifiable n'est pas une réussite IA.
