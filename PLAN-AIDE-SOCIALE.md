# Plan d'implémentation - Aide sociale du Québec

## Vue d'ensemble
L'aide sociale du Québec comprend deux programmes principaux :
- **Aide sociale** : Pour les personnes sans contraintes à l'emploi ou avec contraintes temporaires
- **Solidarité sociale** : Pour les personnes avec contraintes sévères à l'emploi (non couvert dans cette phase)
- **Programme objectif emploi** : Pour les nouveaux demandeurs (première demande)

## Phase 1 : Analyse et recherche ✅

### Programmes identifiés
1. **Aide sociale de base**
   - Sans contrainte à l'emploi
   - Avec contrainte temporaire à l'emploi (+166$ individu, +285$ couple)
   
2. **Programme objectif emploi**
   - Nouveaux demandeurs (première demande)
   - Montants similaires à l'aide sociale avec ajustement de 45$

### Montants 2024 (indexés au 1er janvier)
- **1 adulte sans contrainte** : 784$
- **1 adulte avec contrainte temporaire** : 950$ (784$ + 166$)
- **2 adultes sans contrainte** : 1 213$
- **2 adultes avec contraintes** : 1 498$ (1 213$ + 285$)
- **Ajustement personne seule** : 45$ (programme objectif emploi)

### Revenus de travail permis
- **1 adulte** : 200$ exemptés
- **2 adultes** : 300$ exemptés
- **Supplément** : 25% sur revenus excédant le seuil (à partir de janvier 2025)

### Avoirs liquides permis
- Limites selon la composition familiale (ex: 887$ pour 1 adulte sans enfant)
- Certains actifs exclus du calcul

## Phase 2 : Planification technique

### Architecture proposée
```
src/lib/calculators/
├── SocialAssistanceCalculator.ts    # Calculateur principal
├── SocialAssistanceTypes.ts         # Interfaces TypeScript
└── tests/
    └── SocialAssistanceCalculator.test.ts
```

### Interfaces TypeScript
```typescript
interface SocialAssistanceInput {
  household_type: 'single' | 'couple' | 'single_parent';
  employment_constraint?: 'none' | 'temporary' | 'severe';
  partner_employment_constraint?: 'none' | 'temporary' | 'severe';
  work_income: number;
  partner_work_income?: number;
  liquid_assets: number;
  first_time_applicant?: boolean;
  children_count?: number;
  year: 2023 | 2024 | 2025;
}

interface SocialAssistanceResult {
  base_benefit: number;
  constraint_allocation: number;
  single_adjustment: number;
  work_income_exemption: number;
  work_income_supplement: number;
  total_benefit: number;
  eligible: boolean;
  ineligibility_reason?: string;
}
```

### Paramètres de configuration
```typescript
social_assistance: {
  base_benefit: {
    single: 784,
    couple: 1213,
    single_with_parents: 684,
    couple_with_parents: 1113
  },
  constraint_allocation: {
    single_temporary: 166,
    couple_both: 285,
    couple_one: 166
  },
  single_adjustment: 45,
  work_income_exemption: {
    single: 200,
    couple: 300
  },
  work_income_supplement_rate: 0.25,  // À partir de 2025
  liquid_asset_limits: {
    single_no_children: 887,
    couple_no_children: 1340,
    // ... autres limites
  }
}
```

## Phase 3 : Développement

### Étapes d'implémentation
1. **Créer SocialAssistanceTypes.ts**
   - Définir toutes les interfaces
   - Documenter les règles d'affaires

2. **Implémenter SocialAssistanceCalculator.ts**
   - Hériter de BaseCalculator
   - Logique de calcul des prestations de base
   - Calcul des allocations pour contraintes
   - Application des exemptions de revenus
   - Calcul du supplément de revenu (2025+)
   - Vérification de l'admissibilité (avoirs liquides)

3. **Intégrer dans MainCalculator.ts**
   - Ajouter l'appel au calculateur
   - Gérer les dépendances avec autres programmes

4. **Mettre à jour les configurations**
   - 2023.ts, 2024.ts, 2025.ts
   - Ajouter les paramètres d'aide sociale

