# Starter API FastAPI

Troisième adapter API Enistere ciblant `Platform Baseline 2.0.0` et
`api/2.0.0`. La base ne contient aucune capability métier ni service IA.

```bash
python -m pip install -r requirements.lock
python -m pytest
python -m ruff check .
python -m pip_audit --strict
python -m uvicorn app.main:app
```

Les primitives de persistence spécialisent les ports neutres ; aucun ORM ni
provider de base de données n’est imposé par le baseline.
Le rate limiter mémoire prouve le mécanisme de base sur une instance ; un
déploiement multi-processus doit le remplacer par un adapter distribué avant
toute revendication `PRODUCTION_READY`.

`requirements.txt` porte les dépendances directes gouvernées.
`requirements.lock` verrouille l'arbre transitif exercé par le golden.
`requirements.runtime.lock` limite l'image de production aux dépendances
d'exécution. Leurs digests sont enregistrés dans `enistere.lock` et contrôlés
par `enistere verify`.
