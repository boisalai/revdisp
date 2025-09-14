import { RevenuDisponibleCalculator } from './src/lib/MainCalculator'
import { Household, HouseholdType, Person } from './src/lib/models'
import Decimal from 'decimal.js'

async function testCalculator() {
  console.log('🧪 Test du calculateur principal\n')
  
  // Créer un ménage test simple
  const household = new Household({
    householdType: HouseholdType.SINGLE,
    primaryPerson: new Person({
      age: 30,
      grossWorkIncome: new Decimal(50000),
      grossRetirementIncome: new Decimal(0),
      isRetired: false
    }),
    children: []
  })
  
  console.log('📊 Ménage test:')
  console.log('- Type: Personne seule')
  console.log('- Âge: 30 ans')
  console.log('- Revenu de travail: 50 000$\n')
  
  // Créer le calculateur
  const calculator = new RevenuDisponibleCalculator(2024)
  
  // Calculer
  const results = await calculator.calculate(household)
  
  console.log('💰 Résultats:')
  console.log('- Revenu disponible:', results.revenu_disponible?.toNumber() || 0)
  console.log('\n📋 Cotisations:')
  console.log('- RRQ:', results.cotisations.rrq?.toNumber() || 0)
  console.log('- AE:', results.cotisations.assurance_emploi?.toNumber() || 0)
  console.log('- RQAP:', results.cotisations.rqap?.toNumber() || 0)
  console.log('- FSS:', results.cotisations.fss?.toNumber() || 0)
  console.log('- RAMQ:', results.cotisations.ramq?.toNumber() || 0)
  console.log('\n💸 Impôts:')
  console.log('- Québec:', results.taxes.quebec?.toNumber() || 0)
  console.log('- Fédéral:', results.taxes.canada?.toNumber() || 0)
  
  // Vérifier si les calculs sont faits
  const totalDeductions = [
    results.cotisations.rrq,
    results.cotisations.assurance_emploi,
    results.cotisations.rqap,
    results.cotisations.fss,
    results.cotisations.ramq,
    results.taxes.quebec,
    results.taxes.canada
  ].reduce((sum, val) => sum + (val?.toNumber() || 0), 0)
  
  console.log('\n🔍 Analyse:')
  console.log('- Total des déductions:', totalDeductions)
  console.log('- Revenu net attendu:', 50000 - totalDeductions)
  
  if (totalDeductions === 0) {
    console.log('\n❌ PROBLÈME: Aucune déduction calculée!')
  } else {
    console.log('\n✅ Calculs effectués')
  }
}

testCalculator().catch(console.error)