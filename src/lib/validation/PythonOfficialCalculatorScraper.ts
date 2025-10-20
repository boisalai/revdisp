/**
 * Scraper hybride TypeScript/Python pour le calculateur officiel du Québec
 * Utilise le script Python/Selenium qui fonctionne correctement
 */

import { spawn } from 'child_process'
import path from 'path'
import { HouseholdType, Household } from '../models'

export interface PythonOfficialCalculatorResult {
  revenu_disponible?: number
  ae_total?: number
  rrq_total?: number
  rqap_total?: number
  qc_regime_fiscal_total?: number
  ca_regime_fiscal_total?: number
  qc_impot?: number  // Impôt sur le revenu des particuliers du Québec
  ca_impot?: number  // Impôt sur le revenu des particuliers du Canada
  qc_solidarite?: number
  ca_tps?: number
  ca_pfrt?: number
  qc_prime_travail?: number
  ramq?: number
  fss?: number
  cotisations_total?: number
  qc_allocation_famille?: number
  qc_fournitures_scolaires?: number
  qc_garde_enfants?: number
  qc_allocation_logement?: number
  qc_soutien_aines?: number
  ca_allocation_enfants?: number
  ca_pension_securite?: number
  qc_aide_sociale?: number
  qc_frais_medicaux?: number
  ca_frais_medicaux?: number
  
  // Métadonnées
  timestamp: Date
  success: boolean
  error?: string
}

export class PythonOfficialCalculatorScraper {
  private readonly pythonScriptPath: string
  private readonly timeout: number
  
  constructor(options: { timeout?: number } = {}) {
    this.timeout = options.timeout ?? 60000
    // Le script Python est dans le dossier python-scraper à la racine
    this.pythonScriptPath = path.join(process.cwd(), 'python-scraper', 'calculator_scraper.py')
  }
  
  /**
   * Scrape le calculateur officiel en utilisant Python/Selenium
   */
  async scrapeOfficialCalculator(household: Household, year: number = 2024): Promise<PythonOfficialCalculatorResult> {
    const result: PythonOfficialCalculatorResult = {
      timestamp: new Date(),
      success: false
    }
    
    try {
      console.log('🐍 Lancement du scraper Python/Selenium...')
      
      // Préparer les données au format attendu par le script Python
      const householdData = this.mapHouseholdToPythonFormat(household, year)
      const jsonData = JSON.stringify(householdData)
      
      console.log(`📊 Données envoyées: ${household.householdType}, âge ${household.primaryPerson.age}`)
      
      // Exécuter le script Python avec uv
      const pythonResult = await this.runPythonScript(jsonData)
      
      // Parser les résultats JSON retournés par Python
      const parsedResult = JSON.parse(pythonResult)
      
      if (parsedResult.error) {
        result.error = parsedResult.error
        console.error('❌ Erreur Python:', parsedResult.error)
      } else {
        // Copier tous les résultats
        Object.assign(result, parsedResult)
        result.success = true
        
        console.log('✅ Scraper Python réussi:')
        console.log(`   - Revenu disponible: ${result.revenu_disponible}$`)
        console.log(`   - AE total: ${result.ae_total}$`)
        console.log(`   - RRQ total: ${result.rrq_total}$`)
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du scraping Python:', error)
      result.error = String(error)
    }
    
    return result
  }
  
  /**
   * Mapper notre modèle Household vers le format attendu par Python
   */
  private mapHouseholdToPythonFormat(household: Household, year: number) {
    return {
      householdType: this.mapHouseholdType(household.householdType),
      primaryPerson: {
        age: household.primaryPerson.age,
        grossWorkIncome: household.primaryPerson.grossWorkIncome,
        grossRetirementIncome: household.primaryPerson.grossRetirementIncome,
        isRetired: household.primaryPerson.isRetired
      },
      spouse: household.spouse ? {
        age: household.spouse.age,
        grossWorkIncome: household.spouse.grossWorkIncome,
        grossRetirementIncome: household.spouse.grossRetirementIncome,
        isRetired: household.spouse.isRetired
      } : null,
      numChildren: household.numChildren,
      taxYear: year
    }
  }
  
  /**
   * Mapper nos types de ménages vers les types Python
   */
  private mapHouseholdType(householdType: HouseholdType): string {
    const mapping: Record<HouseholdType, string> = {
      [HouseholdType.SINGLE]: 'single',
      [HouseholdType.SINGLE_PARENT]: 'single_parent', 
      [HouseholdType.COUPLE]: 'couple',
      [HouseholdType.RETIRED_SINGLE]: 'retired_single',
      [HouseholdType.RETIRED_COUPLE]: 'retired_couple'
    }
    
    return mapping[householdType] || 'single'
  }
  
  /**
   * Exécuter le script Python et retourner le résultat JSON
   */
  private runPythonScript(jsonData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Utiliser uv run pour exécuter le script Python
      const uvPath = '/Users/alain/.local/bin/uv' // Chemin complet vers uv
      const process = spawn(uvPath, ['run', 'python', this.pythonScriptPath, jsonData], {
        cwd: path.dirname(this.pythonScriptPath),
        timeout: this.timeout
      })
      
      let stdout = ''
      let stderr = ''
      
      process.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          // Succès - parser la dernière ligne JSON
          const lines = stdout.trim().split('\n')
          const jsonResult = lines[lines.length - 1] // Dernière ligne = JSON
          resolve(jsonResult)
        } else {
          reject(new Error(`Script Python échoué (code ${code}): ${stderr || stdout}`))
        }
      })
      
      process.on('error', (error) => {
        reject(new Error(`Erreur lancement Python: ${error.message}`))
      })
    })
  }
}

