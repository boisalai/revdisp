#!/usr/bin/env node

/**
 * Test de validation spécifique pour le calculateur d'impôt du Québec
 * Génère des cas de test ciblés et valide contre le calculateur officiel
 */

import { MassTestGenerator } from './MassTestGenerator'
import { ValidationEngine } from './ValidationEngine'
import { AdvancedReportingEngine } from './AdvancedReporting'
import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household } from '../models'
import * as fs from 'fs'
import * as path from 'path'

async function runQuebecTaxValidation() {
  console.log('🧪 VALIDATION SPÉCIALISÉE - CALCULATEUR D\'IMPÔT DU QUÉBEC')
  console.log('=' .repeat(70))
  console.log()

  try {
    // 1. Configuration pour tests ciblés sur l'impôt
    const generator = new MassTestGenerator({
      totalCases: 200, // Plus petit nombre pour commencer
      taxYear: 2024,
      householdDistribution: {
        single: 40,        // Focus sur personnes seules
        couple: 30,        // Couples
        singleParent: 15,  // Familles monoparentales
        retiredSingle: 10, // Retraités
        retiredCouple: 5   // Couples retraités
      },
      incomeRanges: {
        min: 15000,   // Au-dessus du seuil de base
        max: 150000,  // Couvre plusieurs paliers d'imposition
        step: 5000
      }
    }, { type: 'systematic' })

    console.log('🏭 Génération de cas de test spécialisés pour l\'impôt du Québec...')
    const testCases = await generator.generateMassTestCases()
    console.log(`✅ ${testCases.length} cas générés`)
    console.log()

    // 2. Initialiser le moteur de validation
    const validationEngine = new ValidationEngine(2024)
    await validationEngine.initialize()

    // 3. Tester quelques cas manuellement d'abord
    console.log('🔍 Test préliminaire avec notre calculateur...')
    const calculator = new RevenuDisponibleCalculator(2024)
    await calculator.initialize()

    // Test rapide avec un cas simple
    const testHousehold = new Household({
      householdType: testCases[0].input.householdType,
      primaryPerson: {
        age: testCases[0].input.primaryPerson.age,
        grossWorkIncome: testCases[0].input.primaryPerson.grossWorkIncome,
        grossRetirementIncome: testCases[0].input.primaryPerson.grossRetirementIncome,
        isRetired: testCases[0].input.primaryPerson.grossRetirementIncome > 0
      },
      spouse: testCases[0].input.spouse ? {
        age: testCases[0].input.spouse.age,
        grossWorkIncome: testCases[0].input.spouse.grossWorkIncome,
        grossRetirementIncome: testCases[0].input.spouse.grossRetirementIncome,
        isRetired: testCases[0].input.spouse.grossRetirementIncome > 0
      } : undefined,
      numChildren: testCases[0].input.numChildren
    })

    const results = await calculator.calculate(testHousehold)
    
    console.log('📊 Exemple de résultat de notre calculateur:')
    console.log(`   💰 Revenu total: ${testHousehold.primaryPerson.grossWorkIncome}$ + ${testHousehold.spouse?.grossWorkIncome || 0}$`)
    console.log(`   🏛️  Cotisations RRQ: ${results.cotisations.rrq?.toFixed(2) || 0}$`)
    console.log(`   💼 Cotisations AE: ${results.cotisations.assurance_emploi?.toFixed(2) || 0}$`)
    console.log(`   👨‍👩‍👧‍👦 Cotisations RQAP: ${results.cotisations.rqap?.toFixed(2) || 0}$`)
    console.log(`   🏥 Impôt Québec: ${results.taxes.quebec?.toFixed(2) || 'Non calculé'}$`)
    console.log(`   💰 Revenu disponible: ${results.revenu_disponible.toFixed(2)}$`)
    console.log()

    // 4. Validation avec un sous-ensemble pour commencer
    console.log('🚀 Validation avec un échantillon de 10 cas...')
    const sampleCases = testCases.slice(0, 10)
    
    let passedTests = 0
    let failedTests = 0
    let errors = 0
    
    for (let i = 0; i < sampleCases.length; i++) {
      const testCase = sampleCases[i]
      console.log(`\n📋 Test ${i + 1}/${sampleCases.length}: ${testCase.description}`)
      
      try {
        const result = await validationEngine.runSingleTest(testCase)
        
        if (result.status === 'pass') {
          passedTests++
          console.log(`   ✅ SUCCÈS - Écart: ${result.totalPercentageDifference.toFixed(1)}%`)
        } else if (result.status === 'fail') {
          failedTests++
          console.log(`   ⚠️  ÉCART - Différence: ${result.totalPercentageDifference.toFixed(1)}%`)
          if (result.differences.length > 0) {
            const topDiff = result.differences[0]
            console.log(`      Principale différence: ${topDiff.field} (${topDiff.absoluteDifference.toFixed(0)}$)`)
          }
        } else {
          errors++
          console.log(`   ❌ ERREUR: ${result.errorMessage}`)
        }
      } catch (error) {
        errors++
        console.log(`   ❌ EXCEPTION: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
      
      // Petite pause pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 RÉSUMÉ DE LA VALIDATION PRÉLIMINAIRE')
    console.log('='.repeat(50))
    console.log(`✅ Tests réussis: ${passedTests}/${sampleCases.length}`)
    console.log(`⚠️  Tests échoués: ${failedTests}/${sampleCases.length}`)
    console.log(`❌ Erreurs: ${errors}/${sampleCases.length}`)
    
    const successRate = (passedTests / sampleCases.length) * 100
    console.log(`🎯 Taux de succès: ${successRate.toFixed(1)}%`)

    // 5. Sauvegarder les résultats
    const reportDir = './reports/quebec-tax-validation'
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(reportDir, `quebec-tax-validation-${timestamp}.json`)
    
    const report = {
      timestamp: new Date(),
      testSummary: {
        totalTests: sampleCases.length,
        passed: passedTests,
        failed: failedTests,
        errors: errors,
        successRate: successRate
      },
      testCases: sampleCases.map((tc, i) => ({
        id: tc.id,
        description: tc.description,
        input: tc.input,
        expectedResults: tc.expectedResults
      })),
      recommendations: [
        successRate < 50 ? 'Révision majeure du calculateur d\'impôt nécessaire' : null,
        successRate < 80 ? 'Ajustements des paramètres fiscaux requis' : null,
        failedTests > 0 ? 'Analyser les cas échoués pour identifier les patterns d\'erreurs' : null,
        errors > 0 ? 'Corriger les erreurs de configuration ou de logique' : null,
        'Étendre la validation à un plus grand échantillon une fois les problèmes résolus'
      ].filter(Boolean)
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n💾 Rapport sauvegardé: ${reportPath}`)

    // 6. Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    if (successRate >= 90) {
      console.log('🎉 Excellente performance ! Le calculateur d\'impôt semble bien fonctionner.')
      console.log('   → Prêt pour validation haute volume (1000+ cas)')
      console.log('   → Passer au prochain programme socio-fiscal')
    } else if (successRate >= 70) {
      console.log('✅ Performance acceptable mais améliorable.')
      console.log('   → Analyser les cas échoués pour ajustements mineurs')
      console.log('   → Validation étendue recommandée')
    } else if (successRate >= 50) {
      console.log('⚠️  Performance modérée - améliorations nécessaires.')
      console.log('   → Révision des paramètres fiscaux requise')
      console.log('   → Vérifier les paliers d\'imposition et crédits')
    } else {
      console.log('❌ Performance faible - révision majeure requise.')
      console.log('   → Vérifier la logique de calcul de base')
      console.log('   → Confirmer les paramètres fiscaux 2024')
      console.log('   → Ne pas passer au programme suivant avant correction')
    }

    console.log('\n🚀 PROCHAINES ÉTAPES SUGGÉRÉES:')
    console.log('1. Analyser les rapports détaillés dans ./reports/quebec-tax-validation/')
    console.log('2. Si taux de succès > 80%: lancer validation haute volume')
    console.log('   npm run validate:high-volume -- -n 1000 -p 3')
    console.log('3. Si corrections nécessaires: ajuster les paramètres et refaire le test')
    console.log('4. Une fois validé: passer à l\'impôt fédéral ou crédit de solidarité')

  } catch (error) {
    console.error('💥 Erreur durant la validation:', error)
    process.exit(1)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runQuebecTaxValidation().catch(error => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}

export { runQuebecTaxValidation }