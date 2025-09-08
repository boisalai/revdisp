#!/usr/bin/env tsx

/**
 * SCRIPT DE VALIDATION UNIFIÉ SIMPLE
 * ==================================
 * 
 * Script unique qui remplace tous les autres scripts de validation.
 * Compare notre calculateur avec celui du MFQ pour un nombre configurable de ménages.
 * 
 * Usage: npx tsx simple-unified-validation.ts --count=10 --year=2024
 * 
 * TEMPORARILY DISABLED - API and scraper compatibility issues
 */

import { PythonOfficialCalculatorScraper } from '../PythonOfficialCalculatorScraper'
import { HouseholdType, Household, Person, PersonData } from '../../models'
import Decimal from 'decimal.js'

interface ValidationConfig {
  count: number
  year: number
}

// Remove TestHousehold interface - using Household from models instead

interface ProgramComparison {
  program: string
  ourResult: number
  officialResult: number
  gap: number
  gapPercent: number
}

class SimpleUnifiedValidator {
  private scraper: PythonOfficialCalculatorScraper

  constructor() {
    this.scraper = new PythonOfficialCalculatorScraper()
  }

  /**
   * Generate random test household
   */
  private generateTestHousehold(year: number = 2024): Household {
    const situations = [HouseholdType.SINGLE, HouseholdType.COUPLE] as const
    const householdType = situations[Math.floor(Math.random() * situations.length)]
    
    // Generate primary adult
    const primaryAge = 18 + Math.floor(Math.random() * 47) // 18-64
    const primaryIncome = Math.floor(Math.random() * 80000) // 0-80k
    const isRetired = primaryAge >= 65
    
    const primaryPersonData: PersonData = {
      age: primaryAge,
      grossWorkIncome: isRetired ? 0 : primaryIncome,
      selfEmployedIncome: 0, // Always 0 for test households
      grossRetirementIncome: isRetired ? primaryIncome : 0,
      isRetired
    }

    const householdData: any = {
      householdType,
      primaryPerson: primaryPersonData,
      spouse: null,
      children: [],
      province: 'QC'
    }

    // Add spouse if couple
    if (householdType === HouseholdType.COUPLE) {
      const spouseAge = 18 + Math.floor(Math.random() * 47)
      const spouseIncome = Math.floor(Math.random() * 80000)
      const spouseIsRetired = spouseAge >= 65
      
      const spouseData: PersonData = {
        age: spouseAge,
        grossWorkIncome: spouseIsRetired ? 0 : spouseIncome,
        selfEmployedIncome: 0, // Always 0 for test households
        grossRetirementIncome: spouseIsRetired ? spouseIncome : 0,
        isRetired: spouseIsRetired
      }
      
      householdData.spouse = spouseData
    }

    // Add children (0-3) - for now, keep it simple with no children
    // household.numChildren = Math.floor(Math.random() * 4)

    return new Household(householdData)
  }

