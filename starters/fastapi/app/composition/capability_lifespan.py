"""Point d'intégration central des capabilities (contrat de composition Factory).

Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
overlays déclarent leurs hooks de cycle de vie via `fastapi.lifespan`.

Un hook reçoit l'application et rend un gestionnaire de contexte asynchrone : ce
qui précède le `yield` s'exécute au démarrage, ce qui suit à l'arrêt. C'est là
qu'une capability ouvre un pool de connexions, enregistre un diagnostic ou publie
son provider dans le registre d'extensions — jamais à l'import d'un module.
"""

from __future__ import annotations

from collections.abc import Callable
from contextlib import AbstractAsyncContextManager

from fastapi import FastAPI

CapabilityLifespan = Callable[[FastAPI], AbstractAsyncContextManager[None]]

#: Hooks de cycle de vie apportés par les capabilities composées, triés par `order`.
CAPABILITY_LIFESPANS: tuple[CapabilityLifespan, ...] = ()
