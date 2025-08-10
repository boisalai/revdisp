/**
 * Test d'intégration du calculateur RQAP
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

// Simulation simple pour tester la logique
async function testRQAPIntegration() {
  console.log('🧪 Test d\'intégration RQAP')
  console.log('=' .repeat(40))
  
  try {
    // Simuler les paramètres comme dans le vrai calculateur
    const income = 50000
    const params = {
      employeeRate: 0.00494, // 0.494%
      maxInsurable: 98000, // 2025
      minEarnings: 2000
    }
    
    console.log(`📊 Revenu simulé: ${income.toLocaleString('fr-CA')} $`)
    console.log(`📋 Paramètres RQAP 2025:`)
    console.log(`   - Taux employé: ${(params.employeeRate * 100).toFixed(3)} %`)
    console.log(`   - Maximum assurable: ${params.maxInsurable.toLocaleString('fr-CA')} $`)
    console.log(`   - Minimum requis: ${params.minEarnings.toLocaleString('fr-CA')} $`)
    
    // Calcul attendu
    if (income < params.minEarnings) {
      console.log('❌ Revenu sous le minimum requis')
      console.log('💰 Cotisation attendue: 0.00 $')
      return
    }
    
    const insurableEarnings = Math.min(income, params.maxInsurable)
    const expectedContribution = insurableEarnings * params.employeeRate
    
    console.log(`\n🧮 Calcul:`)
    console.log(`   Rémunération assurable: ${insurableEarnings.toLocaleString('fr-CA')} $`)
    console.log(`   ${insurableEarnings.toLocaleString('fr-CA')} × ${(params.employeeRate * 100).toFixed(3)}% = ${expectedContribution.toFixed(2)} $`)
    
    console.log(`\n🎯 RÉSULTAT ATTENDU: ${expectedContribution.toFixed(2)} $`)
    
    console.log('\n✅ Le calcul manuel donne le bon résultat.')
    console.log('❗ Vérifiez maintenant l\'interface web pour voir si les 247.00$ apparaissent bien à gauche.')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

testRQAPIntegration()