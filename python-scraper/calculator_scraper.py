#!/usr/bin/env python3
"""
Scraper Python/Selenium pour le calculateur officiel du Québec
Remplace le scraper Puppeteer défaillant
"""

import json
import time
import sys
from typing import Dict, Any, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

class QuebecCalculatorScraper:
    def __init__(self, headless: bool = True, timeout: int = 30):
        self.timeout = timeout
        self.driver = None
        self.setup_driver(headless)
    
    def setup_driver(self, headless: bool):
        """Configure le driver Chrome avec les bonnes options"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1280,720')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
    
    def scrape_calculator(self, household_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scrape le calculateur officiel avec les données du ménage
        
        Args:
            household_data: {
                "householdType": "single" | "couple" | "single_parent" | "retired_single" | "retired_couple",
                "primaryPerson": {
                    "age": int,
                    "grossWorkIncome": int,
                    "grossRetirementIncome": int,
                    "isRetired": bool
                },
                "spouse": { ... } | null,
                "numChildren": int,
                "taxYear": int
            }
        """
        try:
            print(f"🔍 Scraping pour: {household_data.get('householdType', 'N/A')}")
            print(f"   Personne principale: {household_data['primaryPerson']['age']} ans")
            print(f"   Revenus: {household_data['primaryPerson'].get('grossWorkIncome', 0)}$ (travail)")
            print(f"   Revenus: {household_data['primaryPerson'].get('grossRetirementIncome', 0)}$ (retraite)")
            
            # Navigation vers le calculateur
            self.driver.get('https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp')
            
            # Gérer les cookies
            self._handle_cookies()
            
            # Attendre que le formulaire soit chargé
            WebDriverWait(self.driver, self.timeout).until(
                EC.presence_of_element_located((By.ID, "Situation"))
            )
            
            # Remplir le formulaire
            self._fill_form(household_data)
            
            # Attendre que les calculs se stabilisent
            time.sleep(3)
            
            # Extraire les résultats
            results = self._extract_results()
            
            print(f"✅ Résultats extraits: RD={results.get('revenu_disponible', 'N/A')}")
            return results
            
        except Exception as e:
            print(f"❌ Erreur lors du scraping: {e}")
            return {"error": str(e)}
    
    def _handle_cookies(self):
        """Gérer les popups de cookies"""
        try:
            # Attendre un peu pour que la popup apparaisse
            time.sleep(2)
            
            # Essayer plusieurs sélecteurs pour le bouton cookies
            cookie_selectors = [
                ".cookie-banner button",
                "[data-cookie-consent] button",
                "button[class*='cookie']",
                "//button[contains(text(), 'Accepter')]"
            ]
            
            for selector in cookie_selectors:
                try:
                    if selector.startswith('//'):
                        # XPath
                        button = self.driver.find_element(By.XPATH, selector)
                    else:
                        # CSS
                        button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if button and button.is_displayed():
                        print("🍪 Acceptation des cookies...")
                        button.click()
                        time.sleep(1)
                        return
                        
                except:
                    continue
                    
        except Exception as e:
            print(f"ℹ️  Gestion cookies: {e}")
    
    def _fill_form(self, household_data: Dict[str, Any]):
        """Remplir le formulaire avec les données du ménage"""
        print("📝 Remplissage du formulaire...")
        
        # 1. Situation familiale
        situation = self._map_household_type(household_data['householdType'])
        situation_select = Select(self.driver.find_element(By.ID, "Situation"))
        situation_select.select_by_visible_text(situation)
        time.sleep(0.5)
        
        # 2. Revenu personne principale
        primary = household_data['primaryPerson']
        revenus = primary.get('grossRetirementIncome', 0) if primary.get('isRetired') else primary.get('grossWorkIncome', 0)
        
        self._fill_field('#Revenu1', str(revenus))
        
        # 3. Âge personne principale  
        self._fill_field('#AgeAdulte1', str(primary['age']))
        
        # 4. Conjoint (si applicable)
        if household_data.get('spouse'):
            spouse = household_data['spouse']
            spouse_revenus = spouse.get('grossRetirementIncome', 0) if spouse.get('isRetired') else spouse.get('grossWorkIncome', 0)
            
            self._fill_field('#Revenu2', str(spouse_revenus))
            self._fill_field('#AgeAdulte2', str(spouse['age']))
        
        # 5. Nombre d'enfants
        num_children = household_data.get('numChildren', 0)
        if num_children > 0:
            children_select = Select(self.driver.find_element(By.ID, "NbEnfants"))
            children_select.select_by_value(str(num_children))
            time.sleep(0.5)
        
        print("✅ Formulaire rempli")
    
    def _fill_field(self, selector: str, value: str):
        """Remplir un champ avec une valeur en utilisant plusieurs méthodes robustes"""
        try:
            # Trouver l'élément
            element = self.driver.find_element(By.CSS_SELECTOR, selector)
            
            # Méthode 1: Clear + send_keys
            element.clear()
            time.sleep(0.2)
            element.send_keys(value)
            time.sleep(0.2)
            
            # Vérifier que la valeur a été saisie
            actual_value = element.get_attribute('value')
            if actual_value != value:
                print(f"   ⚠️  Méthode 1 échouée pour {selector}: attendu '{value}', obtenu '{actual_value}'")
                
                # Méthode 2: JavaScript direct
                print(f"   🔄 Tentative méthode JavaScript pour {selector}")
                self.driver.execute_script(f"document.querySelector('{selector}').value = '{value}';")
                time.sleep(0.2)
                
                # Déclencher l'événement onchange manuellement
                self.driver.execute_script(f"""
                    var element = document.querySelector('{selector}');
                    if (element && element.onchange) {{
                        element.onchange(new Event('change'));
                    }}
                    if (window.recalc_onclick) {{
                        window.recalc_onclick('{selector.replace('#', '')}');
                    }}
                """)
                time.sleep(0.5)
                
                # Vérifier à nouveau
                actual_value = element.get_attribute('value')
                if actual_value != value:
                    print(f"   ❌ Méthode 2 aussi échouée pour {selector}: obtenu '{actual_value}'")
                else:
                    print(f"   ✅ {selector}: {value} (méthode JavaScript)")
            else:
                # Déclencher onchange pour méthode 1
                element.send_keys(Keys.TAB)
                time.sleep(0.3)
                print(f"   ✅ {selector}: {value} (méthode standard)")
            
        except Exception as e:
            print(f"   ❌ Erreur remplissage {selector}: {e}")
    
    def _extract_results(self) -> Dict[str, Any]:
        """Extraire les résultats du calculateur"""
        print("📊 Extraction des résultats...")
        
        results = {}
        
        # Mapping des résultats à extraire
        selectors = {
            'revenu_disponible': '#RD_new',
            'ae_total': '#CA_ae_new', 
            'rrq_total': '#CA_rrq_new',
            'rqap_total': '#QC_rqap_new',
            'qc_impot_total': '#QC_total_new',
            'ca_impot_total': '#CA_total_new',
            'qc_solidarite': '#QC_sol_new',
            'ca_tps': '#CA_tps_new',
            'ca_pfrt': '#CA_pfrt_new',  # Programme fédéral manquant
            'qc_prime_travail': '#QC_pt_new',
            'ramq': '#QC_ramq_new',
            'fss': '#QC_fss_new'
        }
        
        for key, selector in selectors.items():
            try:
                value = self._extract_numeric_value(selector)
                if value is not None:
                    results[key] = value
            except Exception as e:
                print(f"   ⚠️  {key}: {e}")
                results[key] = None
        
        return results
    
    def _extract_numeric_value(self, selector: str) -> Optional[float]:
        """Extraire une valeur numérique d'un élément"""
        try:
            element = self.driver.find_element(By.CSS_SELECTOR, selector)
            
            # Récupérer le texte selon le type d'élément
            if element.tag_name == 'input':
                text = element.get_attribute('value') or ''
            else:
                text = element.text.strip()
            
            # Vérifier si c'est un tiret (pas de valeur)
            if not text or text in ['―', '—', '-', '']:
                return None
            
            # Nettoyer le texte (enlever espaces, garder chiffres et séparateurs)
            cleaned = ''.join(c for c in text if c.isdigit() or c in '.,- ')
            cleaned = cleaned.replace(' ', '').replace(',', '.')
            
            # Gérer les valeurs négatives
            is_negative = '-' in cleaned or '−' in text
            cleaned = cleaned.replace('-', '').replace('−', '')
            
            if not cleaned:
                return None
                
            value = float(cleaned)
            return -value if is_negative else value
            
        except Exception as e:
            return None
    
    def _map_household_type(self, household_type: str) -> str:
        """Mapper notre type de ménage vers les valeurs du calculateur officiel"""
        mapping = {
            'single': 'Personne vivant seule',
            'single_parent': 'Famille monoparentale', 
            'couple': 'Couple',
            'retired_single': 'Retraité vivant seul',
            'retired_couple': 'Couple de retraités'
        }
        return mapping.get(household_type, 'Personne vivant seule')
    
    def close(self):
        """Fermer le driver"""
        if self.driver:
            self.driver.quit()

def main():
    """Fonction principale pour utilisation en ligne de commande"""
    if len(sys.argv) != 2:
        print("Usage: python calculator_scraper.py <json_data>")
        sys.exit(1)
    
    try:
        # Lire les données JSON depuis l'argument
        household_data = json.loads(sys.argv[1])
        
        # Créer le scraper
        scraper = QuebecCalculatorScraper(headless=True)
        
        # Scraper le calculateur
        results = scraper.scrape_calculator(household_data)
        
        # Fermer le scraper
        scraper.close()
        
        # Retourner les résultats en JSON
        print(json.dumps(results, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()