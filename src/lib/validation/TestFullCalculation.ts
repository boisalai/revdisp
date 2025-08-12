/**
 * Test the complete calculation flow with Quebec Income Tax integrated
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household, HouseholdType } from '../models'

async function testFullCalculation() {
  console.log('🧪 Testing full calculation with Quebec Income Tax...\n')
  
  const calculator = new RevenuDisponibleCalculator(2024)
  
  // Test scenario: Single person, $50,000 income
  const household = new Household({
    householdType: HouseholdType.SINGLE,
    primaryPerson: {
      age: 35,
      grossWorkIncome: 50000,
      grossRetirementIncome: 0,
      isRetired: false
    },
    numChildren: 0
  })
  
  try {
    console.log('🏠 Household: Single person, 35 years old, $50,000 work income')
    console.log('📊 Calculating all taxes and contributions...\n')
    
    const results = await calculator.calculate(household)
    
    console.log('=== COTISATIONS ===')
    console.log(`RRQ: $${results.cotisations.rrq?.toFixed(2) || '0.00'}`)
    console.log(`Assurance-emploi: $${results.cotisations.assurance_emploi?.toFixed(2) || '0.00'}`)  
    console.log(`RQAP: $${results.cotisations.rqap?.toFixed(2) || '0.00'}`)
    console.log(`FSS: $${results.cotisations.fss?.toFixed(2) || '0.00'}`)
    console.log(`RAMQ: $${results.cotisations.ramq?.toFixed(2) || '0.00'}`)
    console.log(`Total cotisations: $${results.cotisations.total?.toFixed(2) || '0.00'}\n`)
    
    console.log('=== IMPÔTS ===')
    console.log(`Impôt Québec: $${results.taxes.quebec?.toFixed(2) || '0.00'}`)
    console.log(`Impôt Canada: $${results.taxes.canada?.toFixed(2) || '0.00'}`)
    console.log(`Total impôts: $${results.taxes.total?.toFixed(2) || '0.00'}\n`)
    
    console.log('=== RÉSULTAT FINAL ===')
    console.log(`Revenu disponible: $${results.revenu_disponible.toFixed(2)}`)
    
    // Calculate percentages  
    const grossIncome = 50000
    const totalTaxesCotisations = (results.cotisations.total?.toNumber() || 0) + (results.taxes.total?.toNumber() || 0)
    const effectiveRate = (totalTaxesCotisations / grossIncome) * 100
    
    console.log(`Taux effectif total: ${effectiveRate.toFixed(1)}%`)
    
    return results
    
  } catch (error) {
    console.error('❌ Error in calculation:', error)
    return null
  }
}

// Run if called directly
if (require.main === module) {
  testFullCalculation().catch(console.error)
}

export { testFullCalculation }