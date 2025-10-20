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
   * Calculate Quebec fiscal regime (tax + all QC programs)
   * Régime fiscal QC = Impôt QC + Crédit solidarité + Prime travail + Aide sociale + autres programmes QC
   */
  private calculateQcFiscalRegime(results: any): number {
    return (
      -(results.taxes?.quebec?.toNumber() || 0) +  // Impôt QC (négatif car c'est un coût)
      (results.quebec?.solidarity?.net_credit?.toNumber() || 0) +  // Crédit solidarité
      (results.quebec?.work_premium?.net_premium?.toNumber() || 0) +  // Prime au travail
      (results.quebec?.social_assistance?.net_benefit?.toNumber() || 0) +  // Aide sociale
      (results.quebec?.family_allowance?.net_benefit?.toNumber() || 0) +  // Allocation famille
      (results.quebec?.school_supplies?.amount?.toNumber() || 0) +  // Fournitures scolaires
      (results.quebec?.childcare_credit?.amount?.toNumber() || 0) +  // Garde d'enfants
      (results.quebec?.housing_allowance?.annual_allowance?.toNumber() || 0) +  // Allocation-logement
      (results.quebec?.senior_support?.amount?.toNumber() || 0) +  // Soutien aînés
      (results.quebec?.medical_expense?.amount?.toNumber() || 0)  // Frais médicaux QC
    )
  }

  /**
   * Calculate Federal fiscal regime (tax + all federal programs)
   * Régime fiscal fédéral = Impôt fédéral + Crédit TPS + ACT + ACE + PSV + autres programmes fédéraux
   */
  private calculateFederalFiscalRegime(results: any): number {
    return (
      -(results.taxes?.canada?.toNumber() || 0) +  // Impôt fédéral (négatif car c'est un coût)
      (results.canada?.gst_credit?.amount?.toNumber() || 0) +  // Crédit TPS
      (results.canada?.canada_workers?.amount?.toNumber() || 0) +  // ACT (Allocation canadienne pour les travailleurs)
      (results.canada?.child_benefit?.net_benefit?.toNumber() || 0) +  // ACE (Allocation canadienne pour enfants)
      (results.canada?.old_age_security?.total_benefit?.toNumber() || 0) +  // PSV + SRG
      (results.canada?.medical_expense?.amount?.toNumber() || 0)  // Frais médicaux fédéral
    )
  }

  /**
   * Get our calculator results directly
   */
  private async getOurResults(household: any, year: number): Promise<any> {
    try {
      const { RevenuDisponibleCalculator } = await import('../../MainCalculator')
      
      // Create calculator instance
      const calculator = new RevenuDisponibleCalculator(year)
      
      // household is already a Household object from generateTestHousehold
      // Just use it directly
      
      // Calculate results
      const results = await calculator.calculate(household)
      
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
        ae_total: calculationResults.ae_total, // Already positive values from calculator
        rrq_total: calculationResults.rrq_total,
        rqap_total: calculationResults.rqap_total,
        fss_total: calculationResults.fss_total,
        ramq_total: calculationResults.ramq_total,
        qc_regime_fiscal_total: this.calculateQcFiscalRegime(results),
        ca_regime_fiscal_total: this.calculateFederalFiscalRegime(results),
        qc_solidarite: results.quebec?.solidarity?.net_credit?.toNumber() || 0,
        qc_prime_travail: results.quebec?.work_premium?.net_premium?.toNumber() || 0,
        ca_tps: results.canada?.gst_credit?.amount?.toNumber() || 0,
        ca_pfrt: results.canada?.canada_workers?.amount?.toNumber() || 0,
        ca_allocation_enfants: results.canada?.child_benefit?.net_benefit?.toNumber() || 0,
        qc_allocation_logement: results.quebec?.housing_allowance?.annual_allowance?.toNumber() || 0,
        qc_aide_sociale: results.quebec?.social_assistance?.net_benefit?.toNumber() || 0
      }
    } catch (error) {
      console.error('❌ Erreur API locale:', error)
      // Return zeros if our calculator fails
      return {
        revenu_disponible: 0,
        ae_total: 0, rrq_total: 0, rqap_total: 0, fss_total: 0, ramq_total: 0,
        qc_regime_fiscal_total: 0, ca_regime_fiscal_total: 0, qc_solidarite: 0, qc_prime_travail: 0,
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
      const result = await this.scraper.scrapeOfficialCalculator(household, year)
      
      if (!result.success) {
        throw new Error(result.error || 'Scraper failed')
      }

      return {
        revenu_disponible: result.revenu_disponible || 0,
        ae_total: Math.abs(result.ae_total || 0), // Ensure positive for comparison
        rrq_total: Math.abs(result.rrq_total || 0),
        rqap_total: Math.abs(result.rqap_total || 0),
        fss_total: Math.abs(result.fss || 0),
        ramq_total: Math.abs(result.ramq || 0),
        qc_regime_fiscal_total: result.qc_regime_fiscal_total || 0,
        ca_regime_fiscal_total: result.ca_regime_fiscal_total || 0,
        qc_solidarite: result.qc_solidarite || 0,
        qc_prime_travail: result.qc_prime_travail || 0,
        ca_tps: result.ca_tps || 0,
        ca_pfrt: result.ca_pfrt || 0,
        ca_allocation_enfants: result.ca_allocation_enfants || 0,
        qc_allocation_logement: result.qc_allocation_logement || 0,
        qc_aide_sociale: result.qc_aide_sociale || 0
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
      'qc_regime_fiscal_total', 'ca_regime_fiscal_total', 'qc_solidarite', 'qc_prime_travail',
      'ca_tps', 'ca_pfrt', 'cotisations_total',
      'qc_allocation_famille', 'qc_fournitures_scolaires', 'qc_garde_enfants',
      'qc_allocation_logement', 'qc_soutien_aines', 'ca_allocation_enfants',
      'ca_pension_securite', 'qc_aide_sociale', 'qc_frais_medicaux', 'ca_frais_medicaux'
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
        
        // Calculate detailed household info
        const primaryIncome = household.primaryPerson.grossWorkIncome.toNumber() + household.primaryPerson.grossRetirementIncome.toNumber()
        const householdDesc = household.householdType === HouseholdType.SINGLE ? 'single' : 'couple'
        
        if (householdDesc === 'couple' && household.spouse) {
          const spouseIncome = household.spouse.grossWorkIncome.toNumber() + household.spouse.grossRetirementIncome.toNumber()
          const totalIncome = primaryIncome + spouseIncome
          console.log(`🔍 Test ${i+1}/${config.count}: ${householdDesc}`)
          console.log(`   👤 Adulte 1: ${household.primaryPerson.age} ans, ${primaryIncome}$`)
          console.log(`   👤 Adulte 2: ${household.spouse.age} ans, ${spouseIncome}$`)
          console.log(`   💰 Revenu total: ${totalIncome}$`)
        } else {
          console.log(`🔍 Test ${i+1}/${config.count}: ${householdDesc}, ${household.primaryPerson.age} ans, ${primaryIncome}$`)
        }
        
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

    console.log(`🔴 PIRE CAS IDENTIFIÉ`)
    console.log(`====================`)
    this.displayCaseTable(worstCase)
    
    // Also display high-income couple case if there's one (even if not worst)
    const highIncomeCouple = results
      .filter(r => r.household.householdType !== HouseholdType.SINGLE)
      .sort((a, b) => {
        const incomeA = (a.household.primaryPerson.grossWorkIncome.toNumber() + 
                        a.household.primaryPerson.grossRetirementIncome.toNumber() +
                        (a.household.spouse ? a.household.spouse.grossWorkIncome.toNumber() + 
                         a.household.spouse.grossRetirementIncome.toNumber() : 0))
        const incomeB = (b.household.primaryPerson.grossWorkIncome.toNumber() + 
                        b.household.primaryPerson.grossRetirementIncome.toNumber() +
                        (b.household.spouse ? b.household.spouse.grossWorkIncome.toNumber() + 
                         b.household.spouse.grossRetirementIncome.toNumber() : 0))
        return incomeB - incomeA // Sort descending by income
      })[0]
    
    if (highIncomeCouple && highIncomeCouple !== worstCase) {
      console.log()
      console.log(`🟢 COUPLE À PLUS HAUT REVENU`)
      console.log(`===========================`)
      this.displayCaseTable(highIncomeCouple)
    }
    
    this.generateRecommendations(results)
  }

  /**
   * Display case table (reusable for worst case or couple case)
   */
  private displayCaseTable(caseData: any): void {
    const householdDesc = caseData.household.householdType === HouseholdType.SINGLE ? 'single' : 'couple'
    const primaryIncome = caseData.household.primaryPerson.grossWorkIncome.toNumber() + caseData.household.primaryPerson.grossRetirementIncome.toNumber()
    const spouse = caseData.household.spouse
    
    // Group programs by category for structured display
    const programGroups = this.groupProgramsByCategory(caseData.comparisons)
    
    if (householdDesc === 'couple' && spouse) {
      const spouseIncome = spouse.grossWorkIncome.toNumber() + spouse.grossRetirementIncome.toNumber()
      const totalIncome = primaryIncome + spouseIncome
      console.log(`👥 **TYPE: ${householdDesc.toUpperCase()}**`)
      console.log(`👤 **Adulte 1**: ${caseData.household.primaryPerson.age} ans, ${primaryIncome}$`)
      console.log(`👤 **Adulte 2**: ${spouse.age} ans, ${spouseIncome}$`)
      console.log(`💰 **Revenu total**: ${totalIncome}$`)
      console.log(`🎯 Précision: ${caseData.accuracy}%`)
      console.log()
      
      console.log(`## 📊 TABLEAU COMPLET DES PROGRAMMES SOCIO-FISCAUX`)
      console.log(`**Type: ${householdDesc.toUpperCase()}** | **Adulte 1: ${caseData.household.primaryPerson.age} ans, ${primaryIncome}$** | **Adulte 2: ${spouse.age} ans, ${spouseIncome}$** | **Total: ${totalIncome}$**`)
    } else {
      console.log(`👥 **TYPE: ${householdDesc.toUpperCase()}** | Âge: ${caseData.household.primaryPerson.age} ans | Revenu: ${primaryIncome}$`)
      console.log(`🎯 Précision: ${caseData.accuracy}%`)
      console.log()
      
      console.log(`## 📊 TABLEAU COMPLET DES PROGRAMMES SOCIO-FISCAUX`)
      console.log(`**Type de ménage: ${householdDesc.toUpperCase()}** | **Âge: ${caseData.household.primaryPerson.age} ans** | **Revenu: ${primaryIncome}$**`)
    }
    console.log()
    
    // Display main result
    const revenuDisponible = caseData.comparisons.find((c: any) => c.program === 'revenu_disponible')
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
        const emphasis = comp.program === 'qc_regime_fiscal_total' || comp.program === 'qc_solidarite' ? '**' : ''
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
        const emphasis = comp.program === 'ca_regime_fiscal_total' || comp.program === 'ca_tps' ? '**' : ''
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
      'qc_regime_fiscal_total': 'Régime fiscal QC (net)',
      'qc_solidarite': 'Crédit pour la solidarité',
      'ca_regime_fiscal_total': 'Régime fiscal fédéral (net)', 
      'ca_tps': 'Crédit pour la TPS',
      'ca_pfrt': 'Allocation canadienne pour les travailleurs',
      'ae_total': 'Assurance-emploi',
      'rrq_total': 'Régime de rentes du Québec',
      'rqap_total': 'Régime québécois d\'assurance parentale',
      'ramq': 'Régime d\'assurance médicaments du Québec',
      'fss': 'Fonds des services de santé',
      'qc_prime_travail': 'Prime au travail',
      'cotisations_total': 'Cotisations totales',
      'qc_allocation_famille': 'Allocation famille',
      'qc_fournitures_scolaires': 'Fournitures scolaires',
      'qc_garde_enfants': 'Crédit garde d\'enfants',
      'qc_allocation_logement': 'Allocation-logement',
      'qc_soutien_aines': 'Soutien aux aînés',
      'ca_allocation_enfants': 'Allocation canadienne pour enfants',
      'ca_pension_securite': 'Pension sécurité vieillesse',
      'qc_aide_sociale': 'Aide sociale',
      'qc_frais_medicaux': 'Frais médicaux QC',
      'ca_frais_medicaux': 'Frais médicaux fédéral'
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
      'qc_regime_fiscal_total': 'Régime fiscal Québec',
      'ca_regime_fiscal_total': 'Régime fiscal Fédéral',
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
      'qc_regime_fiscal_total': 'Revoir le calcul du régime fiscal du Québec',
      'ca_regime_fiscal_total': 'Corriger le calcul du régime fiscal fédéral',
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