  /**
   * Get our calculator results directly
   */
  private async getOurResults(household: any, year: number): Promise<any> {
    try {
      const { RevenuDisponibleCalculator } = await import('../../MainCalculator')
      const { Household, HouseholdType } = await import('../../models')
      
      // Create calculator instance
      const calculator = new RevenuDisponibleCalculator(year)
      
      // Determine household type
      let householdType = HouseholdType.SINGLE
      if (household.type === 'couple') {
        householdType = HouseholdType.COUPLE
      }
      
      // Convert to proper Household model format
      const householdData: any = {
        householdType,
        primaryPerson: {
          age: household.age1 || household.age,
          grossWorkIncome: household.income1 || household.income || 0
        },
        children: household.children || []
      }
      
      // Add spouse if it's a couple
      if (household.type === 'couple') {
        householdData.spouse = {
          age: household.age2 || household.age,
          grossWorkIncome: household.income2 || household.income || 0
        }
      }
      
      // Create proper Household object
      const householdModel = new Household(householdData)
      
      // Calculate results
      const results = await calculator.calculate(householdModel)
      
      // Convert Decimal results to numbers
      const calculationResults = {
        revenu_disponible: results.revenu_disponible?.toNumber() || 0,
        rrq_total: results.cotisations.rrq?.toNumber() || 0,
        ae_total: results.cotisations.assurance_emploi?.toNumber() || 0,
        rqap_total: results.cotisations.rqap?.toNumber() || 0,
        fss_total: results.cotisations.fss?.toNumber() || 0,
        ramq_total: results.cotisations.ramq?.toNumber() || 0,
        impot_quebec: results.taxes.quebec?.toNumber() || 0,
        impot_federal: results.taxes.canada?.toNumber() || 0,
        // Add other programs from quebec and canada objects
        ...Object.fromEntries(
          Object.entries(results.quebec).map(([key, value]) => [
            key,
            typeof value === 'object' && value?.toNumber ? value.toNumber() : value
          ])
        ),
        ...Object.fromEntries(
          Object.entries(results.canada).map(([key, value]) => [
            key,
            typeof value === 'object' && value?.toNumber ? value.toNumber() : value
          ])
        )
      }
      
      return {
        revenu_disponible: calculationResults.revenu_disponible,
        ae_total: calculationResults.ae_total * -1, // Convert to negative for deductions
        rrq_total: calculationResults.rrq_total * -1,
        rqap_total: calculationResults.rqap_total * -1,
        fss_total: calculationResults.fss_total * -1,
        ramq_total: calculationResults.ramq_total * -1,
        qc_impot_total: calculationResults.impot_quebec,
        ca_impot_total: calculationResults.impot_federal,
        qc_solidarite: results.quebec?.solidarity?.net_credit || 0,
        qc_prime_travail: results.quebec?.work_premium?.net_premium || 0,
        ca_tps: results.canada?.gst_credit?.amount || 0,
        ca_pfrt: results.canada?.child_benefit?.net_benefit || 0
      }
    } catch (error) {
      console.error('❌ Erreur API locale:', error)
      // Return zeros if our calculator fails
      return {
        revenu_disponible: 0,
        ae_total: 0, rrq_total: 0, rqap_total: 0, fss_total: 0, ramq_total: 0,
        qc_impot_total: 0, ca_impot_total: 0, qc_solidarite: 0, qc_prime_travail: 0,
        ca_tps: 0, ca_pfrt: 0
      }
    }
  }

  /**
   * Get official MFQ results
   */
  private async getOfficialResults(household: any, year: number): Promise<any> {
    try {
      console.log('🐍 Lancement scraper officiel Python...')
      const result = await this.scraper.scrapeOfficialCalculator(household)
      
      if (!result.success) {
        throw new Error(result.error || 'Scraper failed')
      }

      return {
        revenu_disponible: result.revenu_disponible || 0,
        ae_total: (result.ae_total || 0) * -1, // Convert to negative for deductions
        rrq_total: (result.rrq_total || 0) * -1,
        rqap_total: (result.rqap_total || 0) * -1,
        fss_total: (result.fss || 0) * -1,
        ramq_total: (result.ramq || 0) * -1,
        qc_impot_total: result.qc_impot_total || 0,
        ca_impot_total: result.ca_impot_total || 0,
        qc_solidarite: result.qc_solidarite || 0,
        qc_prime_travail: result.qc_prime_travail || 0,
        ca_tps: result.ca_tps || 0,
        ca_pfrt: result.ca_pfrt || 0
      }
    } catch (error) {
      console.error('❌ Erreur scraper officiel:', error)
      throw error
    }
  }

  /**
   * Compare results program by program
   */
  private compareResults(ourResults: any, officialResults: any): ProgramComparison[] {
    const programs = [
      'revenu_disponible',
      'ae_total', 'rrq_total', 'rqap_total', 'fss_total', 'ramq_total',
      'qc_impot_total', 'ca_impot_total', 'qc_solidarite', 'qc_prime_travail',
      'ca_tps', 'ca_pfrt'
    ]

    return programs.map(program => {
      const ourValue = ourResults[program] || 0
      const officialValue = officialResults[program] || 0
      const gap = ourValue - officialValue
      const gapPercent = officialValue !== 0 ? (gap / Math.abs(officialValue)) * 100 : 0

      return {
        program,
        ourResult: ourValue,
        officialResult: officialValue,
        gap,
        gapPercent: Math.round(gapPercent * 100) / 100
      }
    })
  }

