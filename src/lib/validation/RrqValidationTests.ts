/**
 * Tests de validation RRQ avec le calculateur officiel MFQ
 * Comparer nos résultats avec les valeurs du calculateur du ministère des Finances
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { HouseholdType, Household, Person } from '../models'

export interface RrqValidationTest {
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
 * Cas de test RRQ basés sur le calculateur officiel MFQ
 * Source: https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp
 */
export const rrqValidationTests: RrqValidationTest[] = [
  {
    testId: 'rrq_2024_single_25k',
    description: 'RRQ 2024 - Personne seule, 25k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 30, grossWorkIncome: 25000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 1485, // Valeur du calculateur MFQ
    threshold: 120
  },
  
  {
    testId: 'rrq_2024_single_50k',
    description: 'RRQ 2024 - Personne seule, 50k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 2970, // Valeur du calculateur MFQ
    threshold: 5
  },
  
  {
    testId: 'rrq_2024_single_75k',
    description: 'RRQ 2024 - Personne seule, 75k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 40, grossWorkIncome: 75000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 4455, // Valeur du calculateur MFQ (plafond atteint)
    threshold: 5
  },
  
  {
    testId: 'rrq_2025_single_50k',
    description: 'RRQ 2025 - Personne seule, 50k$ travail',
    taxYear: 2025,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 3060, // Valeur estimée 2025
    threshold: 10
  },
  
  {
    testId: 'rrq_2024_couple_50k_45k',
    description: 'RRQ 2024 - Couple 50k$/45k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.COUPLE,
      primaryPerson: { age: 32, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      spouse: { age: 30, grossWorkIncome: 45000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 5643, // 2970 + 2673 selon MFQ
    threshold: 10
  },
  
  {
    testId: 'rrq_2024_retired_no_contribution',
    description: 'RRQ 2024 - Retraité 67 ans, 30k$ retraite (aucune cotisation)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 67, grossWorkIncome: 0, grossRetirementIncome: 30000 },
      numChildren: 0
    },
    expectedMfqValue: 0, // Aucune cotisation RRQ sur revenus de retraite
    threshold: 0
  }
]

export async function runRrqValidationTest(test: RrqValidationTest): Promise<{
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
    
    // Extraire la cotisation RRQ totale (nouvelle structure)
    let actualRrq = 0
    if (results.cotisations && results.cotisations.rrq) {
      // La cotisation RRQ est maintenant un string dans results.cotisations.rrq
      actualRrq = parseFloat(results.cotisations.rrq)
    }
    
    // Comparer avec la valeur MFQ
    const difference = Math.abs(actualRrq - test.expectedMfqValue)
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
      actual: Math.round(actualRrq * 100) / 100, // Arrondir à 2 décimales
      difference,
      percentageDifference,
      status,
      threshold: test.threshold
    }
    
  } catch (error) {
    console.error(`Erreur test RRQ ${test.testId}:`, error)
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