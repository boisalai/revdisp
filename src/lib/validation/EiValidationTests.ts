/**
 * Tests de validation EI (assurance-emploi) avec le calculateur officiel MFQ
 * Comparer nos résultats avec les valeurs du calculateur du ministère des Finances
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { HouseholdType, Household, Person } from '../models'

export interface EiValidationTest {
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
 * Cas de test EI basés sur le calculateur officiel MFQ
 * Source: https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp
 */
export const eiValidationTests: EiValidationTest[] = [
  {
    testId: 'ei_2024_single_25k',
    description: 'EI 2024 - Personne seule, 25k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 30, grossWorkIncome: 25000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 330, // 25000 × 1.32% = 330$
    threshold: 5
  },
  
  {
    testId: 'ei_2024_single_50k',
    description: 'EI 2024 - Personne seule, 50k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 660, // 50000 × 1.32% = 660$
    threshold: 5
  },
  
  {
    testId: 'ei_2024_single_75k',
    description: 'EI 2024 - Personne seule, 75k$ travail (plafond)',
    taxYear: 2024,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 40, grossWorkIncome: 75000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 834.24, // Plafond EI 2024: 834.24$
    threshold: 1
  },
  
  {
    testId: 'ei_2025_single_50k',
    description: 'EI 2025 - Personne seule, 50k$ travail',
    taxYear: 2025,
    household: {
      type: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 655, // Estimation 2025 - à confirmer avec les vrais paramètres
    threshold: 20
  },
  
  {
    testId: 'ei_2024_couple_50k_45k',
    description: 'EI 2024 - Couple 50k$/45k$ travail',
    taxYear: 2024,
    household: {
      type: HouseholdType.COUPLE,
      primaryPerson: { age: 32, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      spouse: { age: 30, grossWorkIncome: 45000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedMfqValue: 1254, // 660 + 594 (50k + 45k × 1.32%)
    threshold: 10
  },
  
  {
    testId: 'ei_2024_retired_no_contribution',
    description: 'EI 2024 - Retraité 67 ans, 30k$ retraite (aucune cotisation)',
    taxYear: 2024,
    household: {
      type: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 67, grossWorkIncome: 0, grossRetirementIncome: 30000 },
      numChildren: 0
    },
    expectedMfqValue: 0, // Aucune cotisation EI sur revenus de retraite
    threshold: 0
  }
]

export async function runEiValidationTest(test: EiValidationTest): Promise<{
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
    
    // Extraire la cotisation EI totale (nouvelle structure)
    let actualEi = 0
    if (results.cotisations && results.cotisations.assurance_emploi) {
      // La cotisation EI est maintenant un string dans results.cotisations.assurance_emploi
      actualEi = parseFloat(results.cotisations.assurance_emploi)
    }
    
    // Comparer avec la valeur MFQ
    const difference = Math.abs(actualEi - test.expectedMfqValue)
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
      actual: Math.round(actualEi * 100) / 100, // Arrondir à 2 décimales
      difference,
      percentageDifference,
      status,
      threshold: test.threshold
    }
    
  } catch (error) {
    console.error(`Erreur test EI ${test.testId}:`, error)
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