/**
 * Comparateur pour validation avec résultats officiels Python
 */
export class PythonValidationComparer {
  
  static compareProgram(
    ourValue: number,
    officialValue: number | undefined,
    programName: string,
    tolerance: number = 1.0
  ): {
    matches: boolean
    difference: number
    summary: string
  } {
    if (officialValue === undefined || officialValue === null) {
      return {
        matches: false,
        difference: 0,
        summary: `❓ ${programName} - Données officielles non disponibles`
      }
    }
    
    const difference = Math.abs(ourValue - officialValue)
    const matches = difference <= tolerance
    
    const summary = matches 
      ? `✅ ${programName} conforme (écart ${difference.toFixed(2)}$)`
      : `❌ ${programName} écart: notre ${ourValue}$ vs officiel ${officialValue}$ (diff ${difference.toFixed(2)}$)`
    
    return { matches, difference, summary }
  }
  
  static compareDisposableIncome(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 5.0 // Plus de tolérance pour le revenu total
  ) {
    return this.compareProgram(ourValue, officialResult.revenu_disponible, 'Revenu disponible', tolerance)
  }
  
  static compareEmploymentInsurance(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.ae_total, 'Assurance-emploi', tolerance)
  }
  
  static compareRRQ(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.rrq_total, 'RRQ', tolerance)
  }
  
  static compareRQAP(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.rqap_total, 'RQAP', tolerance)
  }
  
  static compareFSS(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.fss, 'FSS', tolerance)
  }
  
  static compareRAMQ(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.ramq, 'RAMQ', tolerance)
  }
  
  static compareQuebecTax(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 5.0
  ) {
    return this.compareProgram(ourValue, officialResult.qc_regime_fiscal_total, 'Régime fiscal Québec', tolerance)
  }
  
  static compareCanadaTax(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 5.0
  ) {
    return this.compareProgram(ourValue, officialResult.ca_regime_fiscal_total, 'Régime fiscal fédéral', tolerance)
  }
  
  static compareSolidarityCredit(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.qc_solidarite, 'Crédit solidarité', tolerance)
  }
  
  static compareGSTCredit(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.ca_tps, 'Crédit TPS', tolerance)
  }
  
  static compareWorkPremium(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 1.0
  ) {
    return this.compareProgram(ourValue, officialResult.qc_prime_travail, 'Prime travail', tolerance)
  }
  
  static compareFederalProgram(
    ourValue: number,
    officialResult: PythonOfficialCalculatorResult,
    tolerance: number = 5.0
  ) {
    return this.compareProgram(ourValue, officialResult.ca_pfrt, 'Programme fédéral (PFRT)', tolerance)
  }
}