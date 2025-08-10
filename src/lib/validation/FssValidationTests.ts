/**
 * Tests de validation FSS avec le calculateur officiel MFQ
 * Comparer nos résultats avec les valeurs du calculateur du ministère des Finances
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { HouseholdType, Household, Person } from '../models'

export interface FssValidationTest {
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
 * Cas de test FSS basés sur les paramètres officiels
 * FSS s'applique SEULEMENT aux retraités de 65 ans et plus
 * Structure progressive avec paliers (voir FssCalculator.ts)
 * Source: Revenue Québec
 */
export const fssValidationTests: FssValidationTest[] = [
  {
    testId: 'fss_2024_working_age_no_contribution',
    description: 'FSS 2024 - Personne en âge de travailler, 50k$ travail (aucune cotisation)',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 40, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 0, // FSS ne s'applique pas aux moins de 65 ans
    threshold: 0
  },
  
  {
    testId: 'fss_2024_retired_20k',
    description: 'FSS 2024 - Retraité 67 ans, 20k$ retraite (exemption complète)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 67, grossWorkIncome: 0, grossRetirementIncome: 20000 },
      numChildren: 0
    },
    expectedMfqValue: 23.7, // (20000 - 17630) × 1% = 23.7$
    threshold: 0
  },
  
  {
    testId: 'fss_2024_retired_25k',
    description: 'FSS 2024 - Retraité 67 ans, 25k$ retraite (palier 2)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 67, grossWorkIncome: 0, grossRetirementIncome: 25000 },
      numChildren: 0
    },
    expectedMfqValue: 73.7, // (25000 - 17630) × 1% = 73.7$
    threshold: 5
  },
  
  {
    testId: 'fss_2024_retired_40k',
    description: 'FSS 2024 - Retraité 70 ans, 40k$ retraite (palier 3)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 70, grossWorkIncome: 0, grossRetirementIncome: 40000 },
      numChildren: 0
    },
    expectedMfqValue: 150, // Palier fixe de 150$ (entre 32630$ et 61315$)
    threshold: 5
  },
  
  {
    testId: 'fss_2024_retired_80k',
    description: 'FSS 2024 - Retraité 68 ans, 80k$ retraite (palier 4)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 68, grossWorkIncome: 0, grossRetirementIncome: 80000 },
      numChildren: 0
    },
    expectedMfqValue: 336.85, // 150 + (80000 - 61315) × 1% = 150 + 186.85 = 336.85$
    threshold: 10
  },
  
  {
    testId: 'fss_2024_retired_couple_30k_25k',
    description: 'FSS 2024 - Couple retraité 68/66 ans, 30k$/25k$ retraite',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_COUPLE,
      primaryPerson: { age: 68, grossWorkIncome: 0, grossRetirementIncome: 30000 },
      spouse: { age: 66, grossWorkIncome: 0, grossRetirementIncome: 25000 },
      numChildren: 0
    },
    expectedMfqValue: 197.4, // Chacun dans palier 2: (30000-17630)×1% + (25000-17630)×1% = 123.7 + 73.7 = 197.4$
    threshold: 15
  }
]

export async function runFssValidationTest(test: FssValidationTest): Promise<{
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
        isRetired: test.household.primaryPerson.grossRetirementIncome > 0 || test.household.primaryPerson.age >= 65
      },
      spouse: test.household.spouse ? {
        age: test.household.spouse.age,
        grossWorkIncome: test.household.spouse.grossWorkIncome,
        grossRetirementIncome: test.household.spouse.grossRetirementIncome,
        isRetired: test.household.spouse.grossRetirementIncome > 0 || test.household.spouse.age >= 65
      } : undefined,
      numChildren: test.household.numChildren
    })
    
    // Calculer avec notre système
    const calculator = new RevenuDisponibleCalculator(test.taxYear)
    const results = await calculator.calculate(household)
    
    // Extraire la cotisation FSS totale (nouvelle structure)
    let actualFss = 0
    if (results.cotisations && results.cotisations.fss) {
      // La cotisation FSS est maintenant un string dans results.cotisations.fss
      const value = results.cotisations.fss
      actualFss = typeof value === 'string' ? parseFloat(value) : value.toNumber()
    }
    
    // Comparer avec la valeur MFQ
    const difference = Math.abs(actualFss - test.expectedMfqValue)
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
      actual: Math.round(actualFss * 100) / 100, // Arrondir à 2 décimales
      difference,
      percentageDifference,
      status,
      threshold: test.threshold
    }
    
  } catch (error) {
    console.error(`Erreur test FSS ${test.testId}:`, error)
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