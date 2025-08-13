/**
 * Tests de validation pour l'Allocation famille du Québec
 * 
 * Ce fichier teste les calculs de l'allocation famille contre des scénarios connus
 * et valide la conformité avec les paramètres officiels du gouvernement du Québec.
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household, Person, HouseholdType } from '../models'
import Decimal from 'decimal.js'

interface FamilyAllowanceTestCase {
  testId: string
  description: string
  taxYear: number
  household: {
    householdType: HouseholdType
    primaryPerson: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
      isRetired: boolean
    }
    spouse?: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
      isRetired: boolean
    }
    numChildren: number
  }
  expected: {
    netAllowance: number
    basicAllowance: number
    singleParentSupplement: number
    schoolSuppliesSupplement: number
    reductionAmount: number
  }
  threshold: number
}

const FAMILY_ALLOWANCE_TEST_CASES: FamilyAllowanceTestCase[] = [
  // Test 1: Couple avec 2 enfants, revenu faible (2024)
  {
    testId: 'family_allowance_2024_couple_2children_low_income',
    description: 'Couple avec 2 enfants, revenu 40 000 $ (en dessous du seuil)',
    taxYear: 2024,
    household: {
      householdType: HouseholdType.COUPLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 25000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      spouse: {
        age: 33,
        grossWorkIncome: 15000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 2
    },
    expected: {
      netAllowance: 6088, // 2 × 2923 + 2 × 121 (fournitures)
      basicAllowance: 5846, // 2 × 2923
      singleParentSupplement: 0,
      schoolSuppliesSupplement: 242, // 2 × 121
      reductionAmount: 0 // Aucune réduction sous le seuil
    },
    threshold: 50 // 50 $ de tolérance
  },

  // Test 2: Famille monoparentale avec 1 enfant, revenu moyen (2024)
  {
    testId: 'family_allowance_2024_single_parent_1child_medium_income',
    description: 'Famille monoparentale avec 1 enfant, revenu 50 000 $',
    taxYear: 2024,
    household: {
      householdType: HouseholdType.SINGLE_PARENT,
      primaryPerson: {
        age: 32,
        grossWorkIncome: 50000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 1
    },
    expected: {
      netAllowance: 3500, // Estimé avec réduction
      basicAllowance: 2923, // 1 × 2923
      singleParentSupplement: 1024,
      schoolSuppliesSupplement: 121, // 1 × 121
      reductionAmount: 568 // Réduction estimée
    },
    threshold: 100 // Tolérance plus élevée pour les calculs complexes
  },

  // Test 3: Couple sans enfants (2024) - Ne devrait pas recevoir d'allocation
  {
    testId: 'family_allowance_2024_couple_no_children',
    description: 'Couple sans enfants',
    taxYear: 2024,
    household: {
      householdType: HouseholdType.COUPLE,
      primaryPerson: {
        age: 40,
        grossWorkIncome: 60000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      spouse: {
        age: 38,
        grossWorkIncome: 45000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 0
    },
    expected: {
      netAllowance: 0,
      basicAllowance: 0,
      singleParentSupplement: 0,
      schoolSuppliesSupplement: 0,
      reductionAmount: 0
    },
    threshold: 1 // Devrait être exactement 0
  },

  // Test 4: Famille monoparentale avec 3 enfants, revenu élevé (2025)
  {
    testId: 'family_allowance_2025_single_parent_3children_high_income',
    description: 'Famille monoparentale avec 3 enfants, revenu 80 000 $ (2025)',
    taxYear: 2025,
    household: {
      householdType: HouseholdType.SINGLE_PARENT,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 80000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 3
    },
    expected: {
      netAllowance: 4500, // Montant minimum estimé après réduction
      basicAllowance: 9018, // 3 × 3006
      singleParentSupplement: 1055,
      schoolSuppliesSupplement: 372, // 3 × 124
      reductionAmount: 6000 // Réduction significative
    },
    threshold: 200 // Tolérance élevée pour scénario complexe
  }
]

export async function validateFamilyAllowance(): Promise<void> {
  console.log('\n=== VALIDATION ALLOCATION FAMILLE DU QUÉBEC ===\n')
  
  let passedTests = 0
  let totalTests = FAMILY_ALLOWANCE_TEST_CASES.length
  const results: any[] = []

  for (const testCase of FAMILY_ALLOWANCE_TEST_CASES) {
    try {
      console.log(`Test: ${testCase.testId}`)
      console.log(`Description: ${testCase.description}`)
      
      // Créer le calculateur
      const calculator = new RevenuDisponibleCalculator(testCase.taxYear)
      await calculator.initialize()
      
      // Créer le ménage
      const household = new Household(testCase.household)
      
      // Calculer les résultats
      const calculationResults = await calculator.calculate(household)
      
      // Extraire les résultats de l'allocation famille
      const familyAllowanceResult = calculationResults.quebec?.family_allowance
      
      if (!familyAllowanceResult) {
        console.log(`❌ ÉCHEC: Aucun résultat d'allocation famille trouvé`)
        results.push({
          testId: testCase.testId,
          status: 'FAIL',
          reason: 'No family allowance result found'
        })
        continue
      }
      
      // Vérifier les résultats
      const actual = {
        netAllowance: familyAllowanceResult.net_allowance?.toNumber() || 0,
        basicAllowance: familyAllowanceResult.basic_allowance?.toNumber() || 0,
        singleParentSupplement: familyAllowanceResult.single_parent_supplement?.toNumber() || 0,
        schoolSuppliesSupplement: familyAllowanceResult.school_supplies_supplement?.toNumber() || 0,
        reductionAmount: familyAllowanceResult.reduction_amount?.toNumber() || 0
      }
      
      // Calculer les différences
      const differences = {
        netAllowance: Math.abs(actual.netAllowance - testCase.expected.netAllowance),
        basicAllowance: Math.abs(actual.basicAllowance - testCase.expected.basicAllowance),
        singleParentSupplement: Math.abs(actual.singleParentSupplement - testCase.expected.singleParentSupplement),
        schoolSuppliesSupplement: Math.abs(actual.schoolSuppliesSupplement - testCase.expected.schoolSuppliesSupplement),
        reductionAmount: Math.abs(actual.reductionAmount - testCase.expected.reductionAmount)
      }
      
      // Vérifier si dans la tolérance
      const withinTolerance = Object.values(differences).every(diff => diff <= testCase.threshold)
      
      if (withinTolerance) {
        console.log(`✅ SUCCÈS`)
        console.log(`  Allocation nette: ${actual.netAllowance.toFixed(2)} $ (attendu: ${testCase.expected.netAllowance} $)`)
        passedTests++
        
        results.push({
          testId: testCase.testId,
          status: 'PASS',
          actual,
          expected: testCase.expected,
          differences
        })
      } else {
        console.log(`❌ ÉCHEC: Différences dépassent la tolérance`)
        console.log(`  Allocation nette: ${actual.netAllowance.toFixed(2)} $ (attendu: ${testCase.expected.netAllowance} $, diff: ${differences.netAllowance})`)
        console.log(`  Allocation de base: ${actual.basicAllowance.toFixed(2)} $ (attendu: ${testCase.expected.basicAllowance} $, diff: ${differences.basicAllowance})`)
        console.log(`  Supplément monoparental: ${actual.singleParentSupplement.toFixed(2)} $ (attendu: ${testCase.expected.singleParentSupplement} $, diff: ${differences.singleParentSupplement})`)
        console.log(`  Fournitures scolaires: ${actual.schoolSuppliesSupplement.toFixed(2)} $ (attendu: ${testCase.expected.schoolSuppliesSupplement} $, diff: ${differences.schoolSuppliesSupplement})`)
        console.log(`  Réduction: ${actual.reductionAmount.toFixed(2)} $ (attendu: ${testCase.expected.reductionAmount} $, diff: ${differences.reductionAmount})`)
        
        results.push({
          testId: testCase.testId,
          status: 'FAIL',
          actual,
          expected: testCase.expected,
          differences,
          reason: 'Values outside tolerance'
        })
      }
      
      console.log(`  Seuil de tolérance: ${testCase.threshold} $`)
      console.log('')
      
    } catch (error) {
      console.log(`❌ ERREUR: ${error}`)
      results.push({
        testId: testCase.testId,
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  // Résumé
  console.log(`\n=== RÉSUMÉ VALIDATION ALLOCATION FAMILLE ===`)
  console.log(`Tests réussis: ${passedTests}/${totalTests}`)
  console.log(`Taux de réussite: ${((passedTests/totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log(`🎉 Tous les tests sont passés ! L'allocation famille fonctionne correctement.`)
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) ont échoué. Vérifiez l'implémentation.`)
  }
  
  // Sauvegarder les résultats
  const fs = await import('fs')
  const reportPath = './family-allowance-validation-report.json'
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: ((passedTests/totalTests) * 100).toFixed(1)
    },
    results
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nRapport détaillé sauvegardé dans: ${reportPath}`)
}

// Fonction pour exécuter un test rapide
export async function quickFamilyAllowanceTest(): Promise<boolean> {
  try {
    console.log('Test rapide de l\'Allocation famille...')
    
    const calculator = new RevenuDisponibleCalculator(2024)
    await calculator.initialize()
    
    // Test simple: Couple avec 1 enfant, revenu 50 000 $
    const household = new Household({
      householdType: HouseholdType.COUPLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 30000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      spouse: {
        age: 33,
        grossWorkIncome: 20000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 1
    })
    
    const results = await calculator.calculate(household)
    const familyAllowance = results.quebec?.family_allowance
    
    if (!familyAllowance) {
      console.log('❌ Échec: Aucun résultat d\'allocation famille')
      return false
    }
    
    const netAllowance = familyAllowance.net_allowance?.toNumber() || 0
    const basicAllowance = familyAllowance.basic_allowance?.toNumber() || 0
    
    console.log(`✅ Allocation famille calculée:`)
    console.log(`  - Allocation de base: ${basicAllowance.toFixed(2)} $`)
    console.log(`  - Allocation nette: ${netAllowance.toFixed(2)} $`)
    console.log(`  - Enfants éligibles: ${familyAllowance.eligible_children}`)
    
    // Vérifications de base
    const hasValidAllowance = netAllowance > 0 && netAllowance <= 4000 // Montant raisonnable
    const hasCorrectBasic = Math.abs(basicAllowance - 2923) < 10 // 2923 $ en 2024
    
    if (hasValidAllowance && hasCorrectBasic) {
      console.log('✅ Test rapide réussi!')
      return true
    } else {
      console.log('❌ Test rapide échoué - Valeurs inattendues')
      return false
    }
    
  } catch (error) {
    console.log(`❌ Erreur lors du test rapide: ${error}`)
    return false
  }
}