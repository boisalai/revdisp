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

Cette commande crée un échantillon aléatoire de $1 ménages pour l'année $2, utilise notre calculateur pour calculer le revenu disponible pour chaque ménage et le compare les résultats de chaque programme socio-fiscal avec ceux du calculateur officiel du Ministère des Finances du Québec (MFQ).

### 2. Analyse des résultats

- Parmi l'ensemble des $1 ménages de l'échantillon test, identifie le ménage avec l'écart total de revenu disponible le plus important.
- Décris en détail les caractéristiques de ce ménage (ex. personne vivant seule, 25 ans et 35000$ de revenu brut de travail)
- Présente un tableau contenant les résultats de chaque programme socio-fiscal pour ce ménage
  - La colonne 1 présente le nom du programme socio-fiscal
  - la colonne 2 présente les résultats de notre calculateur
  - la colonne 3 présente les résultats du calculateur officiel du MFQ
  - la colonne 4 présente l'écart entre les deux
- Identifie le programme socio-fiscal de ce ménage affichant les plus grands écarts en dollars

### 3. Investigation des causes

Pour ce programme problématique :

- Recherche les paramètres officiels sur les sites gouvernementaux ou la chaire de recherche en fiscalité 
- Vérifie les formules de calcul dans la documentation officielle
- Compare avec l'implémentation actuelle dans `src/lib/calculators/`
- Identifie les sources de divergence (paramètres, formules, conditions)

### 4. Plan de correction

- Propose des corrections spécifiques et détaillées avec références aux sources gouvernementales
- Ne propose JAMAIS des valeurs de paramètres empiriques, seulement de sources gouvernementales
- Priorise les corrections selon l'impact sur l'exactitude globale
- Si nécessaire, demande des éclaircissements supplémentaires sur les spécifications

### 5. Demande l'autorisation

- Explique en détail des modifications proposées
- Demande l'autorisation avant de procéder aux corrections 

### 6. Mise en œuvre des corrections

- Implémente les corrections dans le code
- Effectue des tests pour valider les corrections
- Documente les changements dans le code et les tests
