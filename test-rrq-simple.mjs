/**
 * Test simple pour valider les calculs RRQ
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Fonction pour tester le RRQ manuellement
function testRRQCalculation(income, year = 2024) {
  console.log(`\n🧮 Test calcul RRQ ${year}`)
  console.log('=' .repeat(40))
  console.log(`📊 Revenu: ${income.toLocaleString('fr-CA')} $`)
  
  // Paramètres officiels corrigés
  const params2024 = {
    basicExemption: 3500,
    maxPensionable: 68500,
    totalRate: 0.064 // 6.40% (5.40% base + 1.00% supplémentaire)
  }
  
  const params2025 = {
    basicExemption: 3500,
    maxPensionable: 71300,
    totalRate: 0.064 // 6.40% (5.40% base + 1.00% supplémentaire)
  }
  
  const params = year === 2025 ? params2025 : params2024
  
  if (income <= params.basicExemption) {
    console.log(`❌ Revenu sous l'exemption de base (${params.basicExemption} $)`)
    console.log('💰 Cotisation RRQ: 0.00 $')
    return 0
  }
  
  // Calcul simplifié : (Revenu - Exemption) × 6.40%
  const pensionableEarnings = Math.min(income, params.maxPensionable) - params.basicExemption
  const totalContribution = pensionableEarnings * params.totalRate
  
  console.log(`📋 Exemption de base: ${params.basicExemption.toLocaleString('fr-CA')} $`)
  console.log(`📈 Maximum des gains ouvrant droit à pension: ${params.maxPensionable.toLocaleString('fr-CA')} $`)
  console.log(`💼 Gains ouvrant droit à pension: ${pensionableEarnings.toLocaleString('fr-CA')} $`)
  console.log(`📊 Taux employé RRQ: ${(params.totalRate * 100).toFixed(2)} % (5.40% + 1.00%)`)
  console.log(`💰 Cotisation RRQ: ${totalContribution.toFixed(2)} $`)
  
  console.log('─'.repeat(40))
  console.log(`🎯 TOTAL COTISATION RRQ: ${totalContribution.toFixed(2)} $`)
  
  return totalContribution
}

// Tests avec différents scénarios
async function runTests() {
  console.log('🧪 Tests de validation RRQ')
  console.log('='.repeat(50))
  
  // Test 1: Revenu typique
  testRRQCalculation(50000, 2024)
  testRRQCalculation(50000, 2025)
  
  // Test 2: Revenu élevé (dépassant le maximum pensionable)
  testRRQCalculation(75000, 2024)
  testRRQCalculation(75000, 2025)
  
  // Test 3: Revenu très élevé (dépassant le 2e palier)
  testRRQCalculation(85000, 2024)
  testRRQCalculation(85000, 2025)
  
  // Test 4: Revenu bas (sous exemption)
  testRRQCalculation(2000, 2024)
  
  console.log('\n✅ Tests de validation terminés!')
  
  console.log('\n📝 Calculs attendus pour validation:')
  console.log('- 50 000$ (2024/2025): (50000-3500) × 6.40% = 46500 × 6.40% = TOTAL: 2976$')
  console.log('- 75 000$ (2024): (68500-3500) × 6.40% = 65000 × 6.40% = TOTAL: 4160$ (plafonné)')
  console.log('- 75 000$ (2025): (71300-3500) × 6.40% = 67800 × 6.40% = TOTAL: 4339.20$ (plafonné)')
}

runTests()