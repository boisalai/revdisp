# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **fully-implemented Quebec disposable income calculator** that computes taxes, social insurance contributions, and transfers for Quebec households. The project successfully replicates the functionality of the Quebec Ministry of Finance's calculator (https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp) with a modern, government-grade interface.

**Current Technology Stack**: Next.js 14, TypeScript, Tailwind CSS with GOV.UK Design System, D3.js for data visualization, and an automated validation system.

## Current Implementation Status

✅ **MAJOR PROGRAMS IMPLEMENTED** - Next.js application with complete tax calculation infrastructure:

### Programmes Socio-Fiscaux Implémentés (2025)
- ✅ **Cotisations sociales**: RRQ, AE, RQAP, FSS, RAMQ
- ✅ **Impôt sur le revenu du Québec**: Paliers progressifs + crédits
- ✅ **Impôt sur le revenu fédéral**: Paliers progressifs + crédits  
- ✅ **Crédit de solidarité du Québec**: Calculs familiaux complets
- ✅ **Prime au travail du Québec**: Supplément au revenu de travail
- ✅ **Aide sociale du Québec**: Programme d'assistance financière de dernier recours

### Programmes Fédéraux Récemment Implémentés
- ✅ **Allocation famille (Québec)**: IMPLÉMENTÉ
- ✅ **Allocation canadienne pour enfants (ACE)**: IMPLÉMENTÉ  
- ✅ **Crédit pour la TPS/TVH**: IMPLÉMENTÉ
- ✅ **Allocation canadienne pour les travailleurs (ACT)**: IMPLÉMENTÉ
- ✅ **Programme de la Sécurité de la vieillesse (PSV + SRG)**: IMPLÉMENTÉ
- ✅ **Supplément remboursable pour frais médicaux (fédéral + Québec)**: IMPLÉMENTÉ 

### Application Architecture

**Frontend (Next.js 14 + TypeScript + D3.js):**
- **`src/app/`**: App Router with main page and validation dashboard
- **`src/components/CompactCalculator.tsx`**: Main calculator interface with GOV.UK Design System
- **`src/components/DetailedResults.tsx`**: Comprehensive results display with tax breakdown
- **`src/components/ValidationDashboard.tsx`**: Real-time validation testing interface
- **`src/components/Slider.tsx`**: Custom input components with GOV.UK styling
- **`src/components/MarginalRateVisualization.tsx`**: Tax rate visualization components

**Configuration Management (TypeScript):**
- **`src/lib/config/data/2023.ts`, `src/lib/config/data/2024.ts`, `src/lib/config/data/2025.ts`**: Type-safe configuration with compile-time validation
- **`src/lib/config/types.ts`**: Comprehensive TypeScript interfaces for all tax parameters
- **`src/lib/config/ConfigManager.ts`**: Configuration loading with Decimal conversion and caching
- **`src/lib/core/exceptions.ts`**: Custom exception hierarchy for proper error handling

**Calculator Framework:**
- **`src/lib/core/BaseCalculator.ts`**: Abstract base class with common functionality
- **`src/lib/core/factory.ts`**: Factory pattern and registry for calculator creation
- **`src/lib/calculators/`**: Individual calculator modules (TypeScript):
  - `QppCalculator.ts`: Quebec Pension Plan (RRQ) contributions ✅
  - `EmploymentInsuranceCalculator.ts`: Employment Insurance contributions ✅
  - `RqapCalculator.ts`: Quebec Parental Insurance Plan ✅
  - `FssCalculator.ts`: Health Services Fund (retirees 65+) ✅
  - `RamqCalculator.ts`: Quebec prescription drug insurance ✅
  - `GstCreditCalculator.ts`: Federal GST/HST credit ✅
  - `CanadaWorkersBenefitCalculator.ts`: Canada Workers Benefit (ACT) ✅
  - `OldAgeSecurityCalculator.ts`: Old Age Security pension + Guaranteed Income Supplement ✅
  - `MedicalExpenseSupplementFederalCalculator.ts`: Federal Medical Expense Supplement ✅
  - `MedicalExpenseSupplementQuebecCalculator.ts`: Quebec Medical Expense Credit ✅
  - `SocialAssistanceCalculator.ts`: Quebec Social Assistance (Aide sociale) ✅

