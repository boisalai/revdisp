#!/usr/bin/env python
"""
Analyser la structure correcte de la page MFQ
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def analyze():
    chrome_options = Options()
    # Mode visible pour voir ce qui se passe
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("🔍 ANALYSE DU CALCULATEUR MFQ OFFICIEL")
        print("=" * 60)
        
        # Naviguer vers la bonne URL
        url = "https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp"
        print(f"URL: {url}\n")
        driver.get(url)
        
        # Attendre que la page se charge
        time.sleep(3)
        
        # Accepter les cookies si nécessaire
        try:
            cookie_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Accepter')]")
            if cookie_buttons:
                cookie_buttons[0].click()
                print("✅ Cookies acceptés\n")
        except:
            pass
            
        # Attendre que le formulaire soit présent
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "Situation"))
        )
        
        print("📋 ANALYSE DU SELECT 'Situation':")
        print("-" * 40)
        
        # Analyser les options du select
        situation_select = Select(driver.find_element(By.ID, "Situation"))
        for option in situation_select.options:
            value = option.get_attribute('value')
            text = option.text
            print(f"   Value: '{value}' => Text: '{text}'")
            
        print("\n📋 CHAMPS DU FORMULAIRE TROUVÉS:")
        print("-" * 40)
        
        # Vérifier tous les champs
        fields = [
            "Situation", "Revenu1", "AgeAdulte1", 
            "Revenu2", "AgeAdulte2", "NbEnfants",
            "RevenuRetraite1", "RevenuRetraite2"
        ]
        
        for field_id in fields:
            try:
                element = driver.find_element(By.ID, field_id)
                print(f"✅ #{field_id} - Trouvé")
            except:
                print(f"❌ #{field_id} - Non trouvé")
                
        # Tester avec un cas simple
        print("\n🧪 TEST AVEC PERSONNE SEULE 30000$:")
        print("-" * 40)
        
        # Remplir le formulaire
        situation_select.select_by_visible_text("Personne vivant seule")
        
        revenu1 = driver.find_element(By.ID, "Revenu1")
        revenu1.clear()
        revenu1.send_keys("30000")
        
        age1 = driver.find_element(By.ID, "AgeAdulte1")
        age1.clear()
        age1.send_keys("35")
        
        # Attendre les résultats
        time.sleep(3)
        
        print("\n📊 IDs DES RÉSULTATS DISPONIBLES (2024):")
        print("-" * 40)
        
        # Vérifier quels IDs existent pour les résultats
        result_ids = [
            "RD_old", "QC_total_old", "CA_total_old",
            "Cotisation_old", "CA_ae_old", "CA_rrq_old",
            "QC_rqap_old", "QC_sol_old", "CA_tps_old"
        ]
        
        for result_id in result_ids:
            try:
                element = driver.find_element(By.ID, result_id)
                value = element.text.strip()
                print(f"✅ #{result_id}: {value}")
            except:
                print(f"❌ #{result_id}: Non trouvé")
                
        input("\n⏸️ Appuyez sur Entrée pour fermer le navigateur...")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        input("\n⏸️ Appuyez sur Entrée pour fermer...")
    finally:
        driver.quit()

if __name__ == "__main__":
    analyze()