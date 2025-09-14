#!/usr/bin/env python
"""
Script pour prendre une capture d'écran du calculateur MFQ
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import sys
import json

def take_mfq_screenshot(household_data, screenshot_path="mfq_calculator_screenshot.png"):
    """Prend une capture d'écran du calculateur MFQ avec les données remplies"""
    
    # Configuration Chrome
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1280,1024')
    # Ne pas utiliser headless pour la capture d'écran
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    
    try:
        # Naviguer vers le calculateur
        driver.get("https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp")
        time.sleep(3)
        
        # Accepter les cookies
        try:
            cookie_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accepter')]"))
            )
            cookie_btn.click()
            time.sleep(1)
        except:
            pass
            
        # Attendre que le formulaire soit chargé
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "Situation"))
        )
        
        # Remplir le formulaire
        fill_form(driver, household_data)
        
        # Attendre les résultats
        time.sleep(4)
        
        # Faire défiler vers le haut pour voir tout
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        # Prendre la capture d'écran
        driver.save_screenshot(screenshot_path)
        print(f"Capture d'écran sauvegardée: {screenshot_path}")
        
        return True
        
    except Exception as e:
        print(f"Erreur: {e}")
        return False
        
    finally:
        driver.quit()

def fill_form(driver, household):
    """Remplit le formulaire avec les données du ménage"""
    
    # Déterminer le type de ménage
    person1 = household['primaryPerson']
    is_retired1 = person1.get('isRetired', False)
    has_spouse = household.get('spouse') is not None
    has_children = household.get('numChildren', 0) > 0
    
    # Sélectionner le bon type de ménage
    situation = Select(driver.find_element(By.ID, "Situation"))
    
    if has_spouse:
        # Couple
        person2 = household['spouse']
        is_retired2 = person2.get('isRetired', False)
        if is_retired1 and is_retired2:
            situation.select_by_visible_text("Couple de retraités")
        else:
            situation.select_by_visible_text("Couple")
    else:
        # Personne seule
        if is_retired1:
            situation.select_by_visible_text("Retraité vivant seul")
        elif has_children:
            situation.select_by_visible_text("Famille monoparentale")
        else:
            situation.select_by_visible_text("Personne vivant seule")
        
    # Revenus et âge personne principale
    work_income1 = int(person1.get('grossWorkIncome', 0))
    retirement_income1 = int(person1.get('grossRetirementIncome', 0))
    age1 = person1['age']
    
    # Déterminer quel revenu utiliser
    if is_retired1:
        income_to_use1 = retirement_income1
    else:
        income_to_use1 = work_income1
    
    # Remplir revenu personne 1 - Méthode JavaScript pour garantir le vidage
    revenu1 = driver.find_element(By.ID, "Revenu1")
    driver.execute_script("arguments[0].value = '';", revenu1)
    time.sleep(0.5)
    revenu1.send_keys(str(income_to_use1))
    time.sleep(0.5)
    
    # Remplir âge personne 1 - Méthode JavaScript pour garantir le vidage  
    age_field1 = driver.find_element(By.ID, "AgeAdulte1")
    driver.execute_script("arguments[0].value = '';", age_field1)
    time.sleep(0.5)
    age_field1.send_keys(str(age1))
    time.sleep(0.5)
    
    # Nombre d'enfants
    nb_enfants = Select(driver.find_element(By.ID, "NbEnfants"))
    num_children = household.get('numChildren', 0)
    if num_children == 0:
        nb_enfants.select_by_visible_text("Aucun enfant")
    else:
        nb_enfants.select_by_visible_text(str(num_children))

if __name__ == "__main__":
    # Données de test
    test_data = {
        "householdType": "single",
        "primaryPerson": {
            "age": 35,
            "grossWorkIncome": 50000,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "spouse": None,
        "numChildren": 0,
        "children": [],
        "taxYear": 2024
    }
    
    screenshot_path = "mfq_calculator_50k_single.png"
    success = take_mfq_screenshot(test_data, screenshot_path)
    
    if success:
        print("✅ Capture d'écran créée avec succès")
    else:
        print("❌ Erreur lors de la capture d'écran")