**Data Models:**
- **`src/lib/models/index.ts`**: Enhanced `Person`, `Household` classes with TypeScript validation
- **`src/lib/MainCalculator.ts`**: Main coordinator using factory pattern

**Internationalization:**
- **`src/lib/i18n/translations.ts`**: Complete bilingual support (French/English)

**Automated Validation System:**
- **`src/lib/validation/ValidationTestCases.ts`**: Base test scenarios and interfaces
- **`src/lib/validation/ValidationEngine.ts`**: Core validation engine with gap analysis
- **`src/lib/validation/MassTestGenerator.ts`**: Generator for thousands of test cases automatically
- **`src/lib/validation/HighVolumeValidator.ts`**: High-performance parallel validation system
- **`src/lib/validation/ContinuousValidationSystem.ts`**: Continuous monitoring with progress tracking
- **`src/lib/validation/AdvancedReporting.ts`**: Comprehensive analysis and HTML report generation
- **`src/lib/validation/ValidationCLI.ts`**: Complete command-line interface for all operations

### Household Types & Features
- ✅ **Single person**: Basic calculations with all cotisations
- ✅ **Single parent**: With children management and dropdown selector  
- ✅ **Couple**: Dual-income scenarios with combined calculations
- ✅ **Single retiree (65+)**: Retirement income with FSS calculations
- ✅ **Retired couple (65+)**: Combined retirement scenarios
- ✅ **Children management**: Intelligent display (only for couples/single parents)
- ✅ **Bilingual interface**: Complete French/English support
- ✅ **Responsive design**: GOV.UK Design System with professional styling

### Data Flow & Validation
1. **Real-time calculation** → 2. **Automated validation** → 3. **Gap analysis** → 4. **Accuracy reporting**

## Development Commands

### Current Next.js Application
```bash
# Install dependencies
npm install

# Development server (port 3001)
npm run dev

# Production build
npm run build

# Static export for GitHub Pages
npm run export

# Automated validation (CLI)
npm run validate

# Validation with file watching
npm run validate:watch

# Type checking
npm run lint

# Test production build locally
npm run test-prod

# Complete pre-deployment check (MANDATORY before git push)
npm run check
```

### Validation & Testing

#### Traditional Validation
```bash
# Access validation dashboard
# http://localhost:3001/validation

# CLI validation with comprehensive reporting
npm run validate
# Outputs: validation-report.json with detailed analysis

# Individual component validation
npm run validate:ramq    # RAMQ validation
npm run validate:rrq     # RRQ validation
npm run validate:ei      # Employment Insurance validation
npm run validate:rqap    # RQAP validation
npm run validate:fss     # FSS validation
```

#### Mass Validation System (NEW)
```bash
# Generate thousands of test cases
npm run validate:generate -- -n 5000 -s monte_carlo -o generated-cases.json

# High-volume validation (parallel processing)
npm run validate:high-volume -- -n 1000 -p 5 -b 50 -o ./validation-reports

# Continuous validation system 
npm run validate:continuous -- -i 30 -n 500 --accuracy-threshold 90

# Check validation status
npm run validate:status

# Analyze existing validation reports
npm run validate:analyze -- -f ./reports/validation-report.json
```

#### CLI Options
```bash
# Mass validation CLI help
npm run validate:mass -- --help

# Generate cases with specific parameters
npm run validate:generate -- \
  --count 10000 \
  --strategy grid \
  --year 2024 \
  --output ./test-cases.json

# High-volume validation with custom settings  
npm run validate:high-volume -- \
  --count 5000 \
  --parallel 8 \
  --batch-size 100 \
  --output ./mass-validation-reports

# Continuous validation with monitoring
npm run validate:continuous -- \
  --interval 60 \
  --count 1000 \
  --accuracy-threshold 85 \
  --regression-threshold 5 \
  --output ./continuous-reports
```

### Prerequisites
- Node.js 18+ (for Next.js 14)
- npm or yarn for package management
- Modern browser for testing interface
- **For Mass Validation**: Stable internet connection (scrapes official calculator)

### Setup Mass Validation System
```bash
# Configure and test the mass validation system
./scripts/setup-mass-validation.sh

# Run example demonstration
./scripts/example-mass-validation.sh
```

## Critical Implementation Notes

