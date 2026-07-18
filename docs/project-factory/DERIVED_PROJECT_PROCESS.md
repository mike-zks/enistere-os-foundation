# Processus de projet dérivé

```txt
Idée -> brief fonctionnel -> blueprint -> plan -> génération -> vérification -> projet autonome
```

1. Décrire utilisateurs, parcours, données, rôles, contraintes et V1.
2. Choisir API, Web et Mobile selon la matrice, pas par préférence isolée.
3. Sélectionner uniquement des capabilities `ready` pour toutes les targets.
4. Valider humainement le blueprint et le plan généré.
5. Générer dans un répertoire neuf, installer sans lien local et exécuter les gates.
6. Versionner `enistere.yaml` et `enistere.lock` dans le projet dérivé.
7. Documenter uniquement les écarts réels à la Foundation.

Les templates du sous-répertoire `templates/` aident au cadrage. Le CLI et ses limites réelles restent
la source de vérité technique.
