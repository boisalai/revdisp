# CLAUDE.md

## Calculateur de Revenu Disponible du Québec

Calculateur **complètement implémenté** qui reproduit fidèlement le calculateur officiel du Ministère des Finances du Québec avec une interface moderne de qualité gouvernementale.

**Stack**: Next.js 14, TypeScript, GOV.UK Design System, système de validation automatisé

## 🎉 22/22 Programmes Socio-Fiscaux Implémentés

**Cotisations (5)**: RRQ, AE, RQAP, FSS, RAMQ  
**Impôts (2)**: Québec, Fédéral  
**Allocations/Crédits QC (7)**: Solidarité, Prime travail, Allocation famille, Fournitures scolaires, Garde enfants, Allocation-logement, Soutien aînés  
**Programmes fédéraux (7)**: ACE, Crédit TPS, ACT, PSV+SRG, Suppléments médicaux (2)  
**Aide sociale (1)**: Programme d'assistance financière

### Architecture
- Interface: `src/components/CompactCalculator.tsx`
- Calculateurs: `src/lib/calculators/` (22 modules)
- Config: `src/lib/config/data/2023-2025.ts`
- Validation: `src/lib/validation/`

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Development server (port 3001)
npm run dev

# Complete pre-deployment check (MANDATORY before git push)
npm run check

# Type checking
npm run lint
```

### Validation System

#### Progressive Validation (RECOMMANDÉ)
Validation progressive avec nombre configurable de ménages types, comparant TOUS les programmes socio-fiscaux:

```bash
# Validation progressive standard (10 ménages)
npm run validate:progressive

# Validation avec nombre spécifique de ménages
npm run validate:progressive -- --count 25
npm run validate:progressive -- --count 100
npm run validate:progressive -- --count 500

# Validation pour année fiscale spécifique
npm run validate:progressive:2025

# Validation avec détails complets
npm run validate:progressive -- --verbose
```

**Fonctionnalités de la validation progressive:**
- ✅ Compare **tous les programmes** individuellement (pas seulement revenu disponible)
- ✅ Génère des ménages types variés automatiquement
- ✅ Analyse des écarts programme par programme
- ✅ Rapport détaillé avec priorités d'amélioration
- ✅ Validation contre le calculateur officiel du Ministère des Finances

#### Autres Commandes de Validation
```bash
# Validation traditionnelle (tableau de bord web)
# http://localhost:3001/validation

# Validation CLI simple
npm run validate
```

## Spécifications Techniques

### Caractéristiques Clés
- **Port 3001**: Évite conflit avec Docusaurus (port 3000)
- **Précision monétaire**: Decimal.js avec ROUND_HALF_UP
- **Années fiscales**: Support 2023-2025 avec validation TypeScript
- **Logique d'âge**: 18-64 (travail) vs 65+ (retraite)

### Standards Interface
- **Design GOV.UK**: Interface gouvernementale professionnelle
- **Accessibilité**: WCAG 2.1 AA, navigation clavier complète
- **Responsive**: Mobile-first, breakpoints appropriés

## Stratégie de Validation

### Approche de Validation Progressive

La validation progressive est la méthode recommandée pour vérifier l'exactitude du calculateur:

#### Méthodologie
1. **Comparaison Programme par Programme**: Chaque programme socio-fiscal est validé individuellement
2. **Ménages Types Variés**: Génération automatique de profils de ménages diversifiés
3. **Validation Contre Source Officielle**: Comparaison directe avec le calculateur du Ministère des Finances
4. **Corrections Basées sur des Sources**: Toute correction doit être justifiée par documentation officielle

#### Workflow de Validation
```bash
# Étape 1: Validation de base (10-25 ménages)
npm run validate:progressive -- --count 25
# → Identifier les écarts par programme
# → Corriger selon sources officielles
# → Répéter jusqu'à exactitude

# Étape 2: Validation étendue (100+ ménages)
npm run validate:progressive -- --count 100
# → Tester cas particuliers
# → Détecter régressions
# → Valider stabilité
```

#### Standards de Correction
- **Sources Officielles**: Sites gouvernementaux, guides fiscaux officiels
- **Écarts Significatifs**: Différences >5% nécessitent correction documentée
- **Traçabilité**: Toute correction référencée dans les commits

## 🎉 IMPLÉMENTATION COMPLÈTE !

**Le calculateur reproduit fidèlement le calculateur officiel du Ministère des Finances du Québec (2023-2025)**

## Déploiement

### Status Actuel
✅ **EN LIGNE**: https://boisalai.github.io/revdisp/
- Déploiement automatique via GitHub Actions
- Export statique optimisé pour GitHub Pages

### Workflow Pré-Déploiement
⚠️ **OBLIGATOIRE avant chaque push**:
```bash
npm run check  # Validation complète
```

### Rollback d'Urgence
```bash
git revert HEAD
git push origin main
```

## Bonnes Pratiques

### Checklist Pré-Déploiement
1. ✅ **Toujours exécuter `npm run check`**
2. ✅ **Vérifier les erreurs console**
3. ✅ **Tester fonctionnalités client**

### Gestion Configuration
Tous les calculateurs doivent avoir leurs clés dans:
- `src/lib/config/data/2023.ts`
- `src/lib/config/data/2024.ts`  
- `src/lib/config/data/2025.ts`

### Workflow Git
```bash
git add .
git commit -m "description"
git push origin main  # Hook automatique npm run check
```

## Méthodologie d'Implémentation

### Processus Standard
1. **Recherche**: Sources officielles, dépendances, cas particuliers
2. **Planification**: Architecture, interfaces, paramètres fiscaux
3. **Développement**: Calculateur + UI + tests intégrés
4. **Validation**: Tests massifs + corrections itératives
5. **Documentation**: Mise à jour docs + déploiement

### Notes Importantes
- Application accessible via Playwright sur port 3001
- Impôt Québec déjà implémenté
- Crédit solidarité implémenté
- Prime travail Québec opérationnelle

## Conventions de Nommage

**IMPORTANT**: Ce codebase utilise **underscore_case** pour toutes les propriétés principales des résultats de calcul.

**✅ CORRECT**:
```typescript
const result = calculationResult.revenu_disponible
const taxes = calculationResult.impot_quebec
const config = getConfigValue('senior_support')
```

**❌ INCORRECT**:
```typescript
const result = calculationResult.revenuDisponible  // ❌
const taxes = calculationResult.impotQuebec        // ❌
```

**Zones concernées**: Résultats calculateur, clés configuration, propriétés API, système validation