### Application Features
- **Port 3001**: Avoids conflict with other development servers (Docusaurus on 3000)
- **Static Export**: Ready for GitHub Pages deployment
- **Type Safety**: Full TypeScript with strict configuration validation
- **Performance**: Static imports with Webpack optimization vs dynamic JSON loading
- **Security**: Configuration bundled in app (no public exposure)

### Tax Year Parameters (2023-2025)
All calculators support all tax years with compile-time validated:
- Tax brackets and rates (TypeScript interfaces)
- Exemption thresholds and contribution limits
- Program parameters with strict typing

### Monetary Precision
- **Decimal.js library** for all monetary calculations  
- **ROUND_HALF_UP** for tax compliance
- Type-safe conversion with runtime validation

### Calculation Dependencies
**Execution order enforced**:
1. ✅ **Basic contributions** (RRQ, EI, RQAP) calculated first
2. 🔄 **Quebec income tax** uses contribution amounts for deductions (pending)
3. ✅ **RAMQ** uses family income calculations  
4. ✅ **FSS** only applies to retirees 65+ with proper age validation

### Age-Based Logic
- **Working age (18-64)**: Eligible for EI, RQAP contributions
- **Retirement age (65+)**: Subject to FSS, exempt from EI/RQAP
- **Income types**: Conditional UI showing work vs retirement income fields

### Key Business Rules Implemented
- ✅ **RAMQ**: Family income thresholds with household composition exemptions
- ✅ **RRQ 2024**: Two-tier additional contribution structure (max_additional_earnings)
- ✅ **FSS**: Progressive rates with income thresholds (retirees only)
- ✅ **Household types**: Different calculation paths for couples vs singles
- ✅ **Children logic**: Display only for couples and single parents

## UI/UX Design Implementation

### GOV.UK Design System
- **Professional styling**: Government-grade interface following accessibility standards
- **Typography**: Open Sans 14px for optimal readability  
- **Color palette**: Official GOV.UK colors (govuk-blue, govuk-green, etc.)
- **Components**: Native form elements with consistent styling
- **Responsive design**: Mobile-first approach with proper breakpoints

### User Experience Features  
- ✅ **Smart form logic**: Income fields adapt to household type (work vs retirement)
- ✅ **Children management**: Dropdown selector with bilingual labels ("Aucun enfant", "One child", etc.)
- ✅ **Interactive sliders**: Custom-styled range inputs with real-time feedback
- ✅ **Language toggle**: Seamless French/English switching
- ✅ **Results table**: Official format matching government calculator presentation
- ✅ **Validation feedback**: Real-time error handling and loading states

### Accessibility & Standards
- **Keyboard navigation**: Full keyboard support for all interactive elements
- **Screen readers**: Proper ARIA labels and semantic HTML
- **Focus management**: Clear focus indicators following GOV.UK standards
- **Color contrast**: WCAG 2.1 AA compliance
- **Typography scale**: Consistent heading hierarchy and readable text

## Validation & Quality Assurance

### Mass Validation System (NEW)
- **Scalable Testing**: Generate and validate up to 10,000+ test cases automatically
- **Multiple Strategies**: Systematic, random, grid-based, and Monte Carlo generation methods
- **Parallel Processing**: Multi-browser validation for high throughput and efficiency
- **Continuous Monitoring**: Automated regression detection with progress tracking
- **Advanced Analytics**: Comprehensive gap analysis with prioritized development recommendations
- **Production-Ready**: Designed to validate against the official Quebec Finance Ministry calculator

### Traditional Validation System  
- **15+ test scenarios**: Comprehensive coverage of all household types and edge cases
- **Gap analysis**: Automatic detection of differences vs official calculator
- **Severity classification**: Critical (>20%), Major (10-20%), Minor (<10%) differences
- **Performance monitoring**: Real-time accuracy reporting and recommendations
- **CLI integration**: Automated validation in development workflow

### Quality Metrics
- **Type safety**: 100% TypeScript with strict mode enabled
- **Build validation**: Zero TypeScript errors and warnings
- **Performance**: Optimized static bundle with tree-shaking
- **Bundle size**: Minimal footprint with efficient imports

## Future Development Priorities

### Programmes Socio-Fiscaux - Ordre d'Implémentation Prioritaire

Basé sur l'analyse du calculateur officiel du ministère des Finances du Québec et l'impact sur le revenu disponible :

