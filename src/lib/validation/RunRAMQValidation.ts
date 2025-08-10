/**
 * Script pour exécuter la validation RAMQ automatiquement
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household, HouseholdType } from '../models'
import { 
  RAMQValidationTests, 
  validateRAMQResult, 
  generateRAMQValidationReport,
  RAMQValidationResult 
} from './RamqValidationTests'

/**
 * Exécute tous les tests de validation RAMQ
 */
export async function runRAMQValidation(): Promise<RAMQValidationResult[]> {
  console.log('🧪 Démarrage de la validation RAMQ...\n')
  
  const results: RAMQValidationResult[] = []
  
  for (const testCase of RAMQValidationTests) {
    console.log(`📋 Test: ${testCase.description}`)
    
    try {
      // Créer le calculateur pour l'année spécifiée
      const calculator = new RevenuDisponibleCalculator(testCase.input.taxYear)
      await calculator.initialize()
      
      // Créer le ménage
      const household = new Household({
        householdType: testCase.input.householdType,
        primaryPerson: {
          age: testCase.input.primaryPerson.age,
          grossWorkIncome: testCase.input.primaryPerson.grossWorkIncome,
          grossRetirementIncome: testCase.input.primaryPerson.grossRetirementIncome,
          isRetired: false
        },
        spouse: testCase.input.spouse ? {
          age: testCase.input.spouse.age,
          grossWorkIncome: testCase.input.spouse.grossWorkIncome,
          grossRetirementIncome: testCase.input.spouse.grossRetirementIncome,
          isRetired: false
        } : undefined,
        numChildren: testCase.input.numChildren
      })
      
      // Calculer les résultats
      const calculationResults = await calculator.calculate(household)
      
      // Extraire la cotisation RAMQ
      const actualRAMQ = calculationResults.cotisations.ramq ? 
        calculationResults.cotisations.ramq.toNumber() : 0
      
      // Valider le résultat
      const validationResult = validateRAMQResult(
        testCase.id,
        testCase.input.taxYear,
        testCase.expectedResults.ramq,
        actualRAMQ
      )
      
      results.push(validationResult)
      
      const statusIcon = validationResult.status === 'PASS' ? '✅' : 
                        validationResult.status === 'WARNING' ? '⚠️' : '❌'
      
      console.log(`   ${statusIcon} RAMQ: ${actualRAMQ.toFixed(2)}$ (attendu: ${testCase.expectedResults.ramq}$)`)
      console.log(`   Écart: ${validationResult.difference.toFixed(2)}$ (${validationResult.percentageDifference.toFixed(1)}%)\n`)
      
    } catch (error) {
      console.error(`❌ Erreur dans le test ${testCase.id}:`, error)
      
      results.push({
        testId: testCase.id,
        taxYear: testCase.input.taxYear,
        expected: testCase.expectedResults.ramq,
        actual: 0,
        difference: testCase.expectedResults.ramq,
        percentageDifference: 100,
        status: 'FAIL',
        threshold: 20
      })
    }
  }
  
  return results
}

/**
 * Fonction principale pour exécuter la validation
 */
export async function validateRAMQ(): Promise<void> {
  try {
    const results = await runRAMQValidation()
    const report = generateRAMQValidationReport(results)
    
    console.log(report)
    
    // Écrire le rapport dans un fichier
    const fs = await import('fs')
    const path = await import('path')
    
    const reportPath = path.resolve(process.cwd(), 'ramq-validation-report.json')
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'PASS').length,
        warnings: results.filter(r => r.status === 'WARNING').length,
        failed: results.filter(r => r.status === 'FAIL').length
      },
      results
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    console.log(`📊 Rapport sauvegardé: ${reportPath}`)
    
    // Exit code basé sur les résultats
    const hasCriticalFailures = results.some(r => r.status === 'FAIL')
    if (hasCriticalFailures) {
      console.log('❌ Validation échouée - des erreurs critiques ont été détectées')
      process.exit(1)
    } else {
      console.log('✅ Validation réussie - tous les tests critiques sont passés')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation RAMQ:', error)
    process.exit(1)
  }
}

// Si ce script est exécuté directement
if (require.main === module) {
  validateRAMQ()
}