/**
 * Tests de validation spécifiques pour l'assurance-emploi
 * 
 * Compare les résultats de notre calculateur avec les valeurs officielles
 * du gouvernement du Canada pour 2024 et 2025
 */

import Decimal from 'decimal.js'
import { EmploymentInsuranceCalculator } from '../calculators/EmploymentInsuranceCalculator'
import { CalculatorFactory } from '../core/factory'
import { Person } from '../models'

// Import des calculators pour s'assurer de leur enregistrement
import '../calculators'

interface EIValidationCase {
  description: string
  year: number
  gross_work_income: number
  age: number
  is_retired: boolean
  expected_employee_contribution: number
  expected_employer_contribution: number
  expected_total_contribution: number
  expected_insurable_earnings: number
  is_exempt?: boolean
  exemption_reason?: string
}

/**
 * Cas de test officiels basés sur les paramètres gouvernementaux
 */
export const EI_VALIDATION_CASES: EIValidationCase[] = [
  // =============================================================================
  // TESTS 2024 - Paramètres officiels
  // =============================================================================
  
  {
    description: "2024 - Travailleur à salaire minimum (20h/sem × 52 sem × 15.75$/h)",
    year: 2024,
    gross_work_income: 16380,
    age: 25,
    is_retired: false,
    expected_employee_contribution: 216.22, // 16380 × 1.32%
    expected_employer_contribution: 302.71, // 16380 × 1.848% (1.32% × 1.4)
    expected_total_contribution: 518.93,
    expected_insurable_earnings: 16380
  },

  {
    description: "2024 - Travailleur à revenu médian (50 000 $)",
    year: 2024,
    gross_work_income: 50000,
    age: 35,
    is_retired: false,
    expected_employee_contribution: 660.00, // 50000 × 1.32%
    expected_employer_contribution: 924.00, // 50000 × 1.848%
    expected_total_contribution: 1584.00,
    expected_insurable_earnings: 50000
  },

  {
    description: "2024 - Travailleur au maximum assurable (63 200 $)",
    year: 2024,
    gross_work_income: 63200,
    age: 40,
    is_retired: false,
    expected_employee_contribution: 834.24, // Maximum officiel
    expected_employer_contribution: 1167.94, // 834.24 × 1.4
    expected_total_contribution: 2002.18,
    expected_insurable_earnings: 63200
  },

  {
    description: "2024 - Travailleur avec revenu supérieur au maximum (100 000 $)",
    year: 2024,
    gross_work_income: 100000,
    age: 45,
    is_retired: false,
    expected_employee_contribution: 834.24, // Plafonné au maximum
    expected_employer_contribution: 1167.94, // Plafonné au maximum
    expected_total_contribution: 2002.18,
    expected_insurable_earnings: 63200 // Plafonné au maximum assurable
  },

  {
    description: "2024 - Travailleur sous le seuil minimum (1 500 $)",
    year: 2024,
    gross_work_income: 1500,
    age: 22,
    is_retired: false,
    expected_employee_contribution: 0, // Sous le seuil de 2000$
    expected_employer_contribution: 0,
    expected_total_contribution: 0,
    expected_insurable_earnings: 0
  },

  {
    description: "2024 - Retraité de 65 ans (exemption)",
    year: 2024,
    gross_work_income: 30000,
    age: 65,
    is_retired: true,
    expected_employee_contribution: 0,
    expected_employer_contribution: 0,
    expected_total_contribution: 0,
    expected_insurable_earnings: 0,
    is_exempt: true,
    exemption_reason: "Personne retraitée de 65 ans et plus"
  },

  {
    description: "2024 - Retraité de 67 ans (exemption)",
    year: 2024,
    gross_work_income: 25000,
    age: 67,
    is_retired: true,
    expected_employee_contribution: 0,
    expected_employer_contribution: 0,
    expected_total_contribution: 0,
    expected_insurable_earnings: 0,
    is_exempt: true,
    exemption_reason: "Personne retraitée de 65 ans et plus"
  },

  // =============================================================================
  // TESTS 2025 - Paramètres officiels annoncés
  // =============================================================================

  {
    description: "2025 - Travailleur à salaire minimum (estimation 16.50$/h × 20h × 52)",
    year: 2025,
    gross_work_income: 17160,
    age: 25,
    is_retired: false,
    expected_employee_contribution: 224.80, // 17160 × 1.31%
    expected_employer_contribution: 314.71, // 17160 × 1.31% × 1.4 (arrondi)
    expected_total_contribution: 539.51,
    expected_insurable_earnings: 17160
  },

  {
    description: "2025 - Travailleur à revenu médian (50 000 $)",
    year: 2025,
    gross_work_income: 50000,
    age: 35,
    is_retired: false,
    expected_employee_contribution: 655.00, // 50000 × 1.31%
    expected_employer_contribution: 917.00, // 50000 × 1.31% × 1.4 (arrondi)
    expected_total_contribution: 1572.00,
    expected_insurable_earnings: 50000
  },

  {
    description: "2025 - Travailleur au maximum assurable (65 700 $)",
    year: 2025,
    gross_work_income: 65700,
    age: 40,
    is_retired: false,
    expected_employee_contribution: 860.67, // Maximum officiel annoncé
    expected_employer_contribution: 1204.94, // 860.67 × 1.4
    expected_total_contribution: 2065.61,
    expected_insurable_earnings: 65700
  },

  {
    description: "2025 - Travailleur avec revenu supérieur au maximum (120 000 $)",
    year: 2025,
    gross_work_income: 120000,
    age: 50,
    is_retired: false,
    expected_employee_contribution: 860.67, // Plafonné
    expected_employer_contribution: 1204.94, // Plafonné
    expected_total_contribution: 2065.61,
    expected_insurable_earnings: 65700 // Plafonné au maximum assurable
  },

  // =============================================================================
  // TESTS DE CAS LIMITES
  // =============================================================================

  {
    description: "2024 - Exactement au seuil minimum (2 000 $)",
    year: 2024,
    gross_work_income: 2000,
    age: 20,
    is_retired: false,
    expected_employee_contribution: 26.40, // 2000 × 1.32%
    expected_employer_contribution: 36.96, // 2000 × 1.848%
    expected_total_contribution: 63.36,
    expected_insurable_earnings: 2000
  },

  {
    description: "2024 - Juste sous le seuil minimum (1 999 $)",
    year: 2024,
    gross_work_income: 1999,
    age: 20,
    is_retired: false,
    expected_employee_contribution: 0, // Sous le seuil
    expected_employer_contribution: 0,
    expected_total_contribution: 0,
    expected_insurable_earnings: 0
  },

  {
    description: "2025 - Exactement au seuil minimum (2 000 $)",
    year: 2025,
    gross_work_income: 2000,
    age: 20,
    is_retired: false,
    expected_employee_contribution: 26.20, // 2000 × 1.31%
    expected_employer_contribution: 36.68, // 2000 × 1.31% × 1.4 (arrondi)
    expected_total_contribution: 62.88,
    expected_insurable_earnings: 2000
  }
]

