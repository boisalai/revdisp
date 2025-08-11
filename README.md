# Quebec Disposable Income Calculator

[![Deploy to GitHub Pages](https://github.com/boisalai/revdisp/actions/workflows/deploy.yml/badge.svg)](https://github.com/boisalai/revdisp/actions/workflows/deploy.yml)

A comprehensive Quebec disposable income calculator that accurately computes taxes, social insurance contributions, and government transfers. This implementation replicates the functionality of the official Quebec Ministry of Finance calculator with a modern web interface.

**Live Calculator:** [https://boisalai.github.io/revdisp/](https://boisalai.github.io/revdisp/)

## Overview

This calculator provides accurate calculations for Quebec households across different family compositions and income levels. It supports multiple tax years and handles all major Quebec social insurance programs and tax obligations.

**Target Users:**
- Families planning household budgets
- Workers understanding net income calculations  
- Tax professionals requiring accurate computations
- Researchers studying Quebec fiscal policy
- Students learning tax systems

## Features

- Complete Quebec contribution calculations: Quebec Pension Plan (QPP), Employment Insurance (EI), Quebec Parental Insurance Plan (QPIP), Health Services Fund (HSF), Quebec prescription drug insurance (RAMQ)
- Support for all household types: single person, couples, single parents, retirees
- Bilingual interface with full French and English support
- Professional government-grade interface following established design standards
- Real-time calculations with instant results
- Tax year support: 2023, 2024, and 2025 parameters

## Accuracy Validation

The calculator undergoes continuous automated validation against the official Quebec Ministry of Finance calculator:

| Component | Accuracy | Test Results | Status |
|-----------|----------|--------------|---------|
| RAMQ (Drug Insurance) | 100% | 3/3 tests passed | Validated |
| RRQ (Quebec Pension) | 99.7% | Minor variance <$11 | Validated |
| Employment Insurance | 100% | 6/6 tests passed | Validated |
| QPIP (Parental Insurance) | 100% | 6/6 tests passed | Validated |
| HSF (Health Services Fund) | 100% | 6/6 tests passed | Validated |

## Usage

1. Access the calculator at [boisalai.github.io/revdisp](https://boisalai.github.io/revdisp/)
2. Select tax year (2023, 2024, or 2025)
3. Choose household type (single, couple, single parent, retiree)
4. Enter personal information (age, gross income)
5. Add spouse information if applicable
6. Review detailed breakdown of taxes, contributions, and net disposable income

## Calculation Components

**Social Insurance Contributions:**
- Employment Insurance (EI): Federal unemployment benefit program
- Quebec Parental Insurance Plan (QPIP): Provincial parental and maternity leave program
- Quebec Pension Plan (RRQ): Provincial retirement savings program
- Health Services Fund (FSS): Quebec health system funding (individuals 65+)
- RAMQ: Quebec prescription drug insurance premium

**Tax Calculations:**
- Quebec provincial income tax
- Federal income tax (placeholder for future implementation)

**Special Considerations:**
- Age-based eligibility rules (working age 18-64 vs. retirement age 65+)
- RAMQ coverage determination (public plan requirement vs. private insurance option)
- Household composition effects on benefit calculations

## Official Data Sources

This calculator uses official government parameters from:

- [Quebec Ministry of Finance - Disposable Income Calculator](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp)
- [RAMQ - Quebec prescription drug insurance](https://www.ramq.gouv.qc.ca/en)
- [Retraite Québec - Quebec Pension Plan](https://www.rrq.gouv.qc.ca/en)
- [QPIP - Quebec Parental Insurance Plan](https://www.rqap.gouv.qc.ca/a_propos_regime/information_generale/index_en.asp)
- [Revenu Québec - Health Services Fund](https://www.revenuquebec.ca/en/)

## Technical Implementation

**Technology Stack:**
- Next.js 14 with TypeScript
- Tailwind CSS with GOV.UK design system components
- Decimal.js for precise monetary calculations
- Automated testing and validation framework
- GitHub Actions for continuous deployment

**Development Setup:**
```bash
git clone https://github.com/boisalai/revdisp.git
cd revdisp
npm install
npm run dev    # Development server on http://localhost:3001
```

**Quality Assurance:**
```bash
npm run validate    # Run validation tests against official calculator
npm run check       # Complete pre-deployment validation
npm run test-prod   # Test production build locally
```

## Project Architecture

The codebase is organized into clear functional areas:

**Tax Parameters (`src/lib/config/`)**
- `data/2023.ts`, `data/2024.ts`, `data/2025.ts` - Official government tax parameters for each year
- `types.ts` - TypeScript interfaces ensuring parameter accuracy
- `ConfigManager.ts` - Centralized configuration loading system

**Calculation Engine (`src/lib/calculators/`)**
- `QppCalculator.ts` - Quebec Pension Plan contributions
- `EmploymentInsuranceCalculator.ts` - Federal employment insurance
- `RqapCalculator.ts` - Quebec Parental Insurance Plan
- `RamqCalculator.ts` - Quebec prescription drug insurance
- `FssCalculator.ts` - Health Services Fund (retirees 65+)

**Testing & Validation (`src/lib/validation/`)**
- Test scenarios comparing our calculations against official government calculator
- Automated accuracy reports generated in `reports/` directory
- CLI validation runners: `npm run validate:ramq`, `npm run validate:rrq`, etc.

**User Interface (`src/components/`)**
- `CompactCalculator.tsx` - Main calculation form
- `DetailedResults.tsx` - Results breakdown display
- Professional government-grade styling with GOV.UK design system

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete architectural details.

## Privacy and Security

- No personal data collection or storage
- All calculations performed client-side
- No server-side data transmission
- HTTPS encryption for secure access
- Offline functionality after initial page load

## Contributing

Contributions are welcome. Please ensure all changes pass the validation suite and follow existing code patterns.

1. Fork the repository
2. Create a feature branch
3. Implement changes with appropriate tests
4. Run `npm run check` to verify all validations pass
5. Submit a pull request

## Legal Notice

This calculator is provided for informational purposes only. While accuracy is validated against official sources, this tool should not replace professional tax advice or official government calculators for legal or financial decisions.

For official calculations, consult:
- [Quebec Ministry of Finance Calculator](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp)
- A qualified tax professional

## License

MIT License - See [LICENSE](LICENSE) file for details