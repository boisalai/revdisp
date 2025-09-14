#!/usr/bin/env python
"""
Analyse de la structure HTML du calculateur MFQ pour créer un scraper unifié
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def analyze_mfq_structure():
    """Analyse la structure de la page MFQ"""
    
    # Configuration Chrome
    chrome_options = Options()
    chrome_options.add_argument('--window-size=1280,720')
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("🔍 ANALYSE DE LA STRUCTURE DU CALCULATEUR MFQ")
        print("=" * 60)
        
        # Naviguer vers le calculateur
        url = "https://www.budget.finances.gouv.qc.ca/budget/outils/revenu-disponible/"
        driver.get(url)
        time.sleep(3)
        
        # Accepter les cookies si nécessaire
        try:
            cookie_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Accepter')]")
            cookie_button.click()
            print("✅ Cookies acceptés")
        except:
            print("ℹ️  Pas de bannière de cookies")
        
        print("\n📋 STRUCTURE DES CHAMPS DU FORMULAIRE:")
        print("-" * 40)
        
        # Analyser les champs du formulaire
        fields = [
            ("Situation", "Situation familiale (select)"),
            ("Revenu1", "Revenu brut de travail personne 1"),
            ("AgeAdulte1", "Âge personne 1"),
            ("Revenu2", "Revenu brut de travail personne 2"),
            ("AgeAdulte2", "Âge personne 2"),
            ("NbEnfants", "Nombre d'enfants (select)"),
            ("RevenuRetraite1", "Revenu de retraite personne 1"),
            ("RevenuRetraite2", "Revenu de retraite personne 2")
        ]
        
        for field_id, description in fields:
            try:
                element = driver.find_element(By.ID, field_id)
                tag = element.tag_name
                field_type = element.get_attribute('type') if tag == 'input' else tag
                visible = element.is_displayed()
                print(f"✅ #{field_id}: {description}")
                print(f"   - Type: {field_type}, Visible: {visible}")
            except:
                print(f"❌ #{field_id}: Non trouvé")
        
        print("\n📊 STRUCTURE DES RÉSULTATS (2024):")
        print("-" * 40)
        
        # IDs des résultats pour 2024 (_old)
        result_ids = [
            ("RD_old", "Revenu disponible"),
            ("QC_total_old", "Régime fiscal du Québec (total net)"),
            ("QC_impot_old", "Impôt sur le revenu QC"),
            ("QC_sol_old", "Crédit pour la solidarité"),
            ("QC_pt_old", "Prime au travail"),
            ("QC_sae_old", "Allocation famille"),
            ("SFS_old", "Fournitures scolaires"),
            ("QC_garde_old", "Crédit garde d'enfants"),
            ("QC_al_old", "Allocation-logement"),
            ("QC_aines_old", "Soutien aux aînés"),
            ("QC_adr_old", "Aide sociale"),
            ("QC_medic_old", "Frais médicaux QC"),
            ("CA_total_old", "Régime fiscal fédéral (total net)"),
            ("CA_impot_old", "Impôt sur le revenu fédéral"),
            ("CA_ace_old", "Allocation canadienne pour enfants"),
            ("CA_tps_old", "Crédit pour la TPS"),
            ("CA_pfrt_old", "Allocation canadienne pour les travailleurs"),
            ("CA_psv_old", "Pension sécurité vieillesse"),
            ("CA_medic_old", "Frais médicaux fédéral"),
            ("Cotisation_old", "Cotisations totales"),
            ("CA_ae_old", "Assurance-emploi"),
            ("QC_rqap_old", "RQAP"),
            ("CA_rrq_old", "RRQ"),
            ("QC_fss_old", "FSS"),
            ("QC_ramq_old", "RAMQ"),
            ("Frais_garde_old", "Frais de garde")
        ]
        
        print("\n🎯 IDs À UTILISER POUR LE SCRAPER:")
        for result_id, description in result_ids:
            print(f"   '{result_id}': '{description}'")
        
        print("\n📝 NOTES IMPORTANTES:")
        print("-" * 40)
        print("1. Les valeurs négatives dans le tableau = montants à payer")
        print("2. Les valeurs positives = crédits/allocations reçus")
        print("3. QC_total et CA_total = régimes fiscaux NETS (après crédits)")
        print("4. Pour 2024: utiliser suffixe '_old'")
        print("5. Pour 2025: utiliser suffixe '_new'")
        
        print("\n🔄 OPTIONS DU SELECT 'Situation':")
        print("-" * 40)
        try:
            select_element = Select(driver.find_element(By.ID, "Situation"))
            for option in select_element.options:
                print(f"   - Value: '{option.get_attribute('value')}', Text: '{option.text}'")
        except Exception as e:
            print(f"❌ Erreur: {e}")
            
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()
    finally:
        input("\n⏸️  Appuyez sur Entrée pour fermer...")
        driver.quit()

if __name__ == "__main__":
    analyze_mfq_structure()