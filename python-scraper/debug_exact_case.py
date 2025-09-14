#!/usr/bin/env python
"""
Debug du cas exact : personne seule, 44 ans, 24068$ de revenu
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
import time

def debug_exact_case():
    """Test avec le cas exact de la capture d'écran"""
    
    chrome_options = Options()
    # Mode visible pour voir ce qui se passe
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("🔍 TEST CAS EXACT: Personne seule, 44 ans, 24068$")
        print("=" * 60)
        
        # Naviguer vers le calculateur
        driver.get("https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp")
        time.sleep(3)
        
        # Accepter cookies si nécessaire
        try:
            cookie_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Accepter')]")
            cookie_btn.click()
            time.sleep(1)
        except:
            pass
            
        print("📝 Remplissage du formulaire...")
        
        # Sélectionner "Personne vivant seule"
        situation = Select(driver.find_element(By.ID, "Situation"))
        situation.select_by_visible_text("Personne vivant seule")
        time.sleep(0.5)
        
        # Entrer le revenu
        revenu1 = driver.find_element(By.ID, "Revenu1")
        revenu1.clear()
        time.sleep(0.5)
        revenu1.send_keys("24068")
        
        # Entrer l'âge
        age1 = driver.find_element(By.ID, "AgeAdulte1")
        age1.clear()
        time.sleep(0.5)
        age1.send_keys("44")
        
        print("⏳ Attente des résultats...")
        time.sleep(5)
        
        print("\n📊 EXTRACTION DES RÉSULTATS 2024:")
        print("-" * 60)
        
        # Extraire les valeurs principales
        results_to_check = {
            "Revenu disponible": "RD_old",
            "Régime fiscal QC": "QC_total_old",
            "Impôt QC": "QC_impot_old",
            "Prime au travail": "QC_pt_old",
            "Crédit solidarité": "QC_sol_old",
            "Régime fiscal fédéral": "CA_total_old",
            "Impôt fédéral": "CA_impot_old",
            "Crédit TPS": "CA_tps_old",
            "ACT": "CA_pfrt_old",
            "Cotisations": "Cotisation_old",
            "AE": "CA_ae_old",
            "RQAP": "QC_rqap_old",
            "RRQ": "CA_rrq_old",
            "RAMQ": "QC_ramq_old"
        }
        
        for name, element_id in results_to_check.items():
            try:
                element = driver.find_element(By.ID, element_id)
                # Les résultats sont dans des inputs
                value = element.get_attribute('value')
                print(f"{name:25} : {value:>10}")
            except Exception as e:
                print(f"{name:25} : ❌ Non trouvé")
                
        print("\n📋 VALEURS ATTENDUES (selon capture):")
        print("-" * 60)
        print(f"{'Revenu disponible':25} : {'24 685':>10}")
        print(f"{'Régime fiscal QC':25} : {'1 028':>10}")
        print(f"{'Impôt QC':25} : {'-330':>10}")
        print(f"{'Prime au travail':25} : {'138':>10}")
        print(f"{'Crédit solidarité':25} : {'1 221':>10}")
        print(f"{'Régime fiscal fédéral':25} : {'1 569':>10}")
        print(f"{'Impôt fédéral':25} : {'-648':>10}")
        print(f"{'Crédit TPS':25} : {'519':>10}")
        print(f"{'ACT':25} : {'1 699':>10}")
        print(f"{'Cotisations':25} : {'-1 981':>10}")
        print(f"{'AE':25} : {'-318':>10}")
        print(f"{'RQAP':25} : {'-119':>10}")
        print(f"{'RRQ':25} : {'-1 316':>10}")
        print(f"{'RAMQ':25} : {'-228':>10}")
        
        input("\n⏸️ Appuyez sur Entrée pour fermer le navigateur...")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        input("\n⏸️ Erreur - Entrée pour fermer...")
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_exact_case()