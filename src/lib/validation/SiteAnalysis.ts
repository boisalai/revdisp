/**
 * Script d'analyse du calculateur officiel du ministère des Finances
 * 
 * Explore la structure du site pour identifier les sélecteurs CSS 
 * et la logique nécessaire au scraping
 */

import puppeteer from 'puppeteer'

export class OfficialSiteAnalysis {
  
  /**
   * Analyse la structure du calculateur officiel
   */
  static async analyzeSite(): Promise<void> {
    console.log('🔍 Analyse du calculateur officiel du ministère des Finances...')
    
    const browser = await puppeteer.launch({ 
      headless: false, // Mode visible pour observer
      devtools: true   // Ouvrir les outils de développement
    })
    
    try {
      const page = await browser.newPage()
      
      // Navigation vers le calculateur
      console.log('📍 Navigation vers:', 'https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp')
      await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
        waitUntil: 'networkidle2'
      })
      
      // Attendre le chargement
      await this.delay(3000)
      
      console.log('🔍 Analyse de la structure du formulaire...')
      
      // Analyser les éléments du formulaire
      const formAnalysis = await page.evaluate(() => {
        const analysis = {
          title: document.title,
          url: window.location.href,
          forms: [] as any[],
          selects: [] as any[],
          inputs: [] as any[],
          buttons: [] as any[],
          scripts: [] as any[]
        }
        
        // Analyser les formulaires
        document.querySelectorAll('form').forEach((form, i) => {
          analysis.forms.push({
            index: i,
            id: form.id,
            name: form.name,
            action: form.action,
            method: form.method,
            elements: form.elements.length
          })
        })
        
        // Analyser les sélecteurs
        document.querySelectorAll('select').forEach((select, i) => {
          const options = Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.text
          }))
          
          analysis.selects.push({
            index: i,
            id: select.id,
            name: select.name,
            className: select.className,
            options: options
          })
        })
        
        // Analyser les inputs
        document.querySelectorAll('input').forEach((input, i) => {
          analysis.inputs.push({
            index: i,
            id: input.id,
            name: input.name,
            type: input.type,
            className: input.className,
            placeholder: input.placeholder,
            value: input.value
          })
        })
        
        // Analyser les boutons
        document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach((btn, i) => {
          analysis.buttons.push({
            index: i,
            id: btn.id,
            name: (btn as HTMLButtonElement).name,
            className: btn.className,
            text: btn.textContent || (btn as HTMLInputElement).value,
            type: (btn as HTMLButtonElement).type
          })
        })
        
        // Analyser les scripts
        document.querySelectorAll('script').forEach((script, i) => {
          if (script.src) {
            analysis.scripts.push({
              index: i,
              src: script.src,
              type: 'external'
            })
          } else if (script.textContent && script.textContent.trim()) {
            analysis.scripts.push({
              index: i,
              type: 'inline',
              length: script.textContent.length,
              preview: script.textContent.substring(0, 100) + '...'
            })
          }
        })
        
        return analysis
      })
      
      // Afficher l'analyse
      console.log('\n📊 RÉSULTATS DE L\'ANALYSE:')
      console.log('='.repeat(50))
      console.log(`Titre: ${formAnalysis.title}`)
      console.log(`URL: ${formAnalysis.url}`)
      console.log(`Formulaires trouvés: ${formAnalysis.forms.length}`)
      console.log(`Sélecteurs: ${formAnalysis.selects.length}`)
      console.log(`Champs input: ${formAnalysis.inputs.length}`)
      console.log(`Boutons: ${formAnalysis.buttons.length}`)
      console.log(`Scripts: ${formAnalysis.scripts.length}`)
      
      // Détails des sélecteurs (important pour notre mapping)
      if (formAnalysis.selects.length > 0) {
        console.log('\n🎯 SÉLECTEURS IDENTIFIÉS:')
        formAnalysis.selects.forEach((select: any) => {
          console.log(`  - ID: ${select.id}, Name: ${select.name}`)
          console.log(`    Options: ${select.options.map((opt: any) => `"${opt.value}"`).join(', ')}`)
        })
      }
      
      // Détails des inputs
      if (formAnalysis.inputs.length > 0) {
        console.log('\n📝 CHAMPS INPUT:')
        formAnalysis.inputs.forEach(input => {
          if (input.type !== 'hidden') {
            console.log(`  - ID: ${input.id}, Name: ${input.name}, Type: ${input.type}`)
          }
        })
      }
      
      // Détails des boutons
      if (formAnalysis.buttons.length > 0) {
        console.log('\n🔘 BOUTONS:')
        formAnalysis.buttons.forEach(btn => {
          console.log(`  - ID: ${btn.id}, Text: "${btn.text}", Type: ${btn.type}`)
        })
      }
      
      // Sauvegarder l'analyse complète
      const fs = require('fs')
      fs.writeFileSync(`site-analysis-${Date.now()}.json`, JSON.stringify(formAnalysis, null, 2))
      console.log('\n💾 Analyse complète sauvegardée dans site-analysis-*.json')
      
      console.log('\n⏳ Navigateur ouvert pour inspection manuelle...')
      console.log('   Appuyez sur Entrée pour fermer quand vous avez terminé.')
      
      // Attendre l'input utilisateur
      await this.waitForUserInput()
      
    } finally {
      await browser.close()
    }
  }
  
  /**
   * Test d'interaction basique avec le formulaire
   */
  static async testBasicInteraction(): Promise<void> {
    console.log('🧪 Test d\'interaction basique avec le calculateur...')
    
    const browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 1000 // Ralentir pour observation
    })
    
    try {
      const page = await browser.newPage()
      
      // Navigation
      await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
        waitUntil: 'networkidle2'
      })
      
      console.log('📝 Test de remplissage de formulaire...')
      
      // Attendre le chargement complet
      await this.delay(3000)
      
      // Essayer de remplir quelques champs de test
      try {
        // Test avec des sélecteurs communs possibles
        const possibleSelectors = [
          '#annee', '#annee_fiscale', 'select[name*="annee"]',
          '#situation', '#situation_familiale', 'select[name*="situation"]',
          '#revenu', '#revenu_travail', 'input[name*="revenu"]'
        ]
        
        for (const selector of possibleSelectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              console.log(`✅ Sélecteur trouvé: ${selector}`)
              
              // Si c'est un select, lister les options
              if (selector.includes('select') || (await element.evaluate(el => el.tagName)) === 'SELECT') {
                const options = await element.evaluate(select => 
                  Array.from((select as HTMLSelectElement).options).map(opt => ({ value: opt.value, text: opt.text }))
                )
                console.log(`   Options: ${JSON.stringify(options)}`)
              }
            }
          } catch (e) {
            // Sélecteur non trouvé, continuer
          }
        }
        
        console.log('\n⏳ Observez le formulaire et testez manuellement...')
        console.log('   Appuyez sur Entrée quand vous avez terminé.')
        
        await this.waitForUserInput()
        
      } catch (error) {
        console.error('❌ Erreur lors du test:', error)
      }
      
    } finally {
      await browser.close()
    }
  }
  
  /**
   * Délai utilitaire
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Attend l'input de l'utilisateur
   */
  private static waitForUserInput(): Promise<void> {
    return new Promise((resolve) => {
      const stdin = process.stdin
      stdin.setRawMode(true)
      stdin.resume()
      stdin.setEncoding('utf8')
      
      stdin.on('data', (key) => {
        if (key.toString() === '\r' || key.toString() === '\n' || key.toString() === '\u0003') { // Enter ou Ctrl+C
          stdin.setRawMode(false)
          stdin.pause()
          resolve()
        }
      })
    })
  }
}

// Runner CLI
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2)
    
    if (args.includes('--analyze')) {
      await OfficialSiteAnalysis.analyzeSite()
    } else if (args.includes('--test')) {
      await OfficialSiteAnalysis.testBasicInteraction()
    } else {
      console.log('🔍 Analyseur du calculateur officiel')
      console.log('================================')
      console.log('')
      console.log('Usage:')
      console.log('  --analyze  : Analyse complète de la structure du site')
      console.log('  --test     : Test d\'interaction basique')
      console.log('')
      console.log('Exemples:')
      console.log('  npx tsx src/lib/validation/SiteAnalysis.ts --analyze')
      console.log('  npx tsx src/lib/validation/SiteAnalysis.ts --test')
    }
  })()
}