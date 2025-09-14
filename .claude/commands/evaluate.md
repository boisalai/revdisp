Évalue et corrige notre calculateur de revenu disponible en le comparant avec le calculateur officiel du Ministère des Finances du Québec.

## Arguments
- $1: Nombre de ménages à tester (recommandé: 10-25 pour analyse rapide, 50-100 pour validation complète)
- $2: Année d'imposition (2023, 2024, ou 2025)

## Processus d'évaluation

### 1. Validation comparative

Supprime le processus en cours sur le port 3001. Ensuite, démarre le serveur Next.js :

```bash
npm run dev  # Port 3001
```

Utilise la commande de validation unifiée :

```bash
npx tsx src/lib/validation/cli/simple-unified-validation.ts --count=$1 --year=$2
```

### 2. Analyse des résultats

- Parmi l'ensemble des ménages de l'échantillon test, identifie le ménage avec l'écart total de revenu disponible le plus important.
- Décris les caractéristiques de ce ménage (ex. personne vivant seule, 25 ans et 35000$ de revenu brut de travail)
- Présente un tableau présentant les résultats de chaque programme socio-fiscal pour ce ménage
  - la colonne 1 présente les résultats de notre calculateur
  - la colonne 2 présente les résultats du calculateur officiel du MFQ
  - la colonne 3 présente l'écart entre les deux
- Identifie les 1-2 programmes avec les plus grands écarts

### 3. Investigation des causes

Pour chaque programme problématique :

- Recherche les paramètres officiels sur les sites gouvernementaux ou la chaire de recherche en fiscalité 
- Vérifie les formules de calcul dans la documentation officielle
- Compare avec l'implémentation actuelle dans `src/lib/calculators/`
- Identifie les sources de divergence (paramètres, formules, conditions)

### 4. Plan de correction

- Propose des corrections spécifiques avec références aux sources officielles
- Priorise les corrections selon l'impact sur l'exactitude globale
- Suggère des tests de régression pour valider les corrections
- Documente les changements nécessaires dans les fichiers de configuration

### 5. Demande l'autorisation

- Demande l'autorisation avant de procéder aux corrections 

