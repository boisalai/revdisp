#!/usr/bin/env node
/**
 * Script pour comparer directement notre calculateur avec celui du MFQ
 * Affiche les résultats côte à côte pour analyse détaillée
 */

import { RevenuDisponibleCalculator } from '../../MainCalculator'
import { PythonOfficialCalculatorScraper } from '../PythonOfficialCalculatorScraper'
import { HouseholdType, Person, Household } from '../../models'
import Decimal from 'decimal.js'
// Configuration is handled internally by RevenuDisponibleCalculator

async function main() {
  const taxYear = 2024
  console.log('🔬 COMPARAISON DÉTAILLÉE DES CALCULATEURS')
  console.log('=========================================')
  console.log(`📅 Année fiscale: ${taxYear}`)
  console.log('🆚 Notre calculateur vs MFQ officiel')
  console.log()

  // Initialiser les calculateurs  
  const ourCalculator = new RevenuDisponibleCalculator(taxYear)
  const officialScraper = new PythonOfficialCalculatorScraper({ timeout: 60000 })

  // Cas de test
  const testCases = [
    {
      name: "Personne seule, 25 ans, 15000$",
      household: createSingleHousehold(25, 15000, 0)
    },
    {
      name: "Personne seule, 35 ans, 35000$", 
      household: createSingleHousehold(35, 35000, 0)
    },
    {
      name: "Couple, 45-40 ans, 35000$+25000$",
      household: createCoupleHousehold(45, 35000, 40, 25000, 0)
    }
  ]

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i]
    console.log(`📊 CAS ${i + 1}: ${test.name}`)
    console.log(''.padEnd(60, '='))
    
    try {
      // Notre calculateur
      console.log('🔵 NOTRE CALCULATEUR:')
      const ourResults = await ourCalculator.calculate(test.household)
      displayOurResults(ourResults)
      
      console.log()
      console.log('🟢 CALCULATEUR OFFICIEL MFQ:')
      
      // Calculateur officiel
      const officialResults = await officialScraper.scrapeOfficialCalculator(test.household)
      if (officialResults.success) {
        displayOfficialResults(officialResults)
        
        console.log()
        console.log('⚖️  COMPARAISON:')
        compareResults(ourResults, officialResults)
      } else {
        console.log('❌ Erreur scraping officiel:', officialResults.error)
      }
      
      console.log()
      console.log(''.padEnd(60, '-'))
      console.log()
      
      // Délai entre les tests
      if (i < testCases.length - 1) {
        await delay(3000)
      }
      
    } catch (error) {
      console.error(`❌ Erreur sur le cas ${i + 1}:`, error)
    }
  }
}

function createSingleHousehold(age: number, workIncome: number, retirementIncome: number): Household {
  return new Household({
    householdType: age >= 65 ? HouseholdType.RETIRED_SINGLE : HouseholdType.SINGLE,
    primaryPerson: {
      age,
      grossWorkIncome: workIncome,
      grossRetirementIncome: retirementIncome,
      isRetired: age >= 65,
      selfEmployedIncome: 0
    },
    spouse: undefined,
    numChildren: 0
  })
}

function createCoupleHousehold(age1: number, income1: number, age2: number, income2: number, children: number): Household {
  return new Household({
    householdType: (age1 >= 65 && age2 >= 65) ? HouseholdType.RETIRED_COUPLE : HouseholdType.COUPLE,
    primaryPerson: {
      age: age1,
      grossWorkIncome: income1,
      grossRetirementIncome: 0,
      isRetired: age1 >= 65,
      selfEmployedIncome: 0
    },
    spouse: {
      age: age2,
      grossWorkIncome: income2,
      grossRetirementIncome: 0,
      isRetired: age2 >= 65,
      selfEmployedIncome: 0
    },
    numChildren: children
  })
}

function displayOurResults(results: any) {
  console.log(`   💰 Revenu disponible: ${results.revenu_disponible.toFixed(2)}$`)
  console.log(`   📋 Cotisations:`)
  console.log(`      • AE:    ${results.cotisations?.assurance_emploi?.toFixed(2) || '0.00'}$`)
  console.log(`      • RRQ:   ${results.cotisations?.rrq?.toFixed(2) || '0.00'}$`) 
  console.log(`      • RQAP:  ${results.cotisations?.rqap?.toFixed(2) || '0.00'}$`)
  console.log(`      • FSS:   ${results.cotisations?.fss?.toFixed(2) || '0.00'}$`)
  console.log(`      • RAMQ:  ${results.cotisations?.ramq?.toFixed(2) || '0.00'}$`)
  console.log(`   🏛️ Impôts:`)
  console.log(`      • QC:    ${results.taxes?.quebec?.toFixed(2) || '0.00'}$`)
  console.log(`      • Fédéral: ${results.taxes?.canada?.toFixed(2) || '0.00'}$`)
}

function displayOfficialResults(results: any) {
  console.log(`   💰 Revenu disponible: ${results.revenu_disponible?.toFixed(2) || 'N/A'}$`)
  console.log(`   📋 Cotisations:`)
  console.log(`      • AE:    ${results.ae_total?.toFixed(2) || 'N/A'}$`)
  console.log(`      • RRQ:   ${results.rrq_total?.toFixed(2) || 'N/A'}$`)
  console.log(`      • RQAP:  ${results.rqap_total?.toFixed(2) || 'N/A'}$`)
  console.log(`      • FSS:   ${results.fss?.toFixed(2) || 'N/A'}$`)
  console.log(`      • RAMQ:  ${results.ramq?.toFixed(2) || 'N/A'}$`)
  console.log(`   🏛️ Impôts:`)
  console.log(`      • QC:    ${results.qc_impot_total?.toFixed(2) || 'N/A'}$`)
  console.log(`      • Fédéral: ${results.ca_impot_total?.toFixed(2) || 'N/A'}$`)
}

function compareResults(ours: any, official: any) {
  const comparisons = [
    { name: 'Revenu disponible', our: ours.revenu_disponible, theirs: official.revenu_disponible },
    { name: 'AE', our: ours.cotisations?.assurance_emploi || 0, theirs: official.ae_total || 0 },
    { name: 'RRQ', our: ours.cotisations?.rrq || 0, theirs: official.rrq_total || 0 },
    { name: 'RQAP', our: ours.cotisations?.rqap || 0, theirs: official.rqap_total || 0 },
    { name: 'FSS', our: ours.cotisations?.fss || 0, theirs: official.fss || 0 },
    { name: 'RAMQ', our: ours.cotisations?.ramq || 0, theirs: official.ramq || 0 },
    { name: 'Impôt QC', our: ours.taxes?.quebec || 0, theirs: official.qc_impot_total || 0 },
    { name: 'Impôt fédéral', our: ours.taxes?.canada || 0, theirs: official.ca_impot_total || 0 }
  ]
  
  for (const comp of comparisons) {
    if (comp.theirs !== undefined && comp.theirs !== null) {
      const diff = Math.abs(comp.our - comp.theirs)
      const symbol = diff < 1 ? '✅' : diff < 10 ? '⚠️' : '❌'
      console.log(`   ${symbol} ${comp.name.padEnd(15)}: ${comp.our.toFixed(2)}$ vs ${comp.theirs.toFixed(2)}$ (écart: ${diff.toFixed(2)}$)`)
    } else {
      console.log(`   ❓ ${comp.name.padEnd(15)}: ${comp.our.toFixed(2)}$ vs N/A`)
    }
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

if (require.main === module) {
  main().catch(console.error)
}