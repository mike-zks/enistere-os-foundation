"""Point d'intégration central des capabilities (contrat de composition Factory).

Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
overlays déclarent leurs routeurs via l'intégration connue `fastapi.router` et la
Factory régénère ce fichier de manière déterministe. La baseline n'apporte aucun
routeur.
"""

from __future__ import annotations

from fastapi import APIRouter

#: Routeurs apportés par les capabilities composées, triés par `order`.
CAPABILITY_ROUTERS: tuple[APIRouter, ...] = ()
