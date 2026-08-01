"""Point d'intégration central des modules de modèles (contrat de composition Factory).

Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
overlays déclarent leurs modules de modèles via l'intégration connue
`fastapi.model-module` et la Factory régénère ce fichier de manière déterministe.
La baseline n'apporte aucun modèle de capability.

Importer ce module suffit : c'est l'import qui enregistre les tables sur
`Base.metadata`, et c'est cet enregistrement que `--autogenerate` compare à la
base. Un modèle que personne n'importe est un modèle qu'Alembic propose de
supprimer.
"""

from __future__ import annotations

#: Modules de modèles apportés par les capabilities composées, triés.
CAPABILITY_MODEL_MODULES: tuple[str, ...] = ()
