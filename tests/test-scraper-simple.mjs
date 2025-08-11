/**
 * Test simple du scraper - Version ES Module pure
 */

import puppeteer from 'puppeteer'

async function quickTest() {
  console.log('🧪 Test rapide du scraper')
  console.log('='.repeat(50))
  
  const browser = await puppeteer.launch({
    headless: false, // Mode visible
    timeout: 60000
  })
  
  try {
    const page = await browser.newPage()
    
    console.log('📍 Navigation vers le site officiel...')
    await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })
    
    // Attendre le chargement
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Gestion des cookies
    try {
      const acceptButton = await page.$('#acceptButton')
      if (acceptButton) {
        console.log('🍪 Acceptation des cookies...')
        await acceptButton.click()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.log('ℹ️  Pas de banner de cookies')
    }
    
    console.log('📝 Test de remplissage du formulaire...')
    
    // Test des sélecteurs principaux
    await page.select('#Situation', 'Personne vivant seule')
    await page.select('#NbEnfants', 'Aucun enfant')
    
    // Remplir les champs de base - en effaçant d'abord le contenu
    await page.click('#AgeAdulte1', { clickCount: 3 })
    await page.keyboard.press('Delete')
    await page.type('#AgeAdulte1', '35')
    
    await page.click('#Revenu1', { clickCount: 3 })
    await page.keyboard.press('Delete')
    await page.type('#Revenu1', '50000')
    
    console.log('⏳ Attente des calculs automatiques...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Extraire les résultats AE
    const ae2024 = await page.$eval('#CA_ae_old', el => el.value || el.textContent || '').catch(() => 'N/A')
    const ae2025 = await page.$eval('#CA_ae_new', el => el.value || el.textContent || '').catch(() => 'N/A')
    
    console.log('📊 Résultats extraits:')
    console.log(`   AE 2024: ${ae2024}`)
    console.log(`   AE 2025: ${ae2025}`)
    
    // Calcul attendu : 50000 * 1.32% = 660$ et 50000 * 1.31% = 655$
    console.log('🔢 Calcul attendu:')
    console.log('   AE 2024: 660.00$ (50000 * 1.32%)')
    console.log('   AE 2025: 655.00$ (50000 * 1.31%)')
    
    // Pause pour observer
    console.log('⏸️  Scraper en pause pour observation...')
    console.log('   Appuyez sur Entrée pour continuer')
    
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    
    await new Promise((resolve) => {
      process.stdin.on('data', (key) => {
        if (key === '\r' || key === '\n' || key === '\u0003') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          resolve()
        }
      })
    })
    
    console.log('✅ Test terminé!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await browser.close()
  }
}

quickTest()