/**
 * Classe pour exécuter les tests de validation de l'assurance-emploi
 */
export class EmploymentInsuranceValidator {
  
  /**
   * Exécute tous les tests de validation
   */
  static async runAllTests(): Promise<{
    passed: number
    failed: number
    results: Array<{
      case: EIValidationCase
      success: boolean
      actual: any
      expected: any
      errors: string[]
    }>
  }> {
    const results = []
    let passed = 0
    let failed = 0

    for (const testCase of EI_VALIDATION_CASES) {
      const result = await this.runSingleTest(testCase)
      results.push(result)
      
      if (result.success) {
        passed++
      } else {
        failed++
      }
    }

    return { passed, failed, results }
  }

  /**
   * Exécute un test de validation individuel
   */
  static async runSingleTest(testCase: EIValidationCase) {
    const calculator = await CalculatorFactory.createCalculator('employment_insurance', testCase.year) as EmploymentInsuranceCalculator

    // Création de la personne de test
    const person = new Person({
      age: testCase.age,
      grossWorkIncome: testCase.gross_work_income,
      grossRetirementIncome: 0,
      selfEmployedIncome: 0,
      isRetired: testCase.is_retired
    })

    const actual = calculator.calculateDetailed(person)
    const errors: string[] = []

    // Vérifications avec tolérance pour les arrondissements
    const tolerance = 0.02 // 2 cents de tolérance

    if (!this.isWithinTolerance(actual.employee.toNumber(), testCase.expected_employee_contribution, tolerance)) {
      errors.push(`Cotisation employé: attendu ${testCase.expected_employee_contribution}, obtenu ${actual.employee.toNumber()}`)
    }

    if (!this.isWithinTolerance(actual.employer.toNumber(), testCase.expected_employer_contribution, tolerance)) {
      errors.push(`Cotisation employeur: attendu ${testCase.expected_employer_contribution}, obtenu ${actual.employer.toNumber()}`)
    }

    if (!this.isWithinTolerance(actual.total.toNumber(), testCase.expected_total_contribution, tolerance)) {
      errors.push(`Total: attendu ${testCase.expected_total_contribution}, obtenu ${actual.total.toNumber()}`)
    }

    if (!this.isWithinTolerance(actual.insurable_earnings.toNumber(), testCase.expected_insurable_earnings, tolerance)) {
      errors.push(`Revenus assurables: attendu ${testCase.expected_insurable_earnings}, obtenu ${actual.insurable_earnings.toNumber()}`)
    }

    if (testCase.is_exempt !== undefined && actual.is_exempt !== testCase.is_exempt) {
      errors.push(`Exemption: attendu ${testCase.is_exempt}, obtenu ${actual.is_exempt}`)
    }

    if (testCase.exemption_reason && actual.exemption_reason !== testCase.exemption_reason) {
      errors.push(`Raison exemption: attendu "${testCase.exemption_reason}", obtenu "${actual.exemption_reason}"`)
    }

    return {
      case: testCase,
      success: errors.length === 0,
      actual: {
        employee: actual.employee.toNumber(),
        employer: actual.employer.toNumber(),
        total: actual.total.toNumber(),
        insurable_earnings: actual.insurable_earnings.toNumber(),
        is_exempt: actual.is_exempt,
        exemption_reason: actual.exemption_reason
      },
      expected: {
        employee: testCase.expected_employee_contribution,
        employer: testCase.expected_employer_contribution,
        total: testCase.expected_total_contribution,
        insurable_earnings: testCase.expected_insurable_earnings,
        is_exempt: testCase.is_exempt,
        exemption_reason: testCase.exemption_reason
      },
      errors
    }
  }

  /**
   * Vérifie si deux valeurs sont dans la tolérance acceptable
   */
  private static isWithinTolerance(actual: number, expected: number, tolerance: number): boolean {
    return Math.abs(actual - expected) <= tolerance
  }
}

/**
 * Runner CLI pour les tests de validation AE
 */
if (require.main === module) {
  (async () => {
    console.log('🧪 Tests de validation - Assurance-emploi')
    console.log('==========================================\n')

    const results = await EmploymentInsuranceValidator.runAllTests()

    console.log(`📊 Résultats: ${results.passed} réussis, ${results.failed} échoués\n`)

    if (results.failed > 0) {
      console.log('❌ Tests échoués:')
      results.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`\n• ${result.case.description}`)
          result.errors.forEach(error => console.log(`  - ${error}`))
        })
    }

    if (results.passed > 0) {
      console.log('✅ Tests réussis:')
      results.results
        .filter(r => r.success)
        .forEach(result => {
          console.log(`  • ${result.case.description}`)
        })
    }

    process.exit(results.failed > 0 ? 1 : 0)
  })()
}