"""Point d'intégration central des capabilities (contrat de composition Factory).

Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
overlays déclarent leurs handlers via l'intégration connue
`fastapi.exception-handler`.

Pourquoi une couture et non un enregistrement dans le `lifespan` : Starlette
construit sa pile de middlewares — dont le middleware d'exceptions — avant
d'émettre l'événement de démarrage. Un handler ajouté depuis un hook de cycle de
vie ne serait jamais consulté, et l'erreur métier d'une capability retomberait
silencieusement dans le filet `Exception` du baseline, en 500 au lieu de son
propre statut.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import Request
from fastapi.responses import JSONResponse

CapabilityExceptionHandler = Callable[[Request, Exception], Awaitable[JSONResponse]]

#: Couples (exception, handler) apportés par les capabilities composées.
CAPABILITY_EXCEPTION_HANDLERS: tuple[
    tuple[type[Exception], CapabilityExceptionHandler], ...
] = ()
