#!/usr/bin/env node

/**
 * Validation rapide avec seulement 10 cas pour diagnostic et correction
 * Évite les complications du scraping externe pour se concentrer sur les problèmes internes
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household, HouseholdType } from '../models'
import * as fs from 'fs'
import * as path from 'path'

interface QuickTestCase {
  id: string
  description: string
  household: Household
  expectedRange: { min: number, max: number }
}

async function runQuick10Validation() {
  console.log('🧪 VALIDATION RAPIDE - 10 CAS DE TEST')
  console.log('===================================')
  console.log()

  const calculator = new RevenuDisponibleCalculator(2024)
  
  try {
    await calculator.initialize()
    console.log('✅ Calculateur initialisé avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du calculateur:', error)
    return
  }

  // 10 cas de test représentatifs et simples
  const testCases: QuickTestCase[] = [
    {
      id: 'single_25k',
      description: 'Personne seule, 25 ans, 25 000$ travail',
      household: new Household({
        householdType: HouseholdType.SINGLE,
        primaryPerson: {
          age: 25,
          grossWorkIncome: 25000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 0
      }),
      expectedRange: { min: 20000, max: 24000 } // Approximation raisonnable
    },
    {
      id: 'single_45k',
      description: 'Personne seule, 35 ans, 45 000$ travail',
      household: new Household({
        householdType: HouseholdType.SINGLE,
        primaryPerson: {
          age: 35,
          grossWorkIncome: 45000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 0
      }),
      expectedRange: { min: 35000, max: 42000 }
    },
    {
      id: 'couple_basic',
      description: 'Couple, 30/28 ans, 40k$ + 30k$ travail',
      household: new Household({
        householdType: HouseholdType.COUPLE,
        primaryPerson: {
          age: 30,
          grossWorkIncome: 40000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        spouse: {
          age: 28,
          grossWorkIncome: 30000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 0
      }),
      expectedRange: { min: 55000, max: 65000 }
    },
    {
      id: 'single_parent',
      description: 'Monoparental, 32 ans, 35k$ travail, 1 enfant',
      household: new Household({
        householdType: HouseholdType.SINGLE_PARENT,
        primaryPerson: {
          age: 32,
          grossWorkIncome: 35000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 1
      }),
      expectedRange: { min: 40000, max: 50000 } // Avec allocations familiales
    },
    {
      id: 'couple_with_kids',
      description: 'Couple avec enfants, 35k$ + 25k$, 2 enfants',
      household: new Household({
        householdType: HouseholdType.COUPLE,
        primaryPerson: {
          age: 33,
          grossWorkIncome: 35000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        spouse: {
          age: 31,
          grossWorkIncome: 25000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 2
      }),
      expectedRange: { min: 65000, max: 75000 } // Avec allocations
    },
    {
      id: 'retiree_basic',
      description: 'Retraité seul, 67 ans, 20k$ retraite',
      household: new Household({
        householdType: HouseholdType.RETIRED_SINGLE,
        primaryPerson: {
          age: 67,
          grossWorkIncome: 0,
          grossRetirementIncome: 20000,
          isRetired: true
        },
        numChildren: 0
      }),
      expectedRange: { min: 18000, max: 22000 }
    },
    {
      id: 'high_income_single',
      description: 'Personne seule, revenu élevé, 80k$ travail',
      household: new Household({
        householdType: HouseholdType.SINGLE,
        primaryPerson: {
          age: 40,
          grossWorkIncome: 80000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 0
      }),
      expectedRange: { min: 58000, max: 68000 }
    },
    {
      id: 'low_income_single',
      description: 'Personne seule, faible revenu, 18k$ travail',
      household: new Household({
        householdType: HouseholdType.SINGLE,
        primaryPerson: {
          age: 22,
          grossWorkIncome: 18000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 0
      }),
      expectedRange: { min: 16000, max: 20000 }
    },
    {
      id: 'retired_couple',
      description: 'Couple retraité, 68/65 ans, 25k$ + 15k$ retraite',
      household: new Household({
        householdType: HouseholdType.RETIRED_COUPLE,
        primaryPerson: {
          age: 68,
          grossWorkIncome: 0,
          grossRetirementIncome: 25000,
          isRetired: true
        },
        spouse: {
          age: 65,
          grossWorkIncome: 0,
          grossRetirementIncome: 15000,
          isRetired: true
        },
        numChildren: 0
      }),
      expectedRange: { min: 35000, max: 42000 }
    },
    {
      id: 'middle_income_couple',
      description: 'Couple revenus moyens, 55k$ + 45k$ travail',
      household: new Household({
        householdType: HouseholdType.COUPLE,
        primaryPerson: {
          age: 38,
          grossWorkIncome: 55000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        spouse: {
          age: 36,
          grossWorkIncome: 45000,
          grossRetirementIncome: 0,
          isRetired: false
        },
        numChildren: 0
      }),
      expectedRange: { min: 75000, max: 85000 }
    }
  ]

  console.log(`📊 Test de ${testCases.length} cas représentatifs...`)
  console.log()

  let successCount = 0
  let errorCount = 0
  const results: Array<{
    id: string
    description: string
    status: 'success' | 'warning' | 'error'
    ourResult: number
    expected: string
    message: string
  }> = []

  for (const testCase of testCases) {
    console.log(`🔍 ${testCase.description}`)
    
    try {
      const calculationResult = await calculator.calculate(testCase.household)
      
      console.log(`   🔍 Structure du résultat:`, Object.keys(calculationResult))
      
      if (!calculationResult.revenu_disponible) {
        throw new Error(`revenu_disponible is undefined. Available keys: ${Object.keys(calculationResult).join(', ')}`)
      }
      
      const disposableIncome = calculationResult.revenu_disponible.toNumber()
      const grossIncome = testCase.household.primaryPerson.grossWorkIncome.plus(testCase.household.primaryPerson.grossRetirementIncome)
                         .plus(testCase.household.spouse ? 
                          testCase.household.spouse.grossWorkIncome.plus(testCase.household.spouse.grossRetirementIncome) : 0).toNumber()

      console.log(`   💰 Revenu brut: ${grossIncome.toLocaleString()}$`)
      console.log(`   🏠 Revenu disponible: ${disposableIncome.toLocaleString()}$`)

      // Vérifications basiques de sanité
      let status: 'success' | 'warning' | 'error' = 'success'
      let message = '✅ Résultat plausible'

      if (disposableIncome <= 0) {
        status = 'error'
        message = '❌ Revenu disponible négatif ou nul'
        errorCount++
      } else if (disposableIncome > grossIncome) {
        status = 'error'
        message = '❌ Revenu disponible > revenu brut (impossible)'
        errorCount++
      } else if (disposableIncome < testCase.expectedRange.min || disposableIncome > testCase.expectedRange.max) {
        status = 'warning'
        message = `⚠️  Hors de la fourchette attendue ${testCase.expectedRange.min.toLocaleString()}$ - ${testCase.expectedRange.max.toLocaleString()}$`
      } else {
        successCount++
      }

      results.push({
        id: testCase.id,
        description: testCase.description,
        status,
        ourResult: disposableIncome,
        expected: `${testCase.expectedRange.min.toLocaleString()}$ - ${testCase.expectedRange.max.toLocaleString()}$`,
        message
      })

      console.log(`   ${message}`)

      // Afficher quelques détails des cotisations pour diagnostic
      console.log(`   📋 Détails: AE=${calculationResult.cotisations.assurance_emploi?.toNumber() || 0}$, RRQ=${calculationResult.cotisations.rrq?.toNumber() || 0}$, RAMQ=${calculationResult.cotisations.ramq?.toNumber() || 0}$`)
      
    } catch (error) {
      errorCount++
      console.log(`   ❌ ERREUR: ${error}`)
      
      results.push({
        id: testCase.id,
        description: testCase.description,
        status: 'error',
        ourResult: 0,
        expected: `${testCase.expectedRange.min.toLocaleString()}$ - ${testCase.expectedRange.max.toLocaleString()}$`,
        message: `Erreur de calcul: ${error}`
      })
    }

    console.log()
  }

  // Résumé final
  console.log('📊 RÉSUMÉ FINAL')
  console.log('==============')
  console.log(`✅ Succès: ${successCount}/${testCases.length}`)
  console.log(`⚠️  Avertissements: ${results.filter(r => r.status === 'warning').length}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log()

  if (errorCount > 0) {
    console.log('🚨 ERREURS DÉTECTÉES:')
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   • ${r.description}: ${r.message}`)
    })
    console.log()
  }

  const accuracy = (successCount / testCases.length) * 100
  console.log(`🎯 Taux de succès: ${accuracy.toFixed(1)}%`)
  
  if (accuracy >= 80) {
    console.log('🎉 Système fonctionnel - prêt pour validation massive!')
  } else if (accuracy >= 50) {
    console.log('⚠️  Système partiellement fonctionnel - corrections nécessaires')
  } else {
    console.log('🔧 Système nécessite des corrections majeures')
  }

  // Sauvegarder les résultats
  const reportDir = './validation-reports/quick-10-cases'
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testCases.length,
      success: successCount,
      warnings: results.filter(r => r.status === 'warning').length,
      errors: errorCount,
      accuracy: accuracy
    },
    results
  }

  const reportPath = path.join(reportDir, 'quick-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📄 Rapport sauvé: ${reportPath}`)

  console.log()
  console.log('🔧 PROCHAINES ÉTAPES:')
  if (errorCount > 0) {
    console.log('1. Corriger les erreurs identifiées dans les calculs')
    console.log('2. Vérifier la configuration des calculateurs problématiques')
    console.log('3. Relancer cette validation rapide jusqu\'à 100% de succès')
    console.log('4. Ensuite, lancer la validation massive: npm run validate:progressive')
  } else {
    console.log('1. Système semble fonctionnel!')
    console.log('2. Lancer la validation massive: npm run validate:progressive')
    console.log('3. Analyser les écarts avec le calculateur officiel MFQ')
  }
}

// Point d'entrée
if (require.main === module) {
  runQuick10Validation().catch(console.error)
}

export { runQuick10Validation }