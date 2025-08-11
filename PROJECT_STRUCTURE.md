# Project Structure Guide

## Overview

This document explains the complete architecture and organization of the Quebec Disposable Income Calculator project.

## Root Directory Structure

```
revdisp/
├── src/                     # Source code (main application)
├── scripts/                 # Build and deployment scripts
├── reports/                 # Validation reports and analysis
├── tests/                   # Test files and validation scripts
├── out/                     # Generated static site (GitHub Pages)
├── node_modules/           # Dependencies (auto-generated)
├── .github/workflows/      # GitHub Actions CI/CD
└── [config files]         # Project configuration files
```

## Core Application (`src/`)

### Frontend Components (`src/app/` & `src/components/`)

**Next.js App Router Structure:**
- `src/app/page.tsx` - Main calculator page
- `src/app/validation/page.tsx` - Validation dashboard
- `src/app/layout.tsx` - Root layout with metadata
- `src/app/globals.css` - Global styles

**React Components:**
- `CompactCalculator.tsx` - Main calculator interface with form inputs
- `DetailedResults.tsx` - Tax calculation results display
- `MarginalRateVisualization.tsx` - Tax rate visualization charts
- `ValidationDashboard.tsx` - Real-time validation testing interface
- `Slider.tsx` - Custom slider input components

### Business Logic (`src/lib/`)

#### Tax Calculation Engine (`src/lib/calculators/`)
Each calculator handles a specific Quebec tax/contribution:

- `QppCalculator.ts` - Quebec Pension Plan (RRQ) contributions
- `EmploymentInsuranceCalculator.ts` - Federal employment insurance
- `RqapCalculator.ts` - Quebec Parental Insurance Plan
- `FssCalculator.ts` - Health Services Fund (retirees 65+)
- `RamqCalculator.ts` - Quebec prescription drug insurance
- `QcTaxCalculator.ts` - Quebec income tax (in development)
- `MarginalRateCalculator.ts` - Marginal tax rate calculations

#### Tax Parameters (`src/lib/config/`)
**Where the official tax parameters live:**

- `data/2023.ts` - Complete 2023 tax year parameters
- `data/2024.ts` - Complete 2024 tax year parameters  
- `data/2025.ts` - Complete 2025 tax year parameters
- `types.ts` - TypeScript interfaces for all tax parameters
- `ConfigManager.ts` - Configuration loading and caching system

**Parameter Structure Example:**
```typescript
// Each year file contains:
{
  qpp: { basic_exemption, max_earnings, rates... },
  ramq: { thresholds, rates, exemptions... },
  employment_insurance: { max_earnings, rates... },
  rqap: { max_earnings, rates... },
  fss: { thresholds, rates... }
}
```

#### Core Framework (`src/lib/core/`)
- `BaseCalculator.ts` - Abstract base class for all calculators
- `factory.ts` - Factory pattern for calculator creation
- `exceptions.ts` - Custom exception hierarchy

#### Data Models (`src/lib/models/`)
- `Person` class - Individual person data model
- `Household` class - Household composition and relationships
- TypeScript interfaces for all calculation inputs/outputs

#### Validation System (`src/lib/validation/`)
**Automated Testing Against Official Calculator:**

**Test Runners (What you run):**
- `RunRAMQValidation.ts` - Test RAMQ calculations
- `RunRRQValidation.ts` - Test Quebec Pension calculations
- `RunEIValidation.ts` - Test Employment Insurance
- `RunRQAPValidation.ts` - Test Parental Insurance
- `RunFSSValidation.ts` - Test Health Services Fund

**Test Cases (Test scenarios):**
- `RamqValidationTests.ts` - RAMQ test scenarios
- `RrqValidationTests.ts` - RRQ test scenarios
- `EiValidationTests.ts` - EI test scenarios
- `RqapValidationTests.ts` - RQAP test scenarios
- `FssValidationTests.ts` - FSS test scenarios

**Validation Framework:**
- `ValidationEngine.ts` - Comparison engine vs official calculator
- `ValidationRunner.ts` - CLI validation orchestrator
- `OfficialCalculatorScraper.ts` - Web scraping for official results

#### Internationalization (`src/lib/i18n/`)
- `translations.ts` - Complete French/English translations

## Testing & Validation

### Validation Reports (`reports/`)
Generated JSON reports showing accuracy vs official calculator:
- `ramq-validation-report.json`
- `rrq-validation-report.json`
- `ei-validation-report.json`
- `rqap-validation-report.json`
- `fss-validation-report.json`

### Test Files (`tests/`)
Standalone test scripts for specific scenarios:
- `test-*-simple.mjs` - Simple test cases
- `test-integration-*.mjs` - Integration tests
- `test-scraper.js` - Web scraper testing

## Deployment & Scripts (`scripts/`)

**Deployment Scripts:**
- `deploy-github-pages.sh` - Complete GitHub Pages deployment
- `check-before-deploy.sh` - Pre-deployment validation suite

**Validation Scripts:**
- `validate-ei.js` - Employment Insurance validation
- `validate-ei-automated.js` - Automated EI testing

## Configuration Files (Root)

**Next.js Configuration:**
- `next.config.js` - Next.js build configuration with GitHub Pages support
- `tsconfig.json` - TypeScript compiler configuration
- `tailwind.config.js` - Tailwind CSS styling configuration
- `postcss.config.js` - CSS post-processing

**Package Management:**
- `package.json` - Dependencies and npm scripts
- `package-lock.json` - Exact dependency versions

## Data Flow Architecture

### 1. Tax Parameter Loading
```
src/lib/config/data/[year].ts 
→ ConfigManager.ts 
→ Individual Calculators
```

### 2. Calculation Process
```
User Input (CompactCalculator)
→ Household Model Creation
→ MainCalculator Orchestration
→ Individual Calculator Execution
→ Results Aggregation
→ DetailedResults Display
```

### 3. Validation Process
```
Test Scenarios (ValidationTests)
→ Official Calculator Scraping
→ Our Calculator Execution
→ Comparison Engine
→ Report Generation (reports/)
```

## Key NPM Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run test-prod       # Test production build locally

# Validation (Testing Accuracy)
npm run validate:ramq   # Test RAMQ calculations
npm run validate:rrq    # Test Quebec Pension calculations
npm run validate:ei     # Test Employment Insurance
npm run validate:rqap   # Test Parental Insurance
npm run validate:fss    # Test Health Services Fund
npm run validate        # Run all validation tests

# Deployment
npm run check          # Complete pre-deployment validation
npm run export         # Generate static site for GitHub Pages
```

## Understanding the Tax Calculations

### Where Parameters Come From
All tax parameters are sourced from official Quebec government websites and stored in `src/lib/config/data/[year].ts` files.

### How Calculations Work
1. **ConfigManager** loads the appropriate year's parameters
2. **Individual calculators** use these parameters with the factory pattern
3. **BaseCalculator** provides common functionality (Decimal handling, config access)
4. **MainCalculator** orchestrates all calculations for a household

### How Validation Works
1. **Test scenarios** defined in ValidationTests files
2. **Official scraper** gets results from government calculator
3. **Comparison engine** identifies differences
4. **Reports** show accuracy percentages and specific variances

## Contributing Guidelines

**Adding New Tax Year:**
1. Create `src/lib/config/data/[year].ts` with official parameters
2. Add validation test cases in appropriate ValidationTests files
3. Update ConfigManager to support new year

**Adding New Calculator:**
1. Extend `BaseCalculator` class
2. Implement required calculation methods
3. Add to factory registration in `src/lib/calculators/index.ts`
4. Create validation test cases

**Modifying Parameters:**
Always update the `src/lib/config/data/[year].ts` files rather than hardcoding values in calculators.

This architecture ensures maintainability, accuracy validation, and clear separation of concerns between tax rules, calculations, and presentation.