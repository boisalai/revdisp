#!/usr/bin/env python
"""
Debug l'extraction des résultats MFQ
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
import time

def debug_extraction():
    chrome_options = Options()
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Naviguer et remplir le formulaire
        driver.get("https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp")
        time.sleep(3)
        
        # Accepter cookies
        try:
            btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Accepter')]")
            btn.click()
        except:
            pass
            
        # Remplir formulaire couple
        situation = Select(driver.find_element(By.ID, "Situation"))
        situation.select_by_visible_text("Couple")
        
        driver.find_element(By.ID, "Revenu1").send_keys("53518")
        driver.find_element(By.ID, "AgeAdulte1").send_keys("19")
        driver.find_element(By.ID, "Revenu2").send_keys("0")
        driver.find_element(By.ID, "AgeAdulte2").send_keys("19")
        
        nb_enfants = Select(driver.find_element(By.ID, "NbEnfants"))
        nb_enfants.select_by_visible_text("Aucun enfant")
        
        # Attendre que les calculs se fassent
        print("⏳ Attente des résultats...")
        time.sleep(5)
        
        print("\n📊 EXTRACTION DES RÉSULTATS 2024:")
        print("=" * 60)
        
        # Essayer d'extraire tous les IDs possibles
        ids_to_check = [
            "RD_old", "QC_total_old", "CA_total_old", "Cotisation_old",
            "CA_ae_old", "CA_rrq_old", "QC_rqap_old", "QC_sol_old",
            "CA_tps_old", "QC_al_old", "QC_pt_old"
        ]
        
        for element_id in ids_to_check:
            try:
                element = driver.find_element(By.ID, element_id)
                # Essayer différentes propriétés
                text = element.text
                value = element.get_attribute('value')
                inner_text = element.get_attribute('innerText')
                inner_html = element.get_attribute('innerHTML')
                
                print(f"\n#{element_id}:")
                print(f"  .text: '{text}'")
                print(f"  .value: '{value}'")
                print(f"  .innerText: '{inner_text}'")
                print(f"  .innerHTML: '{inner_html}'")
                
                # Si c'est un input, obtenir la valeur
                if element.tag_name == 'input':
                    print(f"  Input value: '{element.get_attribute('value')}'")
                    
            except Exception as e:
                print(f"\n#{element_id}: ❌ Non trouvé ou erreur: {e}")
                
        print("\n🔍 Recherche par classe CSS:")
        print("-" * 40)
        
        # Chercher par classes
        classes_to_check = [
            ".revenu-disponible", ".resultat", ".total", 
            "td.montant", "span.montant"
        ]
        
        for css_class in classes_to_check:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, css_class)
                if elements:
                    print(f"\n{css_class}: {len(elements)} éléments trouvés")
                    for i, elem in enumerate(elements[:3]):  # Max 3
                        print(f"  [{i}] {elem.text}")
            except:
                pass
                
        input("\n⏸️ Appuyez sur Entrée pour fermer...")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        input("\n⏸️ Erreur - Entrée pour fermer...")
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_extraction()