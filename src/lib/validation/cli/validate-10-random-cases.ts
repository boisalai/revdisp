#!/usr/bin/env node
/**
 * Validation de 10 cas aléatoires contre le calculateur officiel du MFQ
 * Compare notre calculateur avec les résultats officiels
 */

import { RevenuDisponibleCalculator } from '../../MainCalculator'
import { PythonOfficialCalculatorScraper } from '../PythonOfficialCalculatorScraper'
import { HouseholdType, Household } from '../../models'

interface ValidationCase {
  id: string
  description: string
  household: Household
}

interface ValidationResult {
  case: ValidationCase
  ourResults: any
  officialResults: any
  success: boolean
  accuracy: number
  discrepancies: Array<{
    item: string
    our: number
    official: number
    difference: number
    percentError: number
  }>
}

async function main() {
  console.log('🎯 VALIDATION 10 CAS ALÉATOIRES')
  console.log('================================')
  console.log('🆚 Notre calculateur vs MFQ officiel')
  console.log()

  // Générer 10 cas aléatoires
  const testCases = generateRandomCases(10)
  
  const ourCalculator = new RevenuDisponibleCalculator(2024)
  const officialScraper = new PythonOfficialCalculatorScraper({ timeout: 60000 })
  
  const results: ValidationResult[] = []
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`📊 CAS ${i + 1}/10: ${testCase.description}`)
    console.log(''.padEnd(50, '-'))
    
    try {
      // Notre calculateur
      const ourResults = await ourCalculator.calculate(testCase.household)
      
      // Calculateur officiel
      const officialResults = await officialScraper.scrapeOfficialCalculator(testCase.household)
      
      if (officialResults.success) {
        const validation = compareResults(testCase, ourResults, officialResults)
        results.push(validation)
        
        displayComparison(validation)
      } else {
        console.log('❌ Erreur scraping officiel:', officialResults.error)
        results.push({
          case: testCase,
          ourResults,
          officialResults,
          success: false,
          accuracy: 0,
          discrepancies: []
        })
      }
      
      console.log()
      
      // Délai entre les tests pour éviter la surcharge du serveur
      if (i < testCases.length - 1) {
        await delay(3000)
      }
      
    } catch (error) {
      console.error(`❌ Erreur sur le cas ${i + 1}:`, error)
    }
  }
  
  // Résumé final
  displaySummary(results)
}

