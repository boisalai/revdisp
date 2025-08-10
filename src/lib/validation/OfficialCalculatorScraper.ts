/**
 * Système de validation automatisée avec le calculateur officiel 
 * du ministère des Finances du Québec
 * 
 * Utilise Puppeteer pour scraper les résultats officiels et les comparer
 * avec notre implémentation.
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import { HouseholdType, Person, Household } from '../models'

export interface OfficialCalculatorResult {
  // Revenus
  revenu_travail_principal?: number
  revenu_travail_conjoint?: number
  revenu_retraite_principal?: number
  revenu_retraite_conjoint?: number
  
  // Cotisations (ce qui nous intéresse pour l'AE)
  assurance_emploi_principal?: number
  assurance_emploi_conjoint?: number
  assurance_emploi_total?: number
  
  // Autres cotisations pour validation future
  rrq_principal?: number
  rrq_conjoint?: number
  rrq_total?: number
  
  rqap_principal?: number
  rqap_conjoint?: number
  rqap_total?: number
  
  // Résultat final
  revenu_disponible?: number
  
  // Métadonnées
  annee_fiscale: number
  situation_familiale: string
  timestamp: Date
}

export interface ScrapingOptions {
  headless?: boolean
  timeout?: number
  retries?: number
  delayBetweenActions?: number
}

export class OfficialCalculatorScraper {
  private browser: Browser | null = null
  private options: Required<ScrapingOptions>
  
  constructor(options: ScrapingOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      delayBetweenActions: options.delayBetweenActions ?? 1000
    }
  }
  
  /**
   * Initialise le navigateur Puppeteer
   */
  async initialize(): Promise<void> {
    if (this.browser) return
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })
  }
  
  /**
   * Ferme le navigateur
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
  
  /**
   * Scrape le calculateur officiel pour un ménage donné
   */
  async scrapeOfficialCalculator(
    household: Household, 
    taxYear: number
  ): Promise<OfficialCalculatorResult> {
    if (!this.browser) {
      throw new Error('Scraper non initialisé. Appelez initialize() d\'abord.')
    }
    
    const page = await this.browser.newPage()
    
    try {
      // Configuration de la page
      await page.setViewport({ width: 1280, height: 720 })
      await page.setDefaultTimeout(this.options.timeout)
      
      // Navigation vers le calculateur
      console.log('📍 Navigation vers le calculateur officiel...')
      await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
        waitUntil: 'networkidle2'
      })
      
      // Attendre que le formulaire soit chargé
      await this.waitForFormReady(page)
      
      // Remplir le formulaire avec les données du ménage
      await this.fillForm(page, household, taxYear)
      
      // Déclencher le calcul
      await this.submitForm(page)
      
      // Attendre et extraire les résultats
      const results = await this.extractResults(page, household, taxYear)
      
      return results
      
    } catch (error) {
      console.error('❌ Erreur lors du scraping:', error)
      // Prendre une capture d'écran pour debug
      await this.takeDebugScreenshot(page, 'scraping-error')
      throw error
    } finally {
      await page.close()
    }
  }
  
  /**
   * Attend que le formulaire soit prêt
   */
  private async waitForFormReady(page: Page): Promise<void> {
    console.log('⏳ Attente du chargement du formulaire...')
    
    // Attendre les éléments clés du formulaire
    await page.waitForSelector('#annee_fiscale', { timeout: this.options.timeout })
    await page.waitForSelector('#situation_familiale', { timeout: this.options.timeout })
    
    // Attendre que JavaScript ait fini de s'initialiser
    await this.delay(2000)
  }
  
  /**
   * Remplit le formulaire avec les données du ménage
   */
  private async fillForm(page: Page, household: Household, taxYear: number): Promise<void> {
    console.log('📝 Remplissage du formulaire...')
    
    // 1. Année fiscale
    await page.select('#annee_fiscale', taxYear.toString())
    await this.delay(this.options.delayBetweenActions)
    
    // 2. Situation familiale
    const situationFamiliale = this.mapHouseholdTypeToOfficial(household.householdType)
    await page.select('#situation_familiale', situationFamiliale)
    await this.delay(this.options.delayBetweenActions)
    
    // 3. Âge personne principale
    await page.type('#age_principal', household.primaryPerson.age.toString(), { delay: 100 })
    
    // 4. Revenus personne principale
    if (household.primaryPerson.isRetired) {
      await page.type('#revenu_retraite_principal', 
        household.primaryPerson.grossRetirementIncome.toString(), { delay: 100 })
    } else {
      await page.type('#revenu_travail_principal', 
        household.primaryPerson.grossWorkIncome.toString(), { delay: 100 })
    }
    
    // 5. Conjoint (si applicable)
    if (household.spouse) {
      await page.type('#age_conjoint', household.spouse.age.toString(), { delay: 100 })
      
      if (household.spouse.isRetired) {
        await page.type('#revenu_retraite_conjoint', 
          household.spouse.grossRetirementIncome.toString(), { delay: 100 })
      } else {
        await page.type('#revenu_travail_conjoint', 
          household.spouse.grossWorkIncome.toString(), { delay: 100 })
      }
    }
    
    // 6. Nombre d'enfants
    if (household.numChildren > 0) {
      await page.select('#nb_enfants', household.numChildren.toString())
      await this.delay(this.options.delayBetweenActions)
      
      // TODO: Ajouter la gestion des détails d'enfants si nécessaire
    }
    
    console.log('✅ Formulaire rempli avec succès')
  }
  
  /**
   * Soumet le formulaire et attend les résultats
   */
  private async submitForm(page: Page): Promise<void> {
    console.log('🚀 Soumission du formulaire...')
    
    // Cliquer sur le bouton calculer
    await page.click('#btn_calculer')
    
    // Attendre que les résultats apparaissent
    await page.waitForSelector('#resultats', { timeout: this.options.timeout })
    await this.delay(2000) // Attendre la fin des animations
    
    console.log('✅ Calcul terminé')
  }
  
  /**
   * Extrait les résultats du calculateur
   */
  private async extractResults(
    page: Page, 
    household: Household, 
    taxYear: number
  ): Promise<OfficialCalculatorResult> {
    console.log('📊 Extraction des résultats...')
    
    const results: OfficialCalculatorResult = {
      annee_fiscale: taxYear,
      situation_familiale: this.mapHouseholdTypeToOfficial(household.householdType),
      timestamp: new Date()
    }
    
    try {
      // Extraire l'assurance-emploi (notre focus principal)
      results.assurance_emploi_principal = await this.extractNumericValue(page, '#ae_principal')
      
      if (household.spouse) {
        results.assurance_emploi_conjoint = await this.extractNumericValue(page, '#ae_conjoint')
      }
      
      results.assurance_emploi_total = await this.extractNumericValue(page, '#ae_total')
      
      // Extraire d'autres cotisations pour validation future
      results.rrq_principal = await this.extractNumericValue(page, '#rrq_principal')
      results.rrq_conjoint = await this.extractNumericValue(page, '#rrq_conjoint')
      results.rrq_total = await this.extractNumericValue(page, '#rrq_total')
      
      results.rqap_principal = await this.extractNumericValue(page, '#rqap_principal')
      results.rqap_conjoint = await this.extractNumericValue(page, '#rqap_conjoint')
      results.rqap_total = await this.extractNumericValue(page, '#rqap_total')
      
      // Revenu disponible final
      results.revenu_disponible = await this.extractNumericValue(page, '#revenu_disponible')
      
      console.log('✅ Résultats extraits:', {
        ae_total: results.assurance_emploi_total,
        rrq_total: results.rrq_total,
        revenu_disponible: results.revenu_disponible
      })
      
    } catch (error) {
      console.warn('⚠️  Erreur lors de l\'extraction de certains résultats:', error)
      // Ne pas faire échouer complètement si certains résultats manquent
    }
    
    return results
  }
  
  /**
   * Extrait une valeur numérique d'un élément
   */
  private async extractNumericValue(page: Page, selector: string): Promise<number | undefined> {
    try {
      const element = await page.$(selector)
      if (!element) return undefined
      
      const text = await page.evaluate(el => el.textContent || '', element)
      const numericValue = parseFloat(text.replace(/[^0-9.-]/g, ''))
      
      return isNaN(numericValue) ? undefined : numericValue
    } catch {
      return undefined
    }
  }
  
  /**
   * Mappe notre type de ménage vers les valeurs du calculateur officiel
   */
  private mapHouseholdTypeToOfficial(householdType: HouseholdType): string {
    const mapping: Record<HouseholdType, string> = {
      [HouseholdType.SINGLE]: 'personne_seule',
      [HouseholdType.SINGLE_PARENT]: 'famille_monoparentale',
      [HouseholdType.COUPLE]: 'couple',
      [HouseholdType.RETIRED_SINGLE]: 'retraite_seul',
      [HouseholdType.RETIRED_COUPLE]: 'retraite_couple'
    }
    
    return mapping[householdType] || 'personne_seule'
  }
  
  /**
   * Prend une capture d'écran pour debug
   */
  private async takeDebugScreenshot(page: Page, name: string): Promise<void> {
    try {
      await page.screenshot({ 
        path: `debug-${name}-${Date.now()}.png`,
        fullPage: true
      })
      console.log(`📸 Capture d'écran sauvée: debug-${name}-${Date.now()}.png`)
    } catch (error) {
      console.warn('⚠️  Impossible de prendre une capture d\'écran:', error)
    }
  }
  
  /**
   * Délai utilitaire
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Classe pour comparer nos résultats avec ceux du calculateur officiel
 */
export class OfficialValidationComparer {
  
  /**
   * Compare les résultats d'assurance-emploi
   */
  static compareEmploymentInsurance(
    ourResult: { employee: number, total: number },
    officialResult: OfficialCalculatorResult,
    tolerance: number = 0.5
  ): {
    matches: boolean
    differences: Array<{ field: string, our: number, official: number, diff: number }>
    summary: string
  } {
    const differences = []
    let matches = true
    
    // Comparer le total AE (focus principal)
    if (officialResult.assurance_emploi_total !== undefined) {
      const diff = Math.abs(ourResult.total - officialResult.assurance_emploi_total)
      if (diff > tolerance) {
        matches = false
        differences.push({
          field: 'assurance_emploi_total',
          our: ourResult.total,
          official: officialResult.assurance_emploi_total,
          diff
        })
      }
    }
    
    const summary = matches 
      ? `✅ Résultats conformes (écart < ${tolerance}$)`
      : `❌ Écarts détectés: ${differences.length} différence(s)`
    
    return { matches, differences, summary }
  }
}