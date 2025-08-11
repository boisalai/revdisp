/**
 * Test simple pour valider les calculs RQAP
 */

// Fonction pour tester le RQAP manuellement
function testRQAPCalculation(income, year = 2024) {
  console.log(`\n🧮 Test calcul RQAP ${year}`)
  console.log('=' .repeat(40))
  console.log(`📊 Revenu: ${income.toLocaleString('fr-CA')} $`)
  
  // Paramètres officiels
  const params2024 = {
    employeeRate: 0.00494, // 0.494%
    maxInsurable: 94000,
    minEarnings: 2000
  }
  
  const params2025 = {
    employeeRate: 0.00494, // 0.494%
    maxInsurable: 98000,
    minEarnings: 2000
  }
  
  const params = year === 2025 ? params2025 : params2024
  
  if (income < params.minEarnings) {
    console.log(`❌ Revenu sous le minimum requis (${params.minEarnings.toLocaleString('fr-CA')} $)`)
    console.log('💰 Cotisation RQAP: 0.00 $')
    return 0
  }
  
  // Calcul RQAP : Revenu assurable × 0.494%
  const insurableEarnings = Math.min(income, params.maxInsurable)
  const contribution = insurableEarnings * params.employeeRate
  const isAtMax = income >= params.maxInsurable
  
  console.log(`📋 Minimum de rémunération: ${params.minEarnings.toLocaleString('fr-CA')} $`)
  console.log(`📈 Maximum de la rémunération assurable: ${params.maxInsurable.toLocaleString('fr-CA')} $`)
  console.log(`💼 Rémunération assurable: ${insurableEarnings.toLocaleString('fr-CA')} $${isAtMax ? ' (plafonnée)' : ''}`)
  console.log(`📊 Taux employé RQAP: ${(params.employeeRate * 100).toFixed(3)} %`)
  console.log(`💰 Cotisation RQAP: ${contribution.toFixed(2)} $`)
  
  console.log('─'.repeat(40))
  console.log(`🎯 TOTAL COTISATION RQAP: ${contribution.toFixed(2)} $`)
  
  return contribution
}

// Tests avec différents scénarios
async function runTests() {
  console.log('🧪 Tests de validation RQAP')
  console.log('='.repeat(50))
  
  // Test 1: Revenu typique
  testRQAPCalculation(50000, 2024)
  testRQAPCalculation(50000, 2025)
  
  // Test 2: Revenu élevé (dépassant le maximum assurable)
  testRQAPCalculation(100000, 2024)
  testRQAPCalculation(100000, 2025)
  
  // Test 3: Revenu bas (sous minimum)
  testRQAPCalculation(1500, 2024)
  
  // Test 4: Revenu au minimum
  testRQAPCalculation(2000, 2024)
  
  console.log('\n✅ Tests de validation terminés!')
  
  console.log('\n📝 Calculs attendus pour validation:')
  console.log('- 50 000$ (2024): 50000 × 0.494% = 247.00$')
  console.log('- 50 000$ (2025): 50000 × 0.494% = 247.00$')  
  console.log('- 100 000$ (2024): 94000 × 0.494% = 464.36$ (plafonné)')
  console.log('- 100 000$ (2025): 98000 × 0.494% = 484.12$ (plafonné)')
  console.log('- 1 500$ : 0.00$ (sous minimum)')
  console.log('- 2 000$ : 2000 × 0.494% = 9.88$')
}

runTests()