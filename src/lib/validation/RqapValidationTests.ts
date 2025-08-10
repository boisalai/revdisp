/**
 * Tests de validation RQAP avec le calculateur officiel MFQ
 * Comparer nos résultats avec les valeurs du calculateur du ministère des Finances
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { HouseholdType, Household, Person } from '../models'

export interface RqapValidationTest {
  testId: string
  description: string
  taxYear: number
  household: {
    type: HouseholdType
    primaryPerson: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
    }
    spouse?: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
    }
    numChildren: number
  }
  expectedMfqValue: number // Valeur attendue du calculateur MFQ
  threshold: number // Seuil de tolérance en $
}

/**
 * Cas de test RQAP basés sur les paramètres officiels
 * Taux RQAP 2024: 0.494% (employé)
 * Maximum assurable: 94 000$
 * Maximum cotisation: 464.36$
 * Source: RQAP.gouv.qc.ca
 */
export const rqapValidationTests: RqapValidationTest[] = [
  {
    testId: 'rqap_2024_single_25k',
    description: 'RQAP 2024 - Personne seule, 25k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 30, grossWorkIncome: 25000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 123.5, // 25000 × 0.494% = 123.5$
    threshold: 2
  },
  
  {
    testId: 'rqap_2024_single_50k',
    description: 'RQAP 2024 - Personne seule, 50k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 247, // 50000 × 0.494% = 247$
    threshold: 2
  },
  
  {
    testId: 'rqap_2024_single_100k',
    description: 'RQAP 2024 - Personne seule, 100k$ travail (plafond atteint)',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 40, grossWorkIncome: 100000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 464.36, // Plafond RQAP 2024: 94000 × 0.494% = 464.36$
    threshold: 1
  },
  
  {
    testId: 'rqap_2025_single_50k',
    description: 'RQAP 2025 - Personne seule, 50k$ travail',
    taxYear: 2025,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 249, // Estimation 2025 avec indexation
    threshold: 5
  },
  
  {
    testId: 'rqap_2024_couple_50k_45k',
    description: 'RQAP 2024 - Couple 50k$/45k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.COUPLE,
      primaryPerson: { age: 32, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      spouse: { age: 30, grossWorkIncome: 45000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 469.3, // 247 + 222.3 (50k + 45k × 0.494%)
    threshold: 5
  },
  
  {
    testId: 'rqap_2024_retired_no_contribution',
    description: 'RQAP 2024 - Retraité 67 ans, 30k$ retraite (aucune cotisation)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 67, grossWorkIncome: 0, grossRetirementIncome: 30000 },
      numChildren: 0
    },
    expectedMfqValue: 0, // Aucune cotisation RQAP sur revenus de retraite
    threshold: 0
  }
]

export async function runRqapValidationTest(test: RqapValidationTest): Promise<{
  testId: string
  taxYear: number
  expected: number
  actual: number
  difference: number
  percentageDifference: number
  status: 'PASS' | 'WARN' | 'FAIL'
  threshold: number
}> {
  try {
    // Créer le ménage de test
    const household = new Household({
      householdType: test.household.type,
      primaryPerson: {
        age: test.household.primaryPerson.age,
        grossWorkIncome: test.household.primaryPerson.grossWorkIncome,
        grossRetirementIncome: test.household.primaryPerson.grossRetirementIncome,
        isRetired: test.household.primaryPerson.grossRetirementIncome > 0
      },
      spouse: test.household.spouse ? {
        age: test.household.spouse.age,
        grossWorkIncome: test.household.spouse.grossWorkIncome,
        grossRetirementIncome: test.household.spouse.grossRetirementIncome,
        isRetired: test.household.spouse.grossRetirementIncome > 0
      } : undefined,
      numChildren: test.household.numChildren
    })
    
    // Calculer avec notre système
    const calculator = new RevenuDisponibleCalculator(test.taxYear)
    const results = await calculator.calculate(household)
    
    // Extraire la cotisation RQAP totale (nouvelle structure)
    let actualRqap = 0
    if (results.cotisations && results.cotisations.rqap) {
      // La cotisation RQAP est maintenant un string dans results.cotisations.rqap
      actualRqap = parseFloat(results.cotisations.rqap)
    }
    
    // Comparer avec la valeur MFQ
    const difference = Math.abs(actualRqap - test.expectedMfqValue)
    const percentageDifference = test.expectedMfqValue > 0 
      ? (difference / test.expectedMfqValue) * 100 
      : 0
    
    // Déterminer le statut
    let status: 'PASS' | 'WARN' | 'FAIL'
    if (difference <= test.threshold) {
      status = 'PASS'
    } else if (difference <= test.threshold * 2) {
      status = 'WARN'
    } else {
      status = 'FAIL'
    }
    
    return {
      testId: test.testId,
      taxYear: test.taxYear,
      expected: test.expectedMfqValue,
      actual: Math.round(actualRqap * 100) / 100, // Arrondir à 2 décimales
      difference,
      percentageDifference,
      status,
      threshold: test.threshold
    }
    
  } catch (error) {
    console.error(`Erreur test RQAP ${test.testId}:`, error)
    return {
      testId: test.testId,
      taxYear: test.taxYear,
      expected: test.expectedMfqValue,
      actual: 0,
      difference: test.expectedMfqValue,
      percentageDifference: 100,
      status: 'FAIL',
      threshold: test.threshold
    }
  }
}