function generateRandomCases(count: number): ValidationCase[] {
  const cases: ValidationCase[] = []
  const incomeRanges = [15000, 25000, 35000, 45000, 55000, 65000, 75000]
  const householdTypes = [
    HouseholdType.SINGLE,
    HouseholdType.COUPLE, 
    HouseholdType.SINGLE_PARENT,
    HouseholdType.RETIRED_SINGLE,
    HouseholdType.RETIRED_COUPLE
  ]
  
  for (let i = 0; i < count; i++) {
    const householdType = householdTypes[Math.floor(Math.random() * householdTypes.length)]
    const primaryIncome = incomeRanges[Math.floor(Math.random() * incomeRanges.length)]
    const primaryAge = getRandomAge(householdType)
    
    let household: Household
    let description: string
    
    switch (householdType) {
      case HouseholdType.SINGLE:
        household = new Household({
          householdType,
          primaryPerson: {
            age: primaryAge,
            grossWorkIncome: primaryIncome,
            grossRetirementIncome: 0,
            isRetired: false,
            selfEmployedIncome: 0
          },
          numChildren: 0
        })
        description = `Personne seule, ${primaryAge} ans, ${primaryIncome}$`
        break
        
      case HouseholdType.COUPLE:
        const spouseAge = getRandomAge(householdType)
        const spouseIncome = incomeRanges[Math.floor(Math.random() * incomeRanges.length)]
        const numChildren = Math.random() < 0.4 ? Math.floor(Math.random() * 3) : 0
        
        household = new Household({
          householdType,
          primaryPerson: {
            age: primaryAge,
            grossWorkIncome: primaryIncome,
            grossRetirementIncome: 0,
            isRetired: false,
            selfEmployedIncome: 0
          },
          spouse: {
            age: spouseAge,
            grossWorkIncome: spouseIncome,
            grossRetirementIncome: 0,
            isRetired: false,
            selfEmployedIncome: 0
          },
          numChildren
        })
        description = `Couple, ${primaryAge}-${spouseAge} ans, ${primaryIncome}$+${spouseIncome}$${numChildren > 0 ? `, ${numChildren} enfant${numChildren > 1 ? 's' : ''}` : ''}`
        break
        
      case HouseholdType.SINGLE_PARENT:
        const children = Math.floor(Math.random() * 2) + 1 // 1-2 enfants
        household = new Household({
          householdType,
          primaryPerson: {
            age: Math.floor(Math.random() * 25) + 25, // 25-50 ans
            grossWorkIncome: primaryIncome,
            grossRetirementIncome: 0,
            isRetired: false,
            selfEmployedIncome: 0
          },
          numChildren: children
        })
        description = `Parent seul, ${primaryAge} ans, ${primaryIncome}$, ${children} enfant${children > 1 ? 's' : ''}`
        break
        
      case HouseholdType.RETIRED_SINGLE:
        household = new Household({
          householdType,
          primaryPerson: {
            age: Math.floor(Math.random() * 20) + 65, // 65-85 ans
            grossWorkIncome: 0,
            grossRetirementIncome: primaryIncome,
            isRetired: true,
            selfEmployedIncome: 0
          },
          numChildren: 0
        })
        description = `Retraité seul, ${primaryAge} ans, ${primaryIncome}$`
        break
        
      case HouseholdType.RETIRED_COUPLE:
        const retiredSpouseAge = Math.floor(Math.random() * 15) + 65 // 65-80 ans
        const retiredSpouseIncome = incomeRanges[Math.floor(Math.random() * incomeRanges.length)]
        
        household = new Household({
          householdType,
          primaryPerson: {
            age: Math.floor(Math.random() * 15) + 65,
            grossWorkIncome: 0,
            grossRetirementIncome: primaryIncome,
            isRetired: true,
            selfEmployedIncome: 0
          },
          spouse: {
            age: retiredSpouseAge,
            grossWorkIncome: 0,
            grossRetirementIncome: retiredSpouseIncome,
            isRetired: true,
            selfEmployedIncome: 0
          },
          numChildren: 0
        })
        description = `Couple retraité, ${primaryAge}-${retiredSpouseAge} ans, ${primaryIncome}$+${retiredSpouseIncome}$`
        break
        
      default:
        continue
    }
    
    cases.push({
      id: `case-${i + 1}`,
      description,
      household
    })
  }
  
  return cases
}

function getRandomAge(householdType: HouseholdType): number {
  switch (householdType) {
    case HouseholdType.RETIRED_SINGLE:
    case HouseholdType.RETIRED_COUPLE:
      return Math.floor(Math.random() * 20) + 65 // 65-85
    default:
      return Math.floor(Math.random() * 40) + 25 // 25-65
  }
}

