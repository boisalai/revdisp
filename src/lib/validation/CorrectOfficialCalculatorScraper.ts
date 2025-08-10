/**
 * Scraper corrigé avec les vrais sélecteurs du calculateur officiel
 * Basé sur l'analyse du site réel
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import { HouseholdType, Person, Household } from '../models'

export interface OfficialCalculatorResult {
  // Revenus saisis
  revenu_principal?: number
  revenu_conjoint?: number
  
  // Cotisations (notre focus pour l'AE)
  assurance_emploi_2024?: number  // CA_ae_old
  assurance_emploi_2025?: number  // CA_ae_new
  
  rrq_2024?: number              // CA_rrq_old  
  rrq_2025?: number              // CA_rrq_new
  
  rqap_2024?: number             // QC_rqap_old
  rqap_2025?: number             // QC_rqap_new
  
  // Total cotisations
  cotisations_2024?: number      // Cotisation_old
  cotisations_2025?: number      // Cotisation_new
  
  // Revenu disponible final
  revenu_disponible_2024?: number // RD_old
  revenu_disponible_2025?: number // RD_new
  
  // Métadonnées
  situation_familiale: string
  timestamp: Date
  success: boolean
  error?: string
}

export class CorrectOfficialCalculatorScraper {
  private browser: Browser | null = null
  private readonly timeout: number
  private readonly headless: boolean
  
  constructor(options: { headless?: boolean, timeout?: number } = {}) {
    this.headless = options.headless ?? true
    this.timeout = options.timeout ?? 45000
  }
  
  async initialize(): Promise<void> {
    if (this.browser) return
    
    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })
  }
  
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
  
  /**
   * Scrape avec gestion d'erreurs robuste
   */
  async scrapeOfficialCalculator(household: Household): Promise<OfficialCalculatorResult> {
    if (!this.browser) {
      throw new Error('Scraper non initialisé. Appelez initialize() d\'abord.')
    }
    
    const page = await this.browser.newPage()
    
    const result: OfficialCalculatorResult = {
      situation_familiale: this.mapHouseholdTypeToOfficial(household.householdType),
      timestamp: new Date(),
      success: false
    }
    
    try {
      // Configuration de la page
      await page.setViewport({ width: 1366, height: 768 })
      await page.setDefaultTimeout(this.timeout)
      
      console.log('📍 Navigation vers le calculateur officiel...')
      await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      })
      
      // Gérer les cookies
      await this.handleCookieConsent(page)
      
      // Attendre le chargement complet
      await this.delay(3000)
      
      // Remplir le formulaire
      console.log('📝 Remplissage du formulaire...')
      await this.fillFormWithRealSelectors(page, household)
      
      // Attendre que les calculs se fassent automatiquement
      console.log('⏳ Attente des calculs automatiques...')
      await this.delay(3000)
      
      // Extraire les résultats
      console.log('📊 Extraction des résultats...')
      await this.extractResultsWithRealSelectors(page, result)
      
      result.success = true
      console.log('✅ Scraping réussi')
      
    } catch (error) {
      console.error('❌ Erreur lors du scraping:', error)
      result.error = String(error)
      
      // Prendre une capture d'écran pour debug
      await this.takeDebugScreenshot(page, 'scraping-error')
    } finally {
      await page.close()
    }
    
    return result
  }
  
  /**
   * Gérer le consentement aux cookies
   */
  private async handleCookieConsent(page: Page): Promise<void> {
    try {
      // Attendre et accepter les cookies si le banner apparaît
      const acceptButton = await page.$('#acceptButton')
      if (acceptButton) {
        console.log('🍪 Acceptation des cookies...')
        await acceptButton.click()
        await this.delay(1000)
      }
    } catch (error) {
      // Ignorer si les cookies ne sont pas présents
      console.log('ℹ️  Pas de banner de cookies détecté')
    }
  }
  
  /**
   * Remplit le formulaire avec les vrais sélecteurs identifiés
   */
  private async fillFormWithRealSelectors(page: Page, household: Household): Promise<void> {
    
    // 1. Situation familiale
    const situation = this.mapHouseholdTypeToOfficial(household.householdType)
    console.log(`   Situation: ${situation}`)
    
    await page.select('#Situation', situation)
    await this.delay(1000)
    
    // 2. Nombre d'enfants
    const nbEnfants = this.mapChildrenCountToOfficial(household.numChildren)
    console.log(`   Enfants: ${nbEnfants}`)
    
    await page.select('#NbEnfants', nbEnfants)
    await this.delay(1000)
    
    // 3. Personne principale - Age
    console.log(`   Âge principal: ${household.primaryPerson.age}`)
    await this.clearAndType(page, '#AgeAdulte1', household.primaryPerson.age.toString())
    
    // 4. Personne principale - Revenu
    const revenuPrincipal = household.primaryPerson.isRetired 
      ? household.primaryPerson.grossRetirementIncome 
      : household.primaryPerson.grossWorkIncome
    
    console.log(`   Revenu principal: ${revenuPrincipal}`)
    await this.clearAndType(page, '#Revenu1', revenuPrincipal.toString())
    
    // 5. Conjoint (si applicable)
    if (household.spouse) {
      console.log(`   Âge conjoint: ${household.spouse.age}`)
      await this.clearAndType(page, '#AgeAdulte2', household.spouse.age.toString())
      
      const revenuConjoint = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      
      console.log(`   Revenu conjoint: ${revenuConjoint}`)  
      await this.clearAndType(page, '#Revenu2', revenuConjoint.toString())
    }
    
    // 6. Enfants (si applicable) - Pour l'instant, juste l'âge
    if (household.numChildren > 0) {
      // Premier enfant par défaut à 5 ans pour les tests
      await this.clearAndType(page, '#AgeEnfant1', '5')
      console.log('   Premier enfant: 5 ans')
    }
    
    // Laisser le temps au JavaScript de calculer
    console.log('   Attente de la recalculation automatique...')
    await this.delay(2000)
  }
  
  /**
   * Extrait les résultats avec les vrais sélecteurs
   */
  private async extractResultsWithRealSelectors(page: Page, result: OfficialCalculatorResult): Promise<void> {
    
    // Extraire l'assurance-emploi (notre focus principal)
    result.assurance_emploi_2024 = await this.extractNumericValue(page, '#CA_ae_old')
    result.assurance_emploi_2025 = await this.extractNumericValue(page, '#CA_ae_new')
    
    // Extraire RRQ
    result.rrq_2024 = await this.extractNumericValue(page, '#CA_rrq_old')
    result.rrq_2025 = await this.extractNumericValue(page, '#CA_rrq_new')
    
    // Extraire RQAP  
    result.rqap_2024 = await this.extractNumericValue(page, '#QC_rqap_old')
    result.rqap_2025 = await this.extractNumericValue(page, '#QC_rqap_new')
    
    // Extraire total cotisations
    result.cotisations_2024 = await this.extractNumericValue(page, '#Cotisation_old')
    result.cotisations_2025 = await this.extractNumericValue(page, '#Cotisation_new')
    
    // Extraire revenu disponible
    result.revenu_disponible_2024 = await this.extractNumericValue(page, '#RD_old')
    result.revenu_disponible_2025 = await this.extractNumericValue(page, '#RD_new')
    
    console.log('📊 Résultats extraits:')
    console.log(`   AE 2024: ${result.assurance_emploi_2024}$`)
    console.log(`   AE 2025: ${result.assurance_emploi_2025}$`)
    console.log(`   RRQ 2024: ${result.rrq_2024}$`)
    console.log(`   RRQ 2025: ${result.rrq_2025}$`)
    console.log(`   Cotisations 2024: ${result.cotisations_2024}$`)
    console.log(`   Cotisations 2025: ${result.cotisations_2025}$`)
  }
  
  /**
   * Efface et tape une valeur dans un champ
   */
  private async clearAndType(page: Page, selector: string, value: string): Promise<void> {
    // Triple-clic pour sélectionner tout le contenu
    await page.click(selector, { clickCount: 3 })
    // Ou utiliser Ctrl+A
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    // Supprimer le contenu sélectionné
    await page.keyboard.press('Delete')
    // Taper la nouvelle valeur
    await page.type(selector, value, { delay: 100 })
  }
  
  /**
   * Extrait une valeur numérique d'un élément
   */
  private async extractNumericValue(page: Page, selector: string): Promise<number | undefined> {
    try {
      const element = await page.$(selector)
      if (!element) {
        console.warn(`⚠️  Élément non trouvé: ${selector}`)
        return undefined
      }
      
      const text = await page.evaluate(el => (el as HTMLInputElement).value || el.textContent || '', element)
      const cleaned = text.replace(/[^0-9.-]/g, '')
      const numericValue = parseFloat(cleaned)
      
      return isNaN(numericValue) ? undefined : Math.abs(numericValue) // Valeur absolue car peut être négative
    } catch (error) {
      console.warn(`⚠️  Erreur extraction ${selector}:`, error)
      return undefined
    }
  }
  
  /**
   * Mappe notre type de ménage vers les valeurs officielles
   */
  private mapHouseholdTypeToOfficial(householdType: HouseholdType): string {
    const mapping: Record<HouseholdType, string> = {
      [HouseholdType.SINGLE]: 'Personne vivant seule',
      [HouseholdType.SINGLE_PARENT]: 'Famille monoparentale',
      [HouseholdType.COUPLE]: 'Couple',
      [HouseholdType.RETIRED_SINGLE]: 'Retraité vivant seul',
      [HouseholdType.RETIRED_COUPLE]: 'Couple de retraités'
    }
    
    return mapping[householdType] || 'Personne vivant seule'
  }
  
  /**
   * Mappe le nombre d'enfants vers les valeurs officielles
   */
  private mapChildrenCountToOfficial(numChildren: number): string {
    const mapping: Record<number, string> = {
      0: 'Aucun enfant',
      1: 'Un enfant',
      2: 'Deux enfants', 
      3: 'Trois enfants',
      4: 'Quatre enfants',
      5: 'Cinq enfants'
    }
    
    return mapping[Math.min(numChildren, 5)] || 'Aucun enfant'
  }
  
  /**
   * Prend une capture d'écran pour debug
   */
  private async takeDebugScreenshot(page: Page, name: string): Promise<void> {
    try {
      const filename = `debug-${name}-${Date.now()}.png` as const
      await page.screenshot({ 
        path: filename,
        fullPage: true
      })
      console.log(`📸 Capture d'écran: ${filename}`)
    } catch (error) {
      console.warn('⚠️  Impossible de prendre une capture:', error)
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
 * Comparateur pour validation avec résultats officiels
 */
export class OfficialValidationComparer {
  
  static compareEmploymentInsurance(
    ourResult: { employee: number, total: number },
    officialResult: OfficialCalculatorResult,
    year: number,
    tolerance: number = 1.0
  ): {
    matches: boolean
    differences: Array<{ field: string, our: number, official: number, diff: number }>
    summary: string
  } {
    const differences = []
    let matches = true
    
    // Sélectionner la bonne année
    const officialAE = year === 2025 
      ? officialResult.assurance_emploi_2025 
      : officialResult.assurance_emploi_2024
    
    if (officialAE !== undefined && officialAE > 0) {
      const diff = Math.abs(ourResult.employee - officialAE) // Comparer seulement l'employé
      if (diff > tolerance) {
        matches = false
        differences.push({
          field: 'assurance_emploi',
          our: ourResult.employee,
          official: officialAE,
          diff
        })
      }
    } else {
      // Pas de données officielles disponibles
      return {
        matches: false,
        differences: [],
        summary: `❓ Données AE ${year} non disponibles du site officiel`
      }
    }
    
    const summary = matches 
      ? `✅ AE ${year} conforme (écart < ${tolerance}$)`
      : `❌ AE ${year} écart: ${differences[0]?.diff.toFixed(2)}$`
    
    return { matches, differences, summary }
  }

  static compareRRQ(
    ourResult: { employment: number, self_employed: number, total: number },
    officialResult: OfficialCalculatorResult,
    year: number,
    tolerance: number = 1.0
  ): {
    matches: boolean
    differences: Array<{ field: string, our: number, official: number, diff: number }>
    summary: string
  } {
    const differences = []
    let matches = true
    
    // Sélectionner la bonne année
    const officialRRQ = year === 2025 
      ? officialResult.rrq_2025 
      : officialResult.rrq_2024
    
    if (officialRRQ !== undefined && officialRRQ > 0) {
      const diff = Math.abs(ourResult.total - officialRRQ) // Comparer le total
      if (diff > tolerance) {
        matches = false
        differences.push({
          field: 'rrq',
          our: ourResult.total,
          official: officialRRQ,
          diff
        })
      }
    } else {
      // Pas de données officielles disponibles
      return {
        matches: false,
        differences: [],
        summary: `❓ Données RRQ ${year} non disponibles du site officiel`
      }
    }
    
    const summary = matches 
      ? `✅ RRQ ${year} conforme (écart < ${tolerance}$)`
      : `❌ RRQ ${year} écart: ${differences[0]?.diff.toFixed(2)}$`
    
    return { matches, differences, summary }
  }

  static compareRQAP(
    ourResult: { employee: number, self_employed: number, total: number },
    officialResult: OfficialCalculatorResult,
    year: number,
    tolerance: number = 1.0
  ): {
    matches: boolean
    differences: Array<{ field: string, our: number, official: number, diff: number }>
    summary: string
  } {
    const differences = []
    let matches = true
    
    // Sélectionner la bonne année
    const officialRQAP = year === 2025 
      ? officialResult.rqap_2025 
      : officialResult.rqap_2024
    
    if (officialRQAP !== undefined && officialRQAP > 0) {
      const diff = Math.abs(ourResult.total - officialRQAP) // Comparer le total
      if (diff > tolerance) {
        matches = false
        differences.push({
          field: 'rqap',
          our: ourResult.total,
          official: officialRQAP,
          diff
        })
      }
    } else {
      // Pas de données officielles disponibles
      return {
        matches: false,
        differences: [],
        summary: `❓ Données RQAP ${year} non disponibles du site officiel`
      }
    }
    
    const summary = matches 
      ? `✅ RQAP ${year} conforme (écart < ${tolerance}$)`
      : `❌ RQAP ${year} écart: ${differences[0]?.diff.toFixed(2)}$`
    
    return { matches, differences, summary }
  }

  static compareFSS(
    ourResult: { contribution: number, total: number },
    officialResult: OfficialCalculatorResult,
    year: number,
    tolerance: number = 1.0
  ): {
    matches: boolean
    differences: Array<{ field: string, our: number, official: number, diff: number }>
    summary: string
  } {
    const differences = []
    let matches = true
    
    // Note: FSS n'est pas encore extrait du site officiel
    // Pour l'instant, nous ne pouvons pas valider automatiquement
    return {
      matches: false,
      differences: [],
      summary: `❓ Validation FSS ${year} - Extraction depuis site officiel non implémentée`
    }
  }
}