5. **Intégrer l'interface utilisateur**
   - Ajouter champs dans CompactCalculator.tsx :
     - Contraintes à l'emploi (dropdown)
     - Avoirs liquides
     - Première demande (checkbox)
   - Afficher résultats dans DetailedResults.tsx

6. **Ajouter traductions**
   - translations.ts : Labels français/anglais

## Phase 4 : Tests et validation

### Scénarios de test prioritaires
1. **Personne seule sans contrainte**
   - Sans revenu : 784$/mois
   - Avec 150$ revenu : 784$/mois (sous exemption)
   - Avec 400$ revenu : 584$/mois (784 - 200 excédent)

2. **Personne seule avec contrainte temporaire**
   - Sans revenu : 950$/mois (784 + 166)
   - Avec revenus : mêmes règles d'exemption

3. **Couple sans contrainte**
   - Sans revenu : 1 213$/mois
   - Avec 250$ revenu total : 1 213$/mois
   - Avec 500$ revenu : 1 013$/mois

4. **Programme objectif emploi**
   - Personne seule : 829$/mois (784 + 45)
   - Couple : 1 258$/mois (1 213 + 45)

5. **Supplément de revenu 2025**
   - Revenu 360$, seuil 200$ : +40$ (25% de 160$)

### Validation avec calculateur officiel
- Utiliser le simulateur du ministère (s'il existe)
- Créer matrice de tests exhaustive
- Documenter les écarts et ajuster

## Phase 5 : Documentation

### Documentation à produire
1. **Documentation technique**
   - Algorithmes de calcul
   - Règles d'affaires
   - Cas spéciaux

2. **Mise à jour CLAUDE.md**
   - Marquer comme ✅ IMPLÉMENTÉ
   - Ajouter notes d'implémentation

3. **README.md**
   - Ajouter aide sociale aux fonctionnalités

## Considérations spéciales

### Complexités identifiées
1. **Avoirs liquides** : Vérification d'admissibilité basée sur les actifs
2. **Contraintes à l'emploi** : Définition et validation des contraintes
3. **Revenus exclus** : Certains revenus ne comptent pas (invalidité, retraite)
4. **Prestations spéciales** : Non couvertes dans cette phase (transport médical, etc.)
5. **Interaction avec autres programmes** : L'aide sociale peut affecter l'admissibilité à d'autres programmes

### Limitations de la phase 1
- Solidarité sociale (contraintes sévères) reportée
- Prestations spéciales non incluses
- Ajustements pour enfants simplifiés
- Cas de résidence avec parents non traité

## Prochaines étapes

### Pour déléguer à Claude Sonnet :
1. **Tâche 1** : Créer SocialAssistanceTypes.ts avec toutes les interfaces
2. **Tâche 2** : Implémenter SocialAssistanceCalculator.ts avec logique complète
3. **Tâche 3** : Mettre à jour les fichiers de configuration 2023-2025
4. **Tâche 4** : Intégrer dans MainCalculator et UI
5. **Tâche 5** : Créer suite de tests complète
6. **Tâche 6** : Valider avec cas réels et ajuster

### Ordre de priorité
1. Configuration et types (fondation)
2. Calculateur de base (logique métier)
3. Intégration UI (utilisabilité)
4. Tests et validation (qualité)
5. Documentation (maintenance)

## Références
- [Prestations de base](https://www.quebec.ca/famille-et-soutien-aux-personnes/aide-sociale-et-solidarite-sociale/prestations-de-base)
- [Montants des prestations](https://www.quebec.ca/famille-et-soutien-aux-personnes/aide-sociale-et-solidarite-sociale/information-aide-financiere/montants-prestations-aide-sociale)
- [Programme objectif emploi](https://www.quebec.ca/emploi/trouver-emploi-stage/programmes/integrer-emploi/objectif-emploi/prestations)
- [Règlement sur l'aide aux personnes et aux familles](https://www.legisquebec.gouv.qc.ca/fr/document/rc/a-13.1.1,%20r.%201)