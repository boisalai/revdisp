# CLAUDE.md

## Calculateur de Revenu Disponible du Québec

Calculateur **complètement implémenté** qui reproduit fidèlement le calculateur officiel du Ministère des Finances du Québec avec une interface moderne de qualité gouvernementale.

**Stack**: Next.js 14, TypeScript, GOV.UK Design System, système de validation automatisé

## État de Validation des Programmes

### ✅ Programmes Validés (100% Exactitude)
**Cotisations (5/5)**: RRQ, AE, RQAP, FSS, RAMQ - Validés sur 10 ménages types avec exactitude complète

### 🔄 En Attente de Validation Officielle
**Impôts (2)**: Québec, Fédéral - Implémentés, scraper Python fonctionnel  
**Allocations/Crédits QC (7)**: Solidarité, Prime travail, Allocation famille, Fournitures scolaires, Garde enfants, Allocation-logement, Soutien aînés  
**Programmes fédéraux (7)**: ACE, Crédit TPS, ACT, PSV+SRG, Suppléments médicaux (2)  
**Aide sociale (1)**: Programme d'assistance financière

### 🎯 État Global
**22/22 programmes implémentés** | **5/22 validés officiellement** | **Scraper Python opérationnel**

### 🚀 Prochaines Étapes Prioritaires
1. **Valider impôts QC/fédéral** avec scraper Python intégré
2. **Valider crédits/allocations** programme par programme  
3. **Corriger écarts détectés** selon sources officielles
4. **Documentation complète** une fois validation 100% terminée

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

### Système de Validation

#### 🐍 Validation Officielle Python/Selenium (NOUVEAU - RECOMMANDÉ)
Validation contre le calculateur officiel avec scraper Python fonctionnel:

```bash
# Validation progressive officielle (10→25→15 cas)
npx tsx src/lib/validation/cli/test-official-validation.ts 2024

# Test simple du scraper Python 
cd python-scraper && uv run multi_test.py

# Validation en mode debug visuel
cd python-scraper && uv run debug_visual.py
```

**✅ Scraper Python résout le problème Puppeteer:**
- **Avant**: Résultats erronés (147026$ au lieu de 20387$)
- **Après**: Résultats corrects avec variabilité confirmée
- **Méthode robuste**: JavaScript fallback + gestion cookies

#### Validation Progressive TypeScript (Ancienne méthode)
```bash
# Validation progressive standard  
npm run validate:progressive -- --count 25

# Validation pour année fiscale spécifique
npm run validate:progressive:2025
```

#### Validation Rapide par Programme
```bash
# Tester un programme spécifique (ex: RAMQ)
npm run validate:ramq

# Validation tableau de bord web
# http://localhost:3001/validation
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

## 🐍 Système de Scraping Python/Selenium

### ✅ Scraper Opérationnel (Septembre 2024)
**Problème Puppeteer résolu** avec migration Python/Selenium:
- **Avant**: Valeurs bloquées à 147026$ (bug Puppeteer)  
- **Après**: Résultats corrects et variables (ex: 20387$ pour 15000$)

### Architecture du Scraper
**Fichiers Python** (`python-scraper/`):
- `calculator_scraper.py` - Scraper principal Selenium
- `simple_test.py` - Test basique 
- `multi_test.py` - Tests multiples avec variabilité
- `debug_visual.py` - Debug mode visuel (navigateur visible)

**Intégration TypeScript** (`src/lib/validation/`):
- `PythonOfficialCalculatorScraper.ts` - Wrapper TypeScript → Python  
- `OfficialValidationEngine.ts` - Moteur de validation complet
- `ProgressiveValidationRunner.ts` - Validation progressive intégrée

### Fonctionnalités Clés
- ✅ **Gestion cookies robuste** (XPath + sélecteurs CSS fallback)
- ✅ **Extraction 22 programmes** avec sélecteurs corrects  
- ✅ **Méthode JavaScript fallback** pour champs récalcitrants
- ✅ **Formatage français géré** (espaces comme séparateurs de milliers)
- ✅ **Intégration uv + TypeScript** via spawn process

### Sélecteurs Corrigés
- Formulaire: `#Situation`, `#Revenu1/2`, `#AgeAdulte1/2`, `#NbEnfants`
- Résultats: `#RD_new`, `#CA_ae_new`, `#QC_ramq_new`, `#CA_pfrt_new`, etc.
- Types ménage: "Personne vivant seule", "Couple", "Retraité vivant seul"

## 🎯 VALIDATION PROGRESSIVE ACTIVE

**Cotisations validées à 100%** - Scraper Python prêt pour validation complète des 17 programmes restants

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

### 🔧 Notes Techniques Importantes
- **Port 3001**: Application accessible via Playwright/tests
- **uv**: Gestionnaire Python utilisé pour scraper (`cd python-scraper && uv run`)
- **Timeout scraper**: 60s par défaut pour éviter timeouts  
- **Délais entre tests**: 2s pour éviter surcharge serveur officiel
- **Mode headless**: Par défaut, mode `visible` disponible pour debug

### 🚨 Limitations Actuelles
- **RAMQ couples**: Calcul incorrect (737.50$ vs 1475$ attendu)
- **Programmes non-validés**: 17/22 en attente de validation officielle
- **Volume limité**: Max 25-50 cas par session pour éviter détection bot

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

## 📋 Quick Reference pour Prochaines Sessions

### Commandes Essentielles
```bash
# Démarrage rapide
npm run dev                                    # Port 3001

# Validation scraper Python (RECOMMANDÉ)
npx tsx src/lib/validation/cli/test-official-validation.ts 2024

# Test scraper Python direct  
cd python-scraper && uv run multi_test.py

# Check complet avant commit
npm run check

# RAMQ debug (problème connu couples)
npm run validate:ramq
```

### Fichiers Clés à Connaître
```
src/lib/validation/
├── PythonOfficialCalculatorScraper.ts    # Wrapper TypeScript→Python
├── OfficialValidationEngine.ts           # Moteur validation complet  
└── ProgressiveValidationRunner.ts        # Validation progressive

python-scraper/
├── calculator_scraper.py                 # Scraper principal 
├── multi_test.py                         # Tests variabilité
└── debug_visual.py                       # Debug mode visible

src/lib/calculators/
├── RamqCalculator.ts                     # ⚠️ Bug couples à corriger
├── FssCalculator.ts                      # ✅ Validé 100%
└── [autres calculateurs]                 # 🔄 En attente validation
```

### État des Travaux
- ✅ **5/22 programmes validés** (toutes cotisations)
- 🐍 **Scraper Python fonctionnel** (résout problème Puppeteer) 
- 🔄 **17 programmes à valider** avec nouveau scraper
- 🚨 **1 bug connu**: RAMQ couples (737.50$ vs 1475$ attendu)