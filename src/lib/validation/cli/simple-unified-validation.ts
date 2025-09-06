#!/usr/bin/env tsx

/**
 * SCRIPT DE VALIDATION UNIFIÉ SIMPLE
 * ==================================
 * 
 * Script unique qui remplace tous les autres scripts de validation.
 * Compare notre calculateur avec celui du MFQ pour un nombre configurable de ménages.
 * 
 * Usage: npx tsx simple-unified-validation.ts --count=10 --year=2024
 */

import { PythonOfficialCalculatorScraper } from '../PythonOfficialCalculatorScraper'

interface ValidationConfig {
  count: number
  year: number
}

interface TestHousehold {
  situation: 'single' | 'couple'
  adults: Array<{
    age: number
    income: number
    retirementIncome: number
  }>
  children: Array<{
    age: number
  }>
  region: 'quebec'
}

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
  private generateTestHousehold(): TestHousehold {
    const situations = ['single', 'couple'] as const
    const situation = situations[Math.floor(Math.random() * situations.length)]
    
    // Generate primary adult
    const primaryAge = 18 + Math.floor(Math.random() * 47) // 18-64
    const primaryIncome = Math.floor(Math.random() * 80000) // 0-80k
    
    const household: TestHousehold = {
      situation,
      adults: [{
        age: primaryAge,
        income: primaryIncome,
        retirementIncome: primaryAge >= 65 ? Math.floor(Math.random() * 20000) : 0
      }],
      children: [],
      region: 'quebec'
    }

    // Add spouse if couple
    if (situation === 'couple') {
      const spouseAge = 18 + Math.floor(Math.random() * 47)
      const spouseIncome = Math.floor(Math.random() * 80000)
      
      household.adults.push({
        age: spouseAge,
        income: spouseIncome,
        retirementIncome: spouseAge >= 65 ? Math.floor(Math.random() * 20000) : 0
      })
    }

    // Add children (0-3)
    const numChildren = Math.floor(Math.random() * 4)
    for (let i = 0; i < numChildren; i++) {
      household.children.push({
        age: Math.floor(Math.random() * 18)
      })
    }

    return household
  }

  /**
   * Get our calculator results via API
   */
  private async getOurResults(household: TestHousehold, year: number): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          household,
          year
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const results = await response.json()
      
      return {
        revenu_disponible: Number(results.revenu_disponible || 0),
        ae_total: Number(results.ae_total || 0) * -1, // Convert to negative for deductions
        rrq_total: Number(results.rrq_total || 0) * -1,
        rqap_total: Number(results.rqap_total || 0) * -1,
        fss_total: Number(results.fss_total || 0) * -1,
        ramq_total: Number(results.ramq_total || 0) * -1,
        qc_impot_total: Number(results.qc_impot_total || 0),
        ca_impot_total: Number(results.ca_impot_total || 0),
        qc_solidarite: Number(results.qc_solidarite || 0),
        qc_prime_travail: Number(results.qc_prime_travail || 0),
        ca_tps: Number(results.ca_tps || 0),
        ca_pfrt: Number(results.ca_pfrt || 0)
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
  private async getOfficialResults(household: TestHousehold, year: number): Promise<any> {
    try {
      // Convert to format expected by scraper
      const scraperHousehold = {
        situation: household.situation,
        adults: household.adults,
        children: household.children,
        region: household.region
      }

      const results = await this.scraper.scrapeCalculation(scraperHousehold, year)
      
      return {
        revenu_disponible: Number(results.revenu_disponible || 0),
        ae_total: Number(results.ae_total || 0),
        rrq_total: Number(results.rrq_total || 0),
        rqap_total: Number(results.rqap_total || 0),
        fss_total: Number(results.fss_total || 0),
        ramq_total: Number(results.ramq_total || 0),
        qc_impot_total: Number(results.qc_impot_total || 0),
        ca_impot_total: Number(results.ca_impot_total || 0),
        qc_solidarite: Number(results.qc_solidarite || 0),
        qc_prime_travail: Number(results.qc_prime_travail || 0),
        ca_tps: Number(results.ca_tps || 0),
        ca_pfrt: Number(results.ca_pfrt || 0)
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
      household: TestHousehold
      comparisons: ProgramComparison[]
      totalGap: number
      accuracy: number
    }> = []

    for (let i = 0; i < config.count; i++) {
      try {
        const household = this.generateTestHousehold()
        const displayIncome = household.adults[0].income
        console.log(`🔍 Test ${i+1}/${config.count}: ${household.situation}, ${household.adults[0].age} ans, ${displayIncome}$`)
        
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
    console.log(`👥 Ménage: ${worstCase.household.situation}, ${worstCase.household.adults[0].age} ans, ${worstCase.household.adults[0].income}$`)
    console.log(`🎯 Précision: ${worstCase.accuracy}%`)
    console.log()

    console.log('| Programme | Notre Calculateur | Ministère des Finances | Écart |')
    console.log('|-----------|------------------|----------------------|-------|')
    
    worstCase.comparisons.forEach((comp: ProgramComparison) => {
      const programName = this.formatProgramName(comp.program).padEnd(20)
      const ourValue = this.formatCurrency(comp.ourResult).padStart(16)
      const officialValue = this.formatCurrency(comp.officialResult).padStart(20)
      const gap = this.formatCurrency(comp.gap, true).padStart(5)
      
      console.log(`| ${programName} | ${ourValue} | ${officialValue} | ${gap} |`)
    })
    console.log()
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
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const countArg = args.find(arg => arg.startsWith('--count='))
  const yearArg = args.find(arg => arg.startsWith('--year='))
  
  const config: ValidationConfig = {
    count: countArg ? parseInt(countArg.split('=')[1]) : 10,
    year: yearArg ? parseInt(yearArg.split('=')[1]) : 2024
  }

  if (![2024, 2025].includes(config.year)) {
    console.error('❌ Année doit être 2024 ou 2025')
    process.exit(1)
  }

  const validator = new SimpleUnifiedValidator()
  await validator.runValidation(config)
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
}

export { SimpleUnifiedValidator }