  /**
   * Run validation
   */
  async runValidation(config: ValidationConfig): Promise<void> {
    console.log(`🚀 VALIDATION UNIFIÉE SIMPLIFIÉE`)
    console.log(`================================`)
    console.log(`📊 Nombre de ménages: ${config.count}`)
    console.log(`📅 Année fiscale: ${config.year}`)
    console.log()

    const results: Array<{
      household: any
      comparisons: ProgramComparison[]
      totalGap: number
      accuracy: number
    }> = []

    for (let i = 0; i < config.count; i++) {
      try {
        const household = this.generateTestHousehold(config.year)
        const displayIncome = household.primaryPerson.grossWorkIncome.toNumber() + household.primaryPerson.grossRetirementIncome.toNumber()
        const householdDesc = household.householdType === HouseholdType.SINGLE ? 'single' : 'couple'
        console.log(`🔍 Test ${i+1}/${config.count}: ${householdDesc}, ${household.primaryPerson.age} ans, ${displayIncome}$`)
        
        // Get results from both calculators
        const ourResults = await this.getOurResults(household, config.year)
        const officialResults = await this.getOfficialResults(household, config.year)
        
        // Compare results
        const comparisons = this.compareResults(ourResults, officialResults)
        
        // Calculate metrics
        const revenuComparison = comparisons.find(c => c.program === 'revenu_disponible')!
        const totalGap = Math.abs(revenuComparison.gap)
        const accuracy = officialResults.revenu_disponible > 0 ? 
          ((officialResults.revenu_disponible - totalGap) / officialResults.revenu_disponible) * 100 : 0

        results.push({
          household,
          comparisons,
          totalGap,
          accuracy: Math.max(0, Math.round(accuracy * 100) / 100)
        })

        console.log(`   ✅ ${Math.round(accuracy)}% précision (écart: ${Math.round(totalGap)}$)`)
        
        // Delay between requests
        if (i < config.count - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.log(`   ❌ Échec: ${error}`)
      }
    }

    this.generateReport(results)
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(results: Array<any>): void {
    if (results.length === 0) {
      console.log('❌ Aucun résultat à analyser')
      return
    }

    // Find worst case
    const worstCase = results.reduce((worst, current) => 
      current.totalGap > worst.totalGap ? current : worst
    )

    // Calculate stats
    const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
    const avgGap = results.reduce((sum, r) => sum + r.totalGap, 0) / results.length

    console.log()
    console.log(`📊 RÉSUMÉ DE VALIDATION`)
    console.log(`=======================`)
    console.log(`✅ Tests réussis: ${results.length}`)
    console.log(`🎯 Précision moyenne: ${Math.round(avgAccuracy)}%`)
    console.log(`💰 Écart moyen: ${Math.round(avgGap)}$`)
    console.log()

    this.displayWorstCaseTable(worstCase)
    this.generateRecommendations(results)
  }

  /**
   * Display worst case table
   */
  private displayWorstCaseTable(worstCase: any): void {
    console.log(`🔴 PIRE CAS IDENTIFIÉ`)
    console.log(`====================`)
    const householdDesc = worstCase.household.householdType === HouseholdType.SINGLE ? 'single' : 'couple'
    const displayIncome = worstCase.household.primaryPerson.grossWorkIncome.toNumber() + worstCase.household.primaryPerson.grossRetirementIncome.toNumber()
    const spouse = worstCase.household.spouse
    const spouseDesc = spouse ? `, conjoint ${spouse.age} ans` : ''
    
    console.log(`👥 Ménage: ${householdDesc}, ${worstCase.household.primaryPerson.age} ans${spouseDesc}, ${displayIncome}$ de revenu`)
    console.log(`🎯 Précision: ${worstCase.accuracy}%`)
    console.log()

    // Group programs by category for structured display
    const programGroups = this.groupProgramsByCategory(worstCase.comparisons)
    
    console.log('## 📊 TABLEAU COMPLET DES PROGRAMMES SOCIO-FISCAUX')
    console.log()
    
    // Display main result
    const revenuDisponible = worstCase.comparisons.find((c: any) => c.program === 'revenu_disponible')
    if (revenuDisponible) {
      console.log('| Programme | Notre Calculateur | MFQ Officiel | Écart |')
      console.log('|-----------|------------------|--------------|-------|')
      console.log(`| **REVENU DISPONIBLE** | **${this.formatCurrency(revenuDisponible.ourResult)}** | **${this.formatCurrency(revenuDisponible.officialResult)}** | **${this.formatCurrency(revenuDisponible.gap, true)}** |`)
      console.log()
    }

    // Display Quebec fiscal regime
    if (programGroups.quebec.length > 0) {
      console.log('### 🏛️ RÉGIME FISCAL DU QUÉBEC')
      console.log('| Programme | Notre Calculateur | MFQ Officiel | Écart |')
      console.log('|-----------|------------------|--------------|-------|')
      
      programGroups.quebec.forEach((comp: ProgramComparison) => {
        const name = this.getStructuredProgramName(comp.program)
        const emphasis = comp.program === 'qc_impot_total' || comp.program === 'qc_solidarite' ? '**' : ''
        console.log(`| ${emphasis}${name}${emphasis} | ${emphasis}${this.formatCurrency(comp.ourResult)}${emphasis} | ${emphasis}${this.formatCurrency(comp.officialResult)}${emphasis} | ${emphasis}${this.formatCurrency(comp.gap, true)}${emphasis} |`)
      })
      console.log()
    }

    // Display Federal fiscal regime  
    if (programGroups.federal.length > 0) {
      console.log('### 🍁 RÉGIME FISCAL FÉDÉRAL')
      console.log('| Programme | Notre Calculateur | MFQ Officiel | Écart |')
      console.log('|-----------|------------------|--------------|-------|')
      
      programGroups.federal.forEach((comp: ProgramComparison) => {
        const name = this.getStructuredProgramName(comp.program)
        const emphasis = comp.program === 'ca_impot_total' || comp.program === 'ca_tps' ? '**' : ''
        console.log(`| ${emphasis}${name}${emphasis} | ${emphasis}${this.formatCurrency(comp.ourResult)}${emphasis} | ${emphasis}${this.formatCurrency(comp.officialResult)}${emphasis} | ${emphasis}${this.formatCurrency(comp.gap, true)}${emphasis} |`)
      })
      console.log()
    }

    // Display Contributions
    if (programGroups.contributions.length > 0) {
      console.log('### 💼 COTISATIONS')
      console.log('| Programme | Notre Calculateur | MFQ Officiel | Écart |')
      console.log('|-----------|------------------|--------------|-------|')
      
      programGroups.contributions.forEach((comp: ProgramComparison) => {
        const name = this.getStructuredProgramName(comp.program)
        const emphasis = Math.abs(comp.gap) > 500 ? '**' : ''
        console.log(`| ${emphasis}${name}${emphasis} | ${emphasis}${this.formatCurrency(comp.ourResult)}${emphasis} | ${emphasis}${this.formatCurrency(comp.officialResult)}${emphasis} | ${emphasis}${this.formatCurrency(comp.gap, true)}${emphasis} |`)
      })
      console.log()
    }
  }

  /**
   * Group programs by category for structured display
   */
  private groupProgramsByCategory(comparisons: ProgramComparison[]): any {
    const quebec: ProgramComparison[] = []
    const federal: ProgramComparison[] = []
    const contributions: ProgramComparison[] = []
    
    comparisons.forEach(comp => {
      if (comp.program === 'revenu_disponible') return // Handled separately
      
      if (comp.program.startsWith('qc_') || comp.program.includes('solidarite')) {
        quebec.push(comp)
      } else if (comp.program.startsWith('ca_') || comp.program.includes('tps')) {
        federal.push(comp)
      } else if (['ae_total', 'rrq_total', 'rqap_total', 'ramq', 'fss'].includes(comp.program)) {
        contributions.push(comp)
      }
    })
    
    return { quebec, federal, contributions }
  }

  /**
   * Get structured program names for display
   */
  private getStructuredProgramName(program: string): string {
    const names: Record<string, string> = {
      'qc_impot_total': 'Régime fiscal QC (net)',
      'qc_solidarite': 'Crédit pour la solidarité',
      'ca_impot_total': 'Régime fiscal fédéral (net)', 
      'ca_tps': 'Crédit pour la TPS',
      'ca_pfrt': 'Allocation canadienne pour les travailleurs',
      'ae_total': 'Assurance-emploi',
      'rrq_total': 'Régime de rentes du Québec',
      'rqap_total': 'Régime québécois d\'assurance parentale',
      'ramq': 'Régime d\'assurance médicaments du Québec',
      'fss': 'Fonds des services de santé',
      'qc_prime_travail': 'Prime au travail'
    }
    return names[program] || program
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(results: Array<any>): void {
    // Analyze common issues
    const programGaps = new Map<string, { totalGap: number, count: number }>()
    
    results.forEach(result => {
      result.comparisons.forEach((comp: ProgramComparison) => {
        if (comp.program === 'revenu_disponible') return
        
        const current = programGaps.get(comp.program) || { totalGap: 0, count: 0 }
        programGaps.set(comp.program, {
          totalGap: current.totalGap + Math.abs(comp.gap),
          count: current.count + 1
        })
      })
    })

    // Sort by average gap
    const sortedIssues = Array.from(programGaps.entries())
      .map(([program, data]) => ({
        program,
        avgGap: data.totalGap / data.count,
        frequency: data.count / results.length
      }))
      .filter(issue => issue.avgGap > 100)
      .sort((a, b) => b.avgGap - a.avgGap)

    console.log(`🔧 RECOMMANDATIONS DE CORRECTIONS`)
    console.log(`=================================`)
    
    if (sortedIssues.length === 0) {
      console.log('✅ Aucun problème majeur détecté!')
      return
    }

    sortedIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. **${this.formatProgramName(issue.program)}**`)
      console.log(`   • Écart moyen: ${Math.round(issue.avgGap)}$`)
      console.log(`   • Fréquence: ${Math.round(issue.frequency * 100)}% des cas`)
      console.log(`   • Action: ${this.getActionRecommendation(issue.program)}`)
      console.log()
    })
  }

  private formatProgramName(program: string): string {
    const names: Record<string, string> = {
      'revenu_disponible': 'Revenu disponible',
      'ae_total': 'Assurance-emploi',
      'rrq_total': 'RRQ',
      'rqap_total': 'RQAP',
      'fss_total': 'FSS',
      'ramq_total': 'RAMQ',
      'qc_impot_total': 'Impôt Québec',
      'ca_impot_total': 'Impôt Fédéral',
      'qc_solidarite': 'Crédit solidarité',
      'qc_prime_travail': 'Prime au travail',
      'ca_tps': 'Crédit TPS',
      'ca_pfrt': 'ACE'
    }
    return names[program] || program
  }

  private formatCurrency(value: number, showSign = false): string {
    const formatted = Math.abs(value).toFixed(0) + '$'
    if (value === 0) return '0$'
    if (showSign) {
      return value > 0 ? '+' + formatted : '-' + formatted
    }
    return value < 0 ? '-' + formatted : formatted
  }

  private getActionRecommendation(program: string): string {
    const recommendations: Record<string, string> = {
      'qc_solidarite': 'Vérifier les seuils et formules du crédit solidarité QC',
      'qc_prime_travail': 'Revoir le calcul de la prime au travail du Québec',
      'ca_tps': 'Corriger le crédit TPS/TVH fédéral',
      'ca_pfrt': 'Vérifier l\'ACE (Allocation canadienne pour enfants)',
      'qc_impot_total': 'Revoir le calcul des impôts du Québec',
      'ca_impot_total': 'Corriger le calcul des impôts fédéraux',
      'ae_total': 'Ajuster les cotisations d\'assurance-emploi',
      'rrq_total': 'Vérifier les cotisations RRQ',
      'rqap_total': 'Corriger les cotisations RQAP',
      'ramq_total': 'Ajuster les cotisations RAMQ',
      'fss_total': 'Vérifier les cotisations FSS'
    }
    return recommendations[program] || 'Analyser selon sources officielles'
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): ValidationConfig {
  const args = process.argv.slice(2)
  
  let count = 10 // default
  let year = 2024 // default
  
  args.forEach(arg => {
    if (arg.startsWith('--count=')) {
      count = parseInt(arg.split('=')[1]) || 10
    } else if (arg.startsWith('--year=')) {
      year = parseInt(arg.split('=')[1]) || 2024
    }
  })
  
  return { count, year }
}

/**
 * Main execution
 */
async function main() {
  try {
    const config = parseArgs()
    
    console.log(`🚀 VALIDATION SCRIPT RÉACTIVÉ`)
    console.log(`============================`)
    console.log(`📊 Configuration: ${config.count} ménages, année ${config.year}`)
    console.log()
    
    const validator = new SimpleUnifiedValidator()
    await validator.runValidation(config)
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
}

export { SimpleUnifiedValidator }