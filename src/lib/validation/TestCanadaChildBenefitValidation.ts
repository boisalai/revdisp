/**
 * Tests de validation pour l'Allocation canadienne pour enfants (ACE)
 * 
 * Ce fichier teste les calculs de l'ACE contre des scénarios connus
 * et valide la conformité avec les paramètres officiels du gouvernement du Canada.
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household, Person, HouseholdType } from '../models'
import Decimal from 'decimal.js'

interface CanadaChildBenefitTestCase {
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
    netBenefit: number
    baseBenefit: number
    disabilityBenefit: number
    reductionAmount: number
    childrenUnder6: number
    children6to17: number
  }
  threshold: number
}

const CANADA_CHILD_BENEFIT_TEST_CASES: CanadaChildBenefitTestCase[] = [
  // Test 1: Famille avec 1 enfant, revenu faible (2025)
  {
    testId: 'ccb_2025_single_parent_1child_low_income',
    description: 'Famille monoparentale avec 1 enfant < 6 ans, revenu 25 000 $ (sous le seuil)',
    taxYear: 2025,
    household: {
      householdType: HouseholdType.SINGLE_PARENT,
      primaryPerson: {
        age: 30,
        grossWorkIncome: 25000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 1
    },
    expected: {
      netBenefit: 7997, // Montant maximal pour enfant < 6 ans
      baseBenefit: 7997,
      disabilityBenefit: 0,
      reductionAmount: 0, // Aucune réduction sous le seuil
      childrenUnder6: 1,
      children6to17: 0
    },
    threshold: 50 // 50 $ de tolérance
  },

  // Test 2: Couple avec 2 enfants, revenu moyen (2024)
  {
    testId: 'ccb_2024_couple_2children_medium_income',
    description: 'Couple avec 2 enfants (1 < 6 ans, 1 de 6-17 ans), revenu 50 000 $',
    taxYear: 2024,
    household: {
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
      numChildren: 2
    },
    expected: {
      netBenefit: 13300, // Estimation avec réduction
      baseBenefit: 14357, // 7787 + 6570
      disabilityBenefit: 0,
      reductionAmount: 1057, // Réduction estimée
      childrenUnder6: 1,
      children6to17: 1
    },
    threshold: 200 // Tolérance plus élevée pour les calculs complexes
  },

  // Test 3: Famille sans enfants (ne devrait pas recevoir d'ACE)
  {
    testId: 'ccb_2024_couple_no_children',
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
      netBenefit: 0,
      baseBenefit: 0,
      disabilityBenefit: 0,
      reductionAmount: 0,
      childrenUnder6: 0,
      children6to17: 0
    },
    threshold: 1 // Devrait être exactement 0
  },

  // Test 4: Famille avec revenu élevé (forte réduction)
  {
    testId: 'ccb_2025_couple_3children_high_income',
    description: 'Couple avec 3 enfants, revenu élevé 150 000 $ (forte réduction)',
    taxYear: 2025,
    household: {
      householdType: HouseholdType.COUPLE,
      primaryPerson: {
        age: 40,
        grossWorkIncome: 80000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      spouse: {
        age: 38,
        grossWorkIncome: 70000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 3
    },
    expected: {
      netBenefit: 7000, // Estimation après forte réduction
      baseBenefit: 20491, // 7997 + 6748 + 6748 (estimation 2 enfants < 6 ans, 1 de 6-17)
      disabilityBenefit: 0,
      reductionAmount: 13491, // Forte réduction
      childrenUnder6: 1, // Estimation
      children6to17: 2  // Estimation
    },
    threshold: 500 // Tolérance élevée pour scénario complexe
  }
]

export async function validateCanadaChildBenefit(): Promise<void> {
  console.log('\\n=== VALIDATION ALLOCATION CANADIENNE POUR ENFANTS (ACE) ===\\n')
  
  let passedTests = 0
  let totalTests = CANADA_CHILD_BENEFIT_TEST_CASES.length
  const results: any[] = []

  for (const testCase of CANADA_CHILD_BENEFIT_TEST_CASES) {
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
      
      // Extraire les résultats de l'ACE
      const ccbResult = calculationResults.canada?.child_benefit
      
      if (!ccbResult) {
        console.log(`❌ ÉCHEC: Aucun résultat d'ACE trouvé`)
        results.push({
          testId: testCase.testId,
          status: 'FAIL',
          reason: 'No Canada Child Benefit result found'
        })
        continue
      }
      
      // Vérifier les résultats
      const actual = {
        netBenefit: ccbResult.net_benefit?.toNumber() || 0,
        baseBenefit: ccbResult.base_benefit?.toNumber() || 0,
        disabilityBenefit: ccbResult.disability_benefit?.toNumber() || 0,
        reductionAmount: ccbResult.reduction_amount?.toNumber() || 0,
        childrenUnder6: ccbResult.eligible_children_under_6 || 0,
        children6to17: ccbResult.eligible_children_6_to_17 || 0
      }
      
      // Calculer les différences
      const differences = {
        netBenefit: Math.abs(actual.netBenefit - testCase.expected.netBenefit),
        baseBenefit: Math.abs(actual.baseBenefit - testCase.expected.baseBenefit),
        disabilityBenefit: Math.abs(actual.disabilityBenefit - testCase.expected.disabilityBenefit),
        reductionAmount: Math.abs(actual.reductionAmount - testCase.expected.reductionAmount),
        childrenUnder6: Math.abs(actual.childrenUnder6 - testCase.expected.childrenUnder6),
        children6to17: Math.abs(actual.children6to17 - testCase.expected.children6to17)
      }
      
      // Vérifier si dans la tolérance
      const withinTolerance = Object.values(differences).every(diff => diff <= testCase.threshold)
      
      if (withinTolerance) {
        console.log(`✅ SUCCÈS`)
        console.log(`  ACE nette: ${actual.netBenefit.toFixed(2)} $ (attendu: ${testCase.expected.netBenefit} $)`)
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
        console.log(`  ACE nette: ${actual.netBenefit.toFixed(2)} $ (attendu: ${testCase.expected.netBenefit} $, diff: ${differences.netBenefit})`)
        console.log(`  Prestation de base: ${actual.baseBenefit.toFixed(2)} $ (attendu: ${testCase.expected.baseBenefit} $, diff: ${differences.baseBenefit})`)
        console.log(`  Prestation handicap: ${actual.disabilityBenefit.toFixed(2)} $ (attendu: ${testCase.expected.disabilityBenefit} $, diff: ${differences.disabilityBenefit})`)
        console.log(`  Réduction: ${actual.reductionAmount.toFixed(2)} $ (attendu: ${testCase.expected.reductionAmount} $, diff: ${differences.reductionAmount})`)
        console.log(`  Enfants < 6 ans: ${actual.childrenUnder6} (attendu: ${testCase.expected.childrenUnder6}, diff: ${differences.childrenUnder6})`)
        console.log(`  Enfants 6-17 ans: ${actual.children6to17} (attendu: ${testCase.expected.children6to17}, diff: ${differences.children6to17})`)
        
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
  console.log(`\\n=== RÉSUMÉ VALIDATION ACE ===`)
  console.log(`Tests réussis: ${passedTests}/${totalTests}`)
  console.log(`Taux de réussite: ${((passedTests/totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log(`🎉 Tous les tests sont passés ! L'ACE fonctionne correctement.`)
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) ont échoué. Vérifiez l'implémentation.`)
  }
  
  // Sauvegarder les résultats
  const fs = await import('fs')
  const reportPath = './canada-child-benefit-validation-report.json'
  
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
  console.log(`\\nRapport détaillé sauvegardé dans: ${reportPath}`)
}

// Fonction pour exécuter un test rapide
export async function quickCanadaChildBenefitTest(): Promise<boolean> {
  try {
    console.log('Test rapide de l\'Allocation canadienne pour enfants...')
    
    const calculator = new RevenuDisponibleCalculator(2025)
    await calculator.initialize()
    
    // Test simple: Famille monoparentale avec 1 enfant, revenu 30 000 $
    const household = new Household({
      householdType: HouseholdType.SINGLE_PARENT,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 30000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 1
    })
    
    const results = await calculator.calculate(household)
    const ccb = results.canada?.child_benefit
    
    if (!ccb) {
      console.log('❌ Échec: Aucun résultat d\'ACE')
      return false
    }
    
    const netBenefit = ccb.net_benefit?.toNumber() || 0
    const baseBenefit = ccb.base_benefit?.toNumber() || 0
    
    console.log(`✅ ACE calculée:`)
    console.log(`  - Prestation de base: ${baseBenefit.toFixed(2)} $`)
    console.log(`  - Prestation nette: ${netBenefit.toFixed(2)} $`)
    console.log(`  - Enfants éligibles: ${ccb.eligible_children_under_6 + ccb.eligible_children_6_to_17}`)
    
    // Vérifications de base
    const hasValidBenefit = netBenefit > 0 && netBenefit <= 8000 // Montant raisonnable
    const hasCorrectBase = Math.abs(baseBenefit - 7997) < 10 // 7997 $ en 2025 pour < 6 ans
    
    if (hasValidBenefit && hasCorrectBase) {
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