function compareResults(testCase: ValidationCase, ours: any, official: any): ValidationResult {
  const comparisons = [
    { item: 'AE', our: Math.abs(ours.cotisations?.assurance_emploi || 0), official: Math.abs(official.ae_total || 0) },
    { item: 'RRQ', our: Math.abs(ours.cotisations?.rrq || 0), official: Math.abs(official.rrq_total || 0) },
    { item: 'RQAP', our: Math.abs(ours.cotisations?.rqap || 0), official: Math.abs(official.rqap_total || 0) },
    { item: 'RAMQ', our: Math.abs(ours.cotisations?.ramq || 0), official: Math.abs(official.ramq || 0) },
    { item: 'Revenu disponible', our: ours.revenu_disponible, official: official.revenu_disponible }
  ]
  
  const discrepancies = comparisons
    .filter(c => c.official > 0) // Ne comparer que si on a des données officielles
    .map(c => {
      const difference = Math.abs(c.our - c.official)
      const percentError = c.official > 0 ? (difference / c.official) * 100 : 0
      return {
        item: c.item,
        our: c.our,
        official: c.official,
        difference,
        percentError
      }
    })
  
  // Calculer précision globale basée sur le revenu disponible
  const mainDiscrepancy = discrepancies.find(d => d.item === 'Revenu disponible')
  const accuracy = mainDiscrepancy ? Math.max(0, 100 - mainDiscrepancy.percentError) : 0
  
  return {
    case: testCase,
    ourResults: ours,
    officialResults: official,
    success: true,
    accuracy,
    discrepancies
  }
}

function displayComparison(validation: ValidationResult) {
  console.log(`💰 Revenu disponible: ${validation.ourResults.revenu_disponible.toFixed(2)}$ vs ${validation.officialResults.revenu_disponible?.toFixed(2) || 'N/A'}$`)
  console.log(`🎯 Précision: ${validation.accuracy.toFixed(1)}%`)
  
  console.log('📋 Cotisations:')
  const cotisations = [
    { name: 'AE', our: validation.ourResults.cotisations?.assurance_emploi, official: validation.officialResults.ae_total },
    { name: 'RRQ', our: validation.ourResults.cotisations?.rrq, official: validation.officialResults.rrq_total },
    { name: 'RQAP', our: validation.ourResults.cotisations?.rqap, official: validation.officialResults.rqap_total },
    { name: 'RAMQ', our: validation.ourResults.cotisations?.ramq, official: validation.officialResults.ramq }
  ]
  
  for (const cot of cotisations) {
    if (cot.official !== undefined && cot.official !== null && Math.abs(cot.official) > 0) {
      const ourAbs = Math.abs(cot.our || 0)
      const officialAbs = Math.abs(cot.official)
      const diff = Math.abs(ourAbs - officialAbs)
      const symbol = diff <= 1 ? '✅' : diff <= 10 ? '⚠️' : '❌'
      console.log(`   ${symbol} ${cot.name}: ${ourAbs.toFixed(2)}$ vs ${officialAbs.toFixed(2)}$ (écart: ${diff.toFixed(2)}$)`)
    }
  }
}

function displaySummary(results: ValidationResult[]) {
  console.log()
  console.log('📊 RÉSUMÉ DE LA VALIDATION')
  console.log('==========================')
  
  const successful = results.filter(r => r.success)
  const avgAccuracy = successful.reduce((sum, r) => sum + r.accuracy, 0) / successful.length
  
  console.log(`✅ Cas réussis: ${successful.length}/${results.length}`)
  console.log(`🎯 Précision moyenne: ${avgAccuracy.toFixed(1)}%`)
  
  // Analyser les problèmes les plus fréquents
  const allDiscrepancies = successful.flatMap(r => r.discrepancies)
  const significantIssues = allDiscrepancies.filter(d => d.percentError > 5)
  
  if (significantIssues.length > 0) {
    console.log()
    console.log('⚠️  Écarts significatifs (>5%):')
    significantIssues.forEach(issue => {
      console.log(`   • ${issue.item}: ${issue.our.toFixed(2)}$ vs ${issue.official.toFixed(2)}$ (${issue.percentError.toFixed(1)}% d'écart)`)
    })
  }
  
  console.log()
  if (avgAccuracy >= 95) {
    console.log('🎉 EXCELLENT: Calculateur très précis!')
  } else if (avgAccuracy >= 85) {
    console.log('✅ BON: Performance satisfaisante')
  } else {
    console.log('⚠️ AMÉLIORATIONS NÉCESSAIRES: Écarts importants détectés')
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

if (require.main === module) {
  main().catch(console.error)
}