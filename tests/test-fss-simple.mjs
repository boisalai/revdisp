/**
 * Test simple pour valider les calculs FSS
 */

// Fonction pour tester le FSS manuellement
function testFSSCalculation(age, retirementIncome, year = 2024) {
  console.log(`\n🧮 Test calcul FSS ${year}`)
  console.log('=' .repeat(40))
  console.log(`👤 Âge: ${age} ans`)
  console.log(`📊 Revenu de retraite: ${retirementIncome.toLocaleString('fr-CA')} $`)
  
  // Structure FSS officielle par paliers
  const structure2024 = {
    tier1: { min: 0, max: 17630, description: 'Aucune cotisation' },
    tier2: { min: 17630, max: 32630, description: '1% de l\'excédent' },
    tier3: { min: 32630, max: 61315, description: '150$ fixe' },
    tier4: { min: 61315, max: 146315, description: '150$ + 1% de l\'excédent au-dessus de 61 315$' },
    tier5: { min: 146315, max: Infinity, description: '1 000$ fixe' }
  }
  
  const structure2025 = {
    tier1: { min: 0, max: 17500, description: 'Aucune cotisation' },
    tier2: { min: 17500, max: 32500, description: '1% de l\'excédent' },
    tier3: { min: 32500, max: 61000, description: '150$ fixe' },
    tier4: { min: 61000, max: 145000, description: '150$ + 1% de l\'excédent au-dessus de 61 000$' },
    tier5: { min: 145000, max: Infinity, description: '1 000$ fixe' }
  }
  
  const structure = year === 2025 ? structure2025 : structure2024
  
  // FSS s'applique uniquement aux retraités de 65 ans et plus
  if (age < 65) {
    console.log(`❌ Non applicable (moins de 65 ans)`)
    console.log('💰 Cotisation FSS: 0.00 $')
    return 0
  }
  
  if (retirementIncome <= 0) {
    console.log(`❌ Aucun revenu de retraite`)
    console.log('💰 Cotisation FSS: 0.00 $')
    return 0
  }
  
  // Identifier le palier et calculer
  let contribution = 0
  let tierUsed = null
  
  for (const [tierKey, tier] of Object.entries(structure)) {
    if (retirementIncome >= tier.min && retirementIncome <= tier.max) {
      tierUsed = tier
      console.log(`📋 Palier applicable: ${tier.min.toLocaleString('fr-CA')} $ - ${tier.max === Infinity ? '∞' : tier.max.toLocaleString('fr-CA')} $`)
      console.log(`📊 Méthode: ${tier.description}`)
      
      // Calculs selon le palier
      if (tierKey === 'tier1') {
        contribution = 0
      } else if (tierKey === 'tier2') {
        const excess = retirementIncome - tier.min
        contribution = excess * 0.01
        console.log(`💼 Revenu excédentaire: ${excess.toLocaleString('fr-CA')} $`)
        console.log(`📊 Taux appliqué: 1.00 %`)
      } else if (tierKey === 'tier3') {
        contribution = 150
        console.log(`💰 Contribution fixe: 150.00 $`)
      } else if (tierKey === 'tier4') {
        const excess = retirementIncome - tier.min
        contribution = 150 + (excess * 0.01)
        console.log(`💰 Contribution de base: 150.00 $`)
        console.log(`💼 Revenu excédentaire au-dessus de ${tier.min.toLocaleString('fr-CA')} $: ${excess.toLocaleString('fr-CA')} $`)
        console.log(`📊 Taux sur excédent: 1.00 %`)
        console.log(`💰 Contribution sur excédent: ${(excess * 0.01).toFixed(2)} $`)
      } else if (tierKey === 'tier5') {
        contribution = 1000
        console.log(`💰 Contribution maximale fixe: 1000.00 $`)
      }
      break
    }
  }
  
  console.log('─'.repeat(40))
  console.log(`🎯 TOTAL COTISATION FSS: ${contribution.toFixed(2)} $`)
  
  return contribution
}

// Tests avec différents scénarios
async function runTests() {
  console.log('🧪 Tests de validation FSS')
  console.log('='.repeat(50))
  
  // Test 1: Personne de moins de 65 ans
  testFSSCalculation(62, 30000, 2024)
  
  // Test 2: Retraité de 65 ans avec revenu modeste
  testFSSCalculation(65, 15000, 2024)
  
  // Test 3: Cas spécifique demandé - retraité 65 ans avec 50k$ (doit donner 150$)
  testFSSCalculation(65, 50000, 2024)
  testFSSCalculation(65, 50000, 2025)
  
  // Test 4: Retraité de 67 ans avec revenu moyen
  testFSSCalculation(67, 30000, 2024)
  testFSSCalculation(67, 30000, 2025)
  
  // Test 4: Retraité avec revenu élevé
  testFSSCalculation(70, 80000, 2024)
  testFSSCalculation(70, 80000, 2025)
  
  // Test 5: Retraité avec très haut revenu (pour tester le plafond)
  testFSSCalculation(75, 150000, 2024)
  testFSSCalculation(75, 150000, 2025)
  
  console.log('\n✅ Tests de validation terminés!')
  
  console.log('\n📝 Calculs attendus pour validation:')
  console.log('- 62 ans : 0.00$ (non applicable)')
  console.log('- 65 ans, 15 000$ : 0.00$ (sous seuil)')
  console.log('- 67 ans, 30 000$ (2024): 150$ + (30000-17630) × 1% = 150$ + 123.70$ = 273.70$')
  console.log('- 67 ans, 30 000$ (2025): (30000-17500) × 1% = 125.00$')
  console.log('- 70 ans, 80 000$ (2024): 150$ + (80000-17630) × 1% = 150$ + 623.70$ = 773.70$')
  console.log('- 75 ans, 150 000$ : Plafonné à 1000.00$ maximum')
}

runTests()