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
    
    // Gérer la popup de cookies si elle apparaît
    try {
      // Attendre un court délai pour que la popup apparaisse
      await this.delay(2000)
      
      // Essayer de trouver et cliquer sur le bouton avec XPath (méthode la plus fiable)
      try {
        const acceptButtons = await (page as any).$x("//button[contains(text(), 'Accepter les témoins')]")
        if (acceptButtons.length > 0) {
          console.log('🍪 Bouton "Accepter les témoins" trouvé via XPath, clic...')
          await acceptButtons[0].click()
          await this.delay(1000)
        } else {
          // Essayer avec juste "Accepter"
          const acceptAnyButtons = await (page as any).$x("//button[contains(text(), 'Accepter')]")
          if (acceptAnyButtons.length > 0) {
            console.log('🍪 Bouton "Accepter" trouvé via XPath, clic...')
            await acceptAnyButtons[0].click()
            await this.delay(1000)
          }
        }
      } catch (xpathError) {
        console.log('ℹ️  XPath pour cookies échoué, essayons les sélecteurs CSS...')
        
        // Essayer avec des sélecteurs CSS pour des classes communes de cookies
        const cookieSelectors = [
          'button[class*="cookie"]',
          '.cookie-consent button',
          '.cookie-banner button',
          '[data-cookie-consent] button',
          'button[aria-label*="cookie"]'
        ]
        
        for (const selector of cookieSelectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              console.log(`🍪 Bouton cookies trouvé via sélecteur: ${selector}`)
              await element.click()
              await this.delay(1000)
              break
            }
          } catch {
            // Continuer avec le prochain sélecteur
          }
        }
      }
    } catch (error) {
      console.log('ℹ️  Gestion des cookies terminée')
    }
    
    // Attendre les éléments clés du formulaire
    await page.waitForSelector('#Situation', { timeout: this.options.timeout })
    await page.waitForSelector('#Revenu1', { timeout: this.options.timeout })
    
    // Attendre que JavaScript ait fini de s'initialiser
    await this.delay(2000)
  }
  
  /**
   * Remplit le formulaire avec les données du ménage
   */
  private async fillForm(page: Page, household: Household, taxYear: number): Promise<void> {
    console.log('📝 Remplissage du formulaire...')
    console.log('🔍 DEBUG - Données du ménage reçues:')
    console.log(`  - Type: ${household.householdType}`)
    console.log(`  - Personne principale: âge ${household.primaryPerson.age}, revenus travail ${household.primaryPerson.grossWorkIncome}, revenus retraite ${household.primaryPerson.grossRetirementIncome}`)
    if (household.spouse) {
      console.log(`  - Conjoint: âge ${household.spouse.age}, revenus travail ${household.spouse.grossWorkIncome}, revenus retraite ${household.spouse.grossRetirementIncome}`)
    }
    console.log(`  - Enfants: ${household.numChildren}`)
    
    // 1. Situation familiale
    const situationFamiliale = this.mapHouseholdTypeToOfficial(household.householdType)
    await page.select('#Situation', situationFamiliale)
    await this.delay(this.options.delayBetweenActions)
    
    // 2. Remplir le revenu personne principale (VRAIE INTERACTION UTILISATEUR)
    const revenus = household.primaryPerson.isRetired 
      ? household.primaryPerson.grossRetirementIncome
      : household.primaryPerson.grossWorkIncome
    
    await page.click('#Revenu1')  // Clic pour focus
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')  // Sélectionner tout
    await page.keyboard.up('Control')
    await page.type('#Revenu1', revenus.toString())  // Saisir nouvelle valeur
    await page.keyboard.press('Tab')  // Perdre le focus -> déclenche onchange
    await this.delay(500)  // Laisser le temps au recalcul
    
    // 3. Âge personne principale (VRAIE INTERACTION UTILISATEUR)
    await page.click('#AgeAdulte1')  // Clic pour focus
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')  // Sélectionner tout
    await page.keyboard.up('Control')
    await page.type('#AgeAdulte1', household.primaryPerson.age.toString())  // Saisir nouvelle valeur
    await page.keyboard.press('Tab')  // Perdre le focus -> déclenche onchange
    await this.delay(500)  // Laisser le temps au recalcul
    
    // 4. Conjoint (si applicable)
    if (household.spouse) {
      // Revenu conjoint (VRAIE INTERACTION UTILISATEUR)
      const revenusConjoint = household.spouse.isRetired 
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
        
      await page.click('#Revenu2')  // Clic pour focus
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')  // Sélectionner tout
      await page.keyboard.up('Control')
      await page.type('#Revenu2', revenusConjoint.toString())  // Saisir nouvelle valeur
      await page.keyboard.press('Tab')  // Perdre le focus -> déclenche onchange
      await this.delay(500)  // Laisser le temps au recalcul
      
      // Âge conjoint (VRAIE INTERACTION UTILISATEUR)
      await page.click('#AgeAdulte2')  // Clic pour focus
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')  // Sélectionner tout
      await page.keyboard.up('Control')
      await page.type('#AgeAdulte2', household.spouse.age.toString())  // Saisir nouvelle valeur
      await page.keyboard.press('Tab')  // Perdre le focus -> déclenche onchange
      await this.delay(500)  // Laisser le temps au recalcul
    }
    
    // 5. Nombre d'enfants (select déclenche automatiquement onchange)
    if (household.numChildren > 0) {
      await page.select('#NbEnfants', household.numChildren.toString())
      await this.delay(500)  // Laisser le temps au recalcul après select
      
      // TODO: Ajouter la gestion des détails d'enfants si nécessaire
    }
    
    // Laisser un délai final pour que tous les calculs se stabilisent
    await this.delay(1000)
    
    console.log('✅ Formulaire rempli avec succès')
  }
  
  /**
   * Attend que les calculs automatiques se terminent
   */
  private async submitForm(page: Page): Promise<void> {
    console.log('🚀 Attente des calculs automatiques...')
    
    // Le calcul semble se faire automatiquement, attendre que les résultats se stabilisent
    await this.delay(3000) 
    
    // Vérifier que le revenu disponible est présent et non vide
    await page.waitForFunction(() => {
      const rdNew = document.querySelector('#RD_new') as HTMLInputElement
      return rdNew && rdNew.value && rdNew.value.trim() !== '' && rdNew.value !== '0'
    }, { timeout: this.options.timeout })
    
    console.log('✅ Calculs terminés')
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
      // Extraire le revenu disponible final (année nouvelle - 2025)
      results.revenu_disponible = await this.extractNumericValue(page, '#RD_new')
      
      // Extraire les cotisations
      results.assurance_emploi_total = await this.extractNumericValue(page, '#CA_ae_new')
      results.rrq_total = await this.extractNumericValue(page, '#CA_rrq_new')
      results.rqap_total = await this.extractNumericValue(page, '#QC_rqap_new')
      
      // Extraire les programmes québécois (sélecteurs corrigés)
      const qc_impot = await this.extractNumericValue(page, '#QC_total_new')  // Régime fiscal QC
      const qc_solidarite = await this.extractNumericValue(page, '#QC_sol_new')
      const qc_allocation_logement = await this.extractNumericValue(page, '#QC_al_new')
      const qc_prime_travail = await this.extractNumericValue(page, '#QC_pt_new')
      const qc_aines = await this.extractNumericValue(page, '#QC_aines_new')
      const qc_garde = await this.extractNumericValue(page, '#QC_garde_new')
      
      // Extraire les programmes fédéraux (sélecteurs corrigés)
      const ca_impot = await this.extractNumericValue(page, '#CA_total_new')  // Régime fiscal fédéral
      const ca_ace = await this.extractNumericValue(page, '#CA_ace_new')
      const ca_tps = await this.extractNumericValue(page, '#CA_tps_new')
      const ca_psv = await this.extractNumericValue(page, '#CA_psv_new')
      const ca_pfrt = await this.extractNumericValue(page, '#CA_pfrt_new')  // Prime fédérale travail ⭐
      
      // Autres
      const ramq = await this.extractNumericValue(page, '#QC_ramq_new')
      const fss = await this.extractNumericValue(page, '#QC_fss_new')
      
      console.log('✅ Résultats extraits:', {
        revenu_disponible: results.revenu_disponible,
        ae_total: results.assurance_emploi_total,
        rrq_total: results.rrq_total,
        rqap_total: results.rqap_total,
        qc_impot,
        ca_impot,
        qc_solidarite,
        ca_tps,
        ca_pfrt,  // ⭐ Programme ajouté
        qc_prime_travail,
        ramq
      })
      
      // Stocker tous les résultats pour validation future
      Object.assign(results, {
        qc_impot,
        ca_impot,
        qc_solidarite,
        ca_tps,
        ca_pfrt,  // ⭐ Programme fédéral manquant ajouté
        ramq,
        fss,
        qc_allocation_logement,
        qc_prime_travail,
        qc_aines,
        qc_garde,
        ca_ace,
        ca_psv
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
      
      const text = await page.evaluate(el => {
        if (el.tagName === 'INPUT') {
          return (el as HTMLInputElement).value || ''
        }
        return el.textContent || ''
      }, element)
      
      // Vérifier si c'est un tiret (pas de valeur)
      if (text.includes('―') || text.includes('—') || text.trim() === '―' || text.trim() === '') {
        return undefined
      }
      
      // Nettoyer le texte: enlever espaces, garder chiffres, points, tirets et virgules
      const cleanText = text.replace(/\s+/g, '').replace(/[^0-9.,-]/g, '')
      
      // Convertir en nombre
      const numericValue = parseFloat(cleanText.replace(/,/g, '.'))
      
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
      [HouseholdType.SINGLE]: 'Personne vivant seule',
      [HouseholdType.SINGLE_PARENT]: 'Famille monoparentale',
      [HouseholdType.COUPLE]: 'Couple',
      [HouseholdType.RETIRED_SINGLE]: 'Retraité vivant seul',
      [HouseholdType.RETIRED_COUPLE]: 'Couple de retraités'
    }
    
    return mapping[householdType] || 'Personne vivant seule'
  }
  
  /**
   * Prend une capture d'écran pour debug
   */
  private async takeDebugScreenshot(page: Page, name: string): Promise<void> {
    try {
      const filename = `validation-reports/debug-${name}-${Date.now()}.png` as const
      await page.screenshot({ 
        path: filename,
        fullPage: true
      })
      console.log(`📸 Capture d'écran sauvée: ${filename}`)
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