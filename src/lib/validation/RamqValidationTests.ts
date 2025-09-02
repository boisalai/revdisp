/**
 * Tests de validation spécifiques pour RAMQ
 * Compares automatiquement avec le calculateur officiel du MFQ
 */

import { HouseholdType } from '../models'
import { ValidationTestCase } from './ValidationTestCases'

/**
 * Tests spécifiques RAMQ pour validation avec le calculateur MFQ
 */
export const RAMQValidationTests: ValidationTestCase[] = [
  {
    id: 'ramq_2024_single_50k',
    description: 'RAMQ 2024 - Personne seule, 50 000$ revenu brut',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 50000,
        grossRetirementIncome: 0
      },
      numChildren: 0
    },
    expectedResults: {
      // Revenus
      revenuBrut: 50000,
      revenu_disponible: 45262, // Estimation
      
      // Régime fiscal du Québec
      regimeFiscalQuebec: 0,
      impotRevenuQuebec: 0,
      creditSolidarite: 0,
      primeTravail: 0,
      
      // Régime fiscal fédéral  
      regimeFiscalFederal: 0,
      impotRevenuFederal: 0,
      creditTPS: 0,
      
      // Cotisations - FOCUS SUR RAMQ
      totalCotisations: 4738,
      assuranceEmploi: 660,
      rqap: 247,
      rrq: 2976,
      fss: 0,
      ramq: 738 // VALEUR ATTENDUE selon calculateur MFQ 2024
    },
    priority: 'high' as const,
    category: 'single' as const
  },
  
  {
    id: 'ramq_2025_single_50k',
    description: 'RAMQ 2025 - Personne seule, 50 000$ revenu brut',
    input: {
      taxYear: 2025,
      householdType: HouseholdType.SINGLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 50000,
        grossRetirementIncome: 0
      },
      numChildren: 0
    },
    expectedResults: {
      // Revenus
      revenuBrut: 50000,
      revenu_disponible: 45256, // Estimation
      
      // Régime fiscal du Québec
      regimeFiscalQuebec: 0,
      impotRevenuQuebec: 0,
      creditSolidarite: 0,
      primeTravail: 0,
      
      // Régime fiscal fédéral  
      regimeFiscalFederal: 0,
      impotRevenuFederal: 0,
      creditTPS: 0,
      
      // Cotisations - FOCUS SUR RAMQ
      totalCotisations: 4744,
      assuranceEmploi: 660,
      rqap: 247,
      rrq: 2976,
      fss: 0,
      ramq: 744 // VALEUR ATTENDUE selon calculateur MFQ 2025
    },
    priority: 'high' as const,
    category: 'single' as const
  },
  
  {
    id: 'ramq_2024_couple_100k',
    description: 'RAMQ 2024 - Couple, 100 000$ revenu brut total',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.COUPLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 60000,
        grossRetirementIncome: 0
      },
      spouse: {
        age: 33,
        grossWorkIncome: 40000,
        grossRetirementIncome: 0
      },
      numChildren: 0
    },
    expectedResults: {
      // Revenus
      revenuBrut: 100000,
      revenu_disponible: 90624, // Estimation
      
      // Régime fiscal du Québec
      regimeFiscalQuebec: 0,
      impotRevenuQuebec: 0,
      creditSolidarite: 0,
      primeTravail: 0,
      
      // Régime fiscal fédéral  
      regimeFiscalFederal: 0,
      impotRevenuFederal: 0,
      creditTPS: 0,
      
      // Cotisations
      totalCotisations: 9376,
      assuranceEmploi: 1320,
      rqap: 494,
      rrq: 5952,
      fss: 0,
      ramq: 1475 // 737.50 x 2 (couple) = 1475
    },
    priority: 'high' as const,
    category: 'couple' as const
  }
]

/**
 * Interface pour les résultats de validation RAMQ
 */
export interface RAMQValidationResult {
  testId: string
  taxYear: number
  expected: number
  actual: number
  difference: number
  percentageDifference: number
  status: 'PASS' | 'FAIL' | 'WARNING'
  threshold: number
}

/**
 * Seuils de tolérance pour la validation RAMQ
 */
export const RAMQ_VALIDATION_THRESHOLDS = {
  CRITICAL: 20, // Différence > 20$ = échec critique
  WARNING: 5,   // Différence > 5$ = avertissement
  PASS: 2       // Différence ≤ 2$ = succès (arrondi acceptable)
}

/**
 * Valide un résultat RAMQ contre les seuils attendus
 */
export function validateRAMQResult(
  testId: string,
  taxYear: number,
  expected: number,
  actual: number
): RAMQValidationResult {
  const difference = Math.abs(actual - expected)
  const percentageDifference = expected > 0 ? (difference / expected) * 100 : 0
  
  let status: 'PASS' | 'FAIL' | 'WARNING'
  let threshold: number
  
  if (difference <= RAMQ_VALIDATION_THRESHOLDS.PASS) {
    status = 'PASS'
    threshold = RAMQ_VALIDATION_THRESHOLDS.PASS
  } else if (difference <= RAMQ_VALIDATION_THRESHOLDS.WARNING) {
    status = 'WARNING'
    threshold = RAMQ_VALIDATION_THRESHOLDS.WARNING
  } else {
    status = 'FAIL'
    threshold = RAMQ_VALIDATION_THRESHOLDS.CRITICAL
  }
  
  return {
    testId,
    taxYear,
    expected,
    actual,
    difference,
    percentageDifference,
    status,
    threshold
  }
}

/**
 * Génère un rapport de validation RAMQ
 */
export function generateRAMQValidationReport(results: RAMQValidationResult[]): string {
  const passed = results.filter(r => r.status === 'PASS').length
  const warnings = results.filter(r => r.status === 'WARNING').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length
  
  let report = `
=== RAPPORT DE VALIDATION RAMQ ===

Tests exécutés: ${total}
✅ Réussis: ${passed}
⚠️  Avertissements: ${warnings}
❌ Échecs: ${failed}

Détails par test:
`
  
  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
    report += `${icon} ${result.testId} (${result.taxYear})\n`
    report += `   Attendu: ${result.expected.toFixed(2)}$\n`
    report += `   Obtenu:  ${result.actual.toFixed(2)}$\n`
    report += `   Écart:   ${result.difference.toFixed(2)}$ (${result.percentageDifference.toFixed(1)}%)\n\n`
  }
  
  return report
}