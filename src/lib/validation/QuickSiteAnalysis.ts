/**
 * Analyse rapide du calculateur officiel
 * Version automatisée pour CI/CD
 */

import puppeteer from 'puppeteer'

export class QuickSiteAnalysis {
  
  static async analyze(): Promise<any> {
    console.log('🔍 Analyse rapide du calculateur officiel...')
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    try {
      const page = await browser.newPage()
      
      // Navigation avec timeout court
      await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })
      
      // Attendre un peu pour le JavaScript
      await this.delay(2000)
      
      // Analyser la structure
      const analysis = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          selects: Array.from(document.querySelectorAll('select')).map(select => ({
            id: select.id,
            name: select.name,
            options: Array.from(select.options).map(opt => ({
              value: opt.value,
              text: opt.text.trim()
            })).filter(opt => opt.value || opt.text)
          })),
          inputs: Array.from(document.querySelectorAll('input[type="text"], input[type="number"]')).map(input => ({
            id: input.id,
            name: (input as HTMLInputElement).name,
            type: (input as HTMLInputElement).type,
            placeholder: (input as HTMLInputElement).placeholder
          })),
          buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(btn => ({
            id: btn.id,
            name: (btn as HTMLButtonElement).name,
            text: btn.textContent || (btn as HTMLInputElement).value,
            type: (btn as HTMLButtonElement).type
          }))
        }
      })
      
      return analysis
      
    } finally {
      await browser.close()
    }
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Runner pour analyse rapide
if (require.main === module) {
  (async () => {
    try {
      const analysis = await QuickSiteAnalysis.analyze()
      console.log('\n📊 ANALYSE DU SITE:')
      console.log('='.repeat(40))
      console.log(`Titre: ${analysis.title}`)
      console.log(`Sélecteurs: ${analysis.selects.length}`)
      console.log(`Inputs: ${analysis.inputs.length}`)
      console.log(`Boutons: ${analysis.buttons.length}`)
      
      if (analysis.selects.length > 0) {
        console.log('\n📋 SÉLECTEURS:')
        analysis.selects.forEach((select: any) => {
          if (select.id || select.name) {
            console.log(`  ${select.id || select.name}:`)
            select.options.slice(0, 5).forEach((opt: any) => {
              console.log(`    - "${opt.value}" = "${opt.text}"`)
            })
            if (select.options.length > 5) {
              console.log(`    ... et ${select.options.length - 5} autres`)
            }
          }
        })
      }
      
      // Sauvegarder pour référence
      const fs = require('fs')
      fs.writeFileSync('quick-site-analysis.json', JSON.stringify(analysis, null, 2))
      console.log('\n💾 Analyse sauvée: quick-site-analysis.json')
      
    } catch (error) {
      console.error('❌ Erreur:', error)
      process.exit(1)
    }
  })()
}