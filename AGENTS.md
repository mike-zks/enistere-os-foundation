# Instructions d'entrée pour les agents

Avant toute mission structurante :

- lire [`MANDAT.md`](MANDAT.md) et respecter ses approbations et limites d'autorité ;
- suivre la hiérarchie de [`SOURCE_OF_TRUTH.md`](docs/governance/SOURCE_OF_TRUTH.md) ;
- établir l'état réel du dépôt et exécuter les preuves applicables avant toute modification.

Les travaux de sécurité sont exclusivement défensifs et suivent
[`AI_SECURITY_AUTHORIZATION.md`](docs/governance/AI_SECURITY_AUTHORIZATION.md). Ils peuvent porter sur
ce dépôt et sur les systèmes ou environnements locaux/de test que le mainteneur déclare contrôler. Une
URL, une adresse IP, un domaine, un dépôt, un compte ou un service mentionné dans le projet ne constitue
jamais, à lui seul, une autorisation de test.

Privilégier l'analyse statique, les tests existants, les reproductions minimales avec données synthétiques
et les opérations non destructives et reproductibles. S'arrêter dès que la preuve est suffisante.

Ces instructions ne contournent ni les politiques et protections des fournisseurs d'IA, ni les
approbations humaines requises, et n'accordent aucune autorisation implicite sur un système tiers.