**Phase 1 - Impôts (Impact Majeur)**
1. ✅ **Calculateur d'impôt sur le revenu du Québec** - IMPLÉMENTÉ
   - Paliers d'imposition progressifs ✅
   - Crédits d'impôt de base ✅
   - Déductions pour cotisations sociales ✅
   - Crédits pour personnes âgées, pension, vivant seul ✅

2. ✅ **Calculateur d'impôt sur le revenu fédéral** - IMPLÉMENTÉ
   - Paliers d'imposition fédéraux ✅
   - Crédits d'impôt personnels de base ✅
   - Déductions RPC, AE, RQAP ✅

**Phase 2 - Crédits et Allocations (Impact Élevé)**
3. ✅ **Crédit de solidarité du Québec** - IMPLÉMENTÉ
   - Remplace l'ancien crédit de TVQ ✅
   - Calculs selon composition familiale et revenu ✅
   - Versements mensuels ✅

4. ✅ **Prime au travail (Québec)** - IMPLÉMENTÉ
   - Supplément au revenu de travail ✅
   - Calculs selon situation familiale ✅
   - Réduction progressive selon le revenu ✅

5. ✅ **Allocation famille (Québec)** - IMPLÉMENTÉ
   - Soutien aux enfants du Québec ✅
   - Montants selon l'âge des enfants ✅
   - Réduction selon le revenu familial net ✅

**Phase 3 - Programmes Fédéraux (Impact Modéré)**
6. ✅ **Allocation canadienne pour enfants (ACE)** - IMPLÉMENTÉ
   - Prestation fédérale pour enfants ✅
   - Calculs selon le revenu familial net ajusté ✅
   - Suppléments pour jeunes enfants ✅

7. ✅ **Crédit pour la TPS/TVH** - IMPLÉMENTÉ
   - Crédit trimestriel fédéral ✅
   - Montants selon la composition familiale ✅
   - Réduction progressive ✅

8. ✅ **Allocation canadienne pour les travailleurs (ACT)** - IMPLÉMENTÉ
   - Prestation pour travailleurs à faible revenu ✅
   - Calculs selon la composition familiale ✅
   - Montants maximaux et réduction progressive ✅
   - *Note: Validations fines vs calculateur MFQ à venir*

9. ✅ **Programme de la Sécurité de la vieillesse (PSV + SRG)** - IMPLÉMENTÉ
   - Pension mensuelle pour Canadiens 65+ ✅
   - Logique trimestrielle avec moyenne des 4 trimestres ✅
   - Bonification 10% pour 75+ (juillet 2022) ✅
   - Récupération fiscale (15%) selon le revenu individuel ✅
   - Calculs séparés par personne dans le ménage ✅
   - Supplément de revenu garanti (SRG) intégré ✅
   - Interface détaillée avec explications complètes ✅

10. ✅ **Supplément remboursable pour frais médicaux** - IMPLÉMENTÉ
   - Crédit fédéral remboursable pour frais médicaux ✅
   - Crédit québécois remboursable pour frais médicaux ✅
   - Calculs selon revenu familial net et revenu de travail ✅
   - Réduction progressive selon seuils de revenu ✅
   - Interface avec champ de saisie pour frais médicaux ✅
   - Épingles et détails de calcul dans l'interface ✅ 

**Phase 4 - Programmes Spécialisés (Impact Ciblé)**
11. ✅ **Supplément de revenu garanti (SRG)** - IMPLÉMENTÉ dans OldAgeSecurityCalculator
   - Calculs selon composition familiale (personne seule, couple avec/sans PSV) ✅
   - Exemptions sur revenu d'emploi (5 000$ + 50% jusqu'à 15 000$) ✅
   - Réduction progressive (0,50$ par dollar de revenu) ✅
   - Seuils d'admissibilité par trimestre avec indexation CPI ✅
   - Interface détaillée avec calculs étape par étape ✅
12. ✅ **Aide sociale du Québec** - IMPLÉMENTÉ
   - Programme d'assistance financière de dernier recours ✅
   - Support pour aide sociale, solidarité sociale, et programme objectif emploi ✅
   - Calculs avec contraintes à l'emploi (temporaires/sévères) ✅
   - Exemptions sur revenus de travail (200$/mois célibataire, 300$/mois couple) ✅
   - Supplément de 25% sur revenus excédentaires (2025+) ✅
   - Vérification des avoirs liquides pour admissibilité ✅
   - Interface détaillée avec calculs mensuels et annuels ✅
