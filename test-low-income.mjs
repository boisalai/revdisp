/**
 * Test avec un revenu plus faible pour valider le calcul réel
 */

import puppeteer from 'puppeteer'

async function testLowIncome() {
  console.log('🧪 Test validation avec revenu faible (30k$)')
  console.log('='.repeat(50))
  
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 60000
  })
  
  try {
    const page = await browser.newPage()
    
    console.log('📍 Navigation vers le site officiel...')
    await page.goto('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })
    
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
    
    console.log('📝 Remplissage avec revenu 30k$...')
    
    // Formulaire
    await page.select('#Situation', 'Personne vivant seule')
    await page.select('#NbEnfants', 'Aucun enfant')
    
    // Âge
    await page.focus('#AgeAdulte1')
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.type('#AgeAdulte1', '35')
    
    // Revenu plus faible : 30k$
    await page.focus('#Revenu1')
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.type('#Revenu1', '30000')
    
    console.log('⏳ Attente des calculs automatiques...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Extraire les résultats
    const ae2024 = await page.$eval('#CA_ae_old', el => el.value || el.textContent || '').catch(() => 'N/A')
    const ae2025 = await page.$eval('#CA_ae_new', el => el.value || el.textContent || '').catch(() => 'N/A')
    
    console.log('📊 Résultats du site officiel (30k$):')
    console.log(`   AE 2024: ${ae2024}`)
    console.log(`   AE 2025: ${ae2025}`)
    
    // Calcul attendu pour 30k$
    const expected2024 = (30000 * 0.0132).toFixed(2) // 396.00
    const expected2025 = (30000 * 0.0131).toFixed(2) // 393.00
    
    console.log('🔢 Notre calcul attendu (30k$):')
    console.log(`   AE 2024: ${expected2024}$ (30000 * 1.32%)`)
    console.log(`   AE 2025: ${expected2025}$ (30000 * 1.31%)`)
    
    // Comparaison
    const site2024 = Math.abs(parseFloat(ae2024) || 0)
    const site2025 = Math.abs(parseFloat(ae2025) || 0)
    
    const diff2024 = Math.abs(site2024 - parseFloat(expected2024))
    const diff2025 = Math.abs(site2025 - parseFloat(expected2025))
    
    console.log('🔍 Comparaison:')
    console.log(`   2024: site=${site2024}$, attendu=${expected2024}$, écart=${diff2024.toFixed(2)}$`)
    console.log(`   2025: site=${site2025}$, attendu=${expected2025}$, écart=${diff2025.toFixed(2)}$`)
    
    if (diff2024 <= 1 && diff2025 <= 1) {
      console.log('\n🎉 VALIDATION RÉUSSIE! Notre calcul correspond au site officiel.')
    } else {
      console.log('\n⚠️  Écarts détectés - vérification nécessaire.')
    }
    
    // Maintenant test avec le seuil maximum
    console.log('\n' + '='.repeat(50))
    console.log('🧪 Test avec revenu au seuil maximum (63200$ pour 2024)')
    
    // Changer le revenu pour le maximum 2024
    await page.focus('#Revenu1')
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.type('#Revenu1', '63200')
    
    console.log('⏳ Recalcul...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const aeMax2024 = await page.$eval('#CA_ae_old', el => el.value || el.textContent || '').catch(() => 'N/A')
    const aeMax2025 = await page.$eval('#CA_ae_new', el => el.value || el.textContent || '').catch(() => 'N/A')
    
    console.log('📊 Résultats au maximum (63200$):')
    console.log(`   AE 2024: ${aeMax2024}`)
    console.log(`   AE 2025: ${aeMax2025}`)
    
    // Maximum officiel 2024
    const maxExpected2024 = (63200 * 0.0132).toFixed(2) // 834.24
    const maxExpected2025 = (63200 * 0.0131).toFixed(2) // 827.92
    
    console.log('🔢 Maximum attendu:')
    console.log(`   2024: ${maxExpected2024}$ (maximum pour 63200$)`)
    console.log(`   2025: ${maxExpected2025}$ (63200$ * 1.31%)`)
    
    console.log('\n✅ Test terminé! Fermeture automatique dans 5 secondes...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await browser.close()
  }
}

testLowIncome()