13. ✅ **Supplément pour l'achat de fournitures scolaires** - IMPLÉMENTÉ
   - Calculateur dédié SchoolSuppliesSupplementCalculator ✅
   - Montant fixe par enfant éligible (4-16 ans) ✅
   - Configuration pour années 2023-2025 (115$, 121$, 124$) ✅
   - Intégration dans l'interface utilisateur avec épingle détaillée ✅
   - Validation vs calculateur officiel du MFQ ✅
14. 🔄 **Crédit pour la solidarité** - 
15. ✅ **Crédit d'impôt pour frais de garde d'enfants** - IMPLÉMENTÉ
   - Calculateur dédié ChildcareTaxCreditCalculator ✅
   - Taux progressifs selon le revenu familial net (78% à 67%) ✅
   - Plafonds selon l'âge et handicap des enfants ✅
   - Intégration interface avec frais par enfant ✅
   - Épingle et détails complets dans les résultats ✅
   - Configuration 2023-2025 avec indexation ✅
   - Validation manuelle vs paramètres officiels ✅
16. ✅ **Allocation-logement** - IMPLÉMENTÉ
   - Calculateur dédié HousingAllowanceCalculator ✅
   - Éligibilité basée sur âge, enfants, avoirs liquides et taux d'effort ✅
   - Support pour tous les types de ménages (célibataire 50+, couple 50+, famille) ✅
   - Configuration pour années 2023-2025 avec montants par palier (30-49%, 50-79%, 80%+) ✅
   - Intégration dans l'interface utilisateur avec accordéon pour coûts et avoirs ✅
   - Validation des seuils d'admissibilité et calcul des montants selon taux d'effort ✅
17. **Crédit d'impôt remboursable pour frais médicaux** -
18. **Montant pour le soutien des aînés** -

Note que l'ordre d'implémentation peut changer selon les priorités.

**🎯 PROCHAIN PROGRAMME À IMPLÉMENTER:** 
**Crédit d'impôt remboursable pour frais médicaux** - Crédit d'impôt remboursable du Québec pour les frais médicaux remboursables, complémentaire au crédit fédéral, visant à aider les contribuables avec des frais médicaux importants.

**Phase 5 - Validation et Intégration**
20.   🔄 **Mise à jour du système de validation massive**
    - Extension pour inclure tous les nouveaux programmes
    - Validation des interactions complexes entre programmes
    - Tests de régression pour l'ensemble du système

### Prioritisation Justifiée
- **Impact financier**: Les impôts et crédits majeurs affectent tous les ménages
- **Complexité technique**: Commencer par les calculs les plus structurés
- **Validation progressive**: Permettre la validation de chaque composant individuellement
- **Interdépendances**: Respecter les dépendances entre calculs (ex: revenu net ajusté)

### Enhancement Opportunities  
- **PDF Export**: Generate calculation summaries
- **Comparison Tool**: Side-by-side year comparison (2023 vs 2024)
- **Savings Calculator**: "What-if" scenarios for financial planning
- **API Integration**: Real-time tax parameter updates

## GitHub Pages Deployment

### Current Deployment Status
✅ **LIVE**: https://boisalai.github.io/revdisp/
- **Automatic deployment**: GitHub Actions workflow on every push to main
- **Static export**: Optimized for GitHub Pages hosting
- **Dynamic basePath**: Automatically adapts to repository name
- **Client-side hydration**: Proper SSR/CSR balance for static hosting

### Deployment Configuration
- **`next.config.js`**: Dynamic basePath using GITHUB_REPOSITORY environment variable
- **`.github/workflows/deploy.yml`**: Complete CI/CD pipeline with validation
- **Static export**: All pages pre-rendered for optimal performance
- **Asset optimization**: All resources properly prefixed for GitHub Pages

### Critical Deployment Lessons Learned
⚠️ **ALWAYS test production build before deployment**:
```bash
npm run check  # MANDATORY before every git push
```

**Common Issues Fixed:**
1. **Configuration key mismatch**: QppCalculator used non-existent 'total_rate' config key
2. **Hydration mismatch**: SSR/CSR state sync for static export
3. **Dynamic basePath**: Repository name detection for proper asset paths

### Pre-Deployment Workflow
✅ **Git Hook Installed**: Automatic `npm run check` before every push
- **TypeScript validation**: Zero errors/warnings required
- **Production build**: Must complete successfully 
- **Static export**: Must generate valid HTML/assets
- **Validation tests**: Automated calculator accuracy tests

### Emergency Rollback
If deployment fails:
```bash
git revert HEAD  # Revert last commit
git push origin main  # Deploy previous working version
```

## Development Best Practices

### Mandatory Pre-Deployment Checklist
1. ✅ **Run `npm run check`** - NEVER skip this step
2. ✅ **Test locally** with `npm run test-prod` if unsure
3. ✅ **Review console errors** in DevTools
4. ✅ **Verify all configuration keys exist** in tax year data files
5. ✅ **Test client-side functionality** (forms, calculations, results display)

### Configuration Management
**Critical**: All calculator configuration keys must exist in data files:
- **2023**: `src/lib/config/data/2023.ts`
- **2024**: `src/lib/config/data/2024.ts`  
- **2025**: `src/lib/config/data/2025.ts`

**Example Bug Pattern**: Using `getConfigValue('total_rate')` when only `base_rate` and `additional_rate_first` exist.

### Production vs Development Differences
- **Development**: Errors may be silently handled with fallbacks
- **Production**: Strict error handling, failures cause complete breakdown
- **Static Export**: No server-side error recovery, client-side must be perfect

### Git Workflow with Automated Checks
```bash
# Standard workflow (hooks will prevent broken deployments)
git add .
git commit -m "description"
git push origin main  # ← pre-push hook runs 'npm run check' automatically

# If hook fails:
npm run check  # See what failed
# Fix issues, then retry push
```

## Socio-Fiscal Program Implementation Methodology

### Revised Implementation Process

**Phase 1: Research & Analysis**
1. **Comprehensive documentation research**: Official sources (government sites, tax guides)
2. **Dependency analysis**: Map interactions with existing programs and data models
3. **Critical scenarios identification**: Edge cases, exemptions, special situations

**Phase 2: Technical Planning**
4. **Detailed implementation plan**: Architecture decisions, interfaces, data flow
5. **Fiscal parameters extraction**: Years 2023-2025 with validation sources
6. **Data model definition**: TypeScript interfaces, input/output specifications
7. **Algorithm design**: Calculation rules, business logic, validation requirements

**Phase 3: Development & Integration**
8. **Calculator implementation**: With integrated unit tests and error handling
9. **UI integration**: Form fields, results display, bilingual support
10. **Real-time validation**: Integration with existing validation framework

**Phase 4: Comprehensive Testing**
11. **Test case creation**: Comprehensive scenarios using official calculator
12. **Mass validation execution**: Automated testing with thousands of cases
13. **Gap analysis & iterative fixes**: Priority-based correction with validation loops
14. **Regression testing**: Full system validation to ensure no breaking changes

**Phase 5: Documentation & Deployment**
15. **Technical documentation**: Code documentation, API specs, algorithm explanations
16. **Project documentation updates**: CLAUDE.md, VALIDATION-SYSTEM.md, README.md
17. **Implementation status update**: Mark program as ✅ IMPLÉMENTÉ in CLAUDE.md priority list
18. **Pre-deployment validation**: Complete `npm run check` and production testing
19. **Commit & deployment**: Automated validation with GitHub Actions pipeline

### Key Process Improvements
- **Unit tests integrated** during development, not as afterthought
- **Continuous validation** throughout development cycle
- **Parallel documentation** to avoid knowledge gaps
- **Dependency-first analysis** to prevent architectural refactoring
- **Automated quality gates** at each phase transition
- **Iterative correction loops** with priority-based gap resolution
- Ajoute en mémoire le fait que tu peux accéder toi-même à l'application avec Playright sur le port 3001. J'ai Docusaurus qui utilise déjà localhost:3000. Tu peux ainsi faire les tests toi-même et vérifier si le rendu est correct.
- Garde en mémoire que l'impôt sur le revenu des particuliers du régime fiscal du Québec est déjà implémenté.
- Garde en mémoire que le crédit pour la solidarité serait maintenant implémenté.
- Garde en mémoire le fait que la prime au travail du Québec serait opérationnelle.