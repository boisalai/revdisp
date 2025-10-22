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
            results = self._extract_results(household_data)
            
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
        
        # 5. Nombre d'enfants et leurs âges
        children = household_data.get('children', [])
        num_children = len(children) if children else household_data.get('numChildren', 0)

        if num_children > 0:
            try:
                # Mapper le nombre d'enfants aux options du select
                children_options = {
                    1: "Un enfant",
                    2: "Deux enfants",
                    3: "Trois enfants",
                    4: "Quatre enfants",
                    5: "Cinq enfants"
                }

                children_select = Select(self.driver.find_element(By.ID, "NbEnfants"))

                # Sélectionner le nombre d'enfants
                if num_children in children_options:
                    children_select.select_by_visible_text(children_options[num_children])
                    print(f"   ✅ #NbEnfants: {num_children} enfant(s)")
                else:
                    print(f"   ⚠️  Nombre d'enfants non supporté: {num_children}")

                # Attendre que les champs d'âge apparaissent
                time.sleep(1)

                # Remplir l'âge de chaque enfant si disponible
                if children:
                    for i, child in enumerate(children, start=1):
                        if i > 5:  # Maximum 5 enfants supportés par le formulaire
                            print(f"   ⚠️  Enfant {i} ignoré (max 5 enfants)")
                            break

                        age = child.get('age', 0)
                        age_selector = f'#AgeEnfant{i}'

                        try:
                            self._fill_field(age_selector, str(age))
                            print(f"   ✅ Enfant {i}: {age} ans")
                        except Exception as e:
                            print(f"   ⚠️  Erreur âge enfant {i}: {e}")

                # Attendre que les calculs se mettent à jour après la saisie des âges
                time.sleep(1)

            except Exception as e:
                print(f"   ❌ Erreur gestion enfants: {e}")
                raise

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

    def _wait_for_calculation_complete(self, max_wait: int = 10) -> bool:
        """
        Attendre que le calculateur ait terminé ses calculs.
        Vérifie que la valeur du revenu disponible est calculée et stable.

        Args:
            max_wait: Temps maximum d'attente en secondes

        Returns:
            True si le calcul est terminé, False si timeout
        """
        print("   ⏳ Attente de la fin des calculs...")

        # Déterminer le sélecteur selon l'année fiscale
        tax_year = 2025  # Par défaut
        rd_selector = '#RD_new' if tax_year >= 2025 else '#RD_old'

        previous_value = None
        stable_count = 0
        start_time = time.time()

        while (time.time() - start_time) < max_wait:
            try:
                # Extraire la valeur actuelle du revenu disponible
                element = self.driver.find_element(By.CSS_SELECTOR, rd_selector)
                current_value = element.get_attribute('value')

                # Vérifier si la valeur a changé
                if current_value and current_value != '0' and current_value != '':
                    # Enlever les espaces pour comparer
                    clean_value = current_value.replace(' ', '').replace('\u202f', '')

                    # Si la valeur est stable pendant 2 vérifications consécutives
                    if clean_value == previous_value:
                        stable_count += 1
                        if stable_count >= 2:
                            print(f"   ✅ Calcul terminé - Valeur stable: {current_value}")
                            # Attendre encore un peu pour être sûr que tous les champs sont mis à jour
                            time.sleep(1)
                            return True
                    else:
                        stable_count = 0
                        previous_value = clean_value

                time.sleep(0.5)

            except Exception as e:
                print(f"   ⚠️  Erreur pendant l'attente: {e}")
                time.sleep(0.5)

        print(f"   ⚠️  Timeout après {max_wait}s - utilisation des valeurs actuelles")
        return False

    def _extract_results(self, household_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extraire les résultats du calculateur"""
        print("📊 Extraction des résultats...")

        results = {}

        # Attendre intelligemment que les calculs se terminent
        self._wait_for_calculation_complete()
        
        # Chercher spécifiquement dans le tableau des résultats
        print("   🎯 Recherche dans le tableau des résultats...")
        try:
            # D'abord, attendre que les résultats soient calculés
            import re
            
            # Chercher des éléments de tableau ou de résultats spécifiques
            # D'après les captures, les résultats apparaissent dans un tableau avec colonnes 2024, 2025, Écart
            results_found = False
            
            # Essayer de trouver les cellules de tableau contenant les valeurs
            table_cells = self.driver.find_elements(By.CSS_SELECTOR, "td, th")
            print(f"   📋 Trouvé {len(table_cells)} cellules de tableau")
            
            for cell in table_cells:
                try:
                    text = cell.text.strip()
                    
                    # Ignorer les années et titres
                    if text in ['2024', '2025', 'Écart', 'Revenu disponible', 'Régime fiscal du Québec', 'Régime fiscal fédéral', 'Cotisations', 'Frais de garde']:
                        continue
                    
                    # Chercher des nombres formatés comme des montants
                    if re.match(r'^\d{1,2}\s\d{3}$', text):  # Format "34 088"
                        number = int(text.replace(' ', ''))
                        parent_text = ""
                        try:
                            parent_row = cell.find_element(By.XPATH, "..")
                            parent_text = parent_row.text.strip()
                        except:
                            pass
                            
                        # Identifier le type de résultat basé sur le contexte de la ligne
                        if "disponible" in parent_text.lower():
                            results['revenu_disponible'] = number
                            print(f"   💰 Revenu disponible: {number}")
                            results_found = True
                        elif "québec" in parent_text.lower() and "régime" in parent_text.lower():
                            results['qc_regime_fiscal_total'] = number
                            print(f"   🏛️  Régime fiscal QC: {number}")
                            results_found = True
                        elif "fédéral" in parent_text.lower() and "régime" in parent_text.lower():
                            results['ca_regime_fiscal_total'] = number
                            print(f"   🍁 Régime fiscal fédéral: {number}")
                            results_found = True
                        elif "cotisations" in parent_text.lower():
                            # Les cotisations sont négatives, mais le tableau peut montrer la valeur positive
                            results['cotisations_total'] = -abs(number)  # Force negative
                            print(f"   💼 Cotisations: -{number}")
                            results_found = True
                    
                    # Aussi chercher les tirets pour les valeurs nulles
                    elif text == '—' or text == '-':
                        parent_text = ""
                        try:
                            parent_row = cell.find_element(By.XPATH, "..")
                            parent_text = parent_row.text.strip()
                        except:
                            pass
                        
                        if "garde" in parent_text.lower():
                            results['frais_garde'] = 0
                            print(f"   👶 Frais de garde: 0 (tiret)")
                            
                except Exception:
                    continue
            
            if not results_found:
                print("   ⚠️  Aucune valeur trouvée dans le tableau, recherche alternative...")
                
        except Exception as e:
            print(f"   ❌ Erreur recherche automatique: {e}")

        # TOUJOURS utiliser les sélecteurs CSS pour garantir que tous les champs sont capturés
        # Utiliser *_old pour 2024 et *_new pour 2025
        # La recherche automatique peut manquer des champs, donc on complète avec CSS
        print("   🎯 Extraction via sélecteurs CSS...")

        # Pour 2024, utiliser les sélecteurs _old
        selectors_2024 = {
            'revenu_disponible': '#RD_old',
            'ae_total': '#CA_ae_old',
            'rrq_total': '#CA_rrq_old',
            'rqap_total': '#QC_rqap_old',
            'qc_regime_fiscal_total': '#QC_total_old',
            'ca_regime_fiscal_total': '#CA_total_old',
            'qc_impot': '#QC_impot_old',  # Impôt QC individuel
            'ca_impot': '#CA_impot_old',  # Impôt fédéral individuel
            'qc_solidarite': '#QC_sol_old',
            'ca_tps': '#CA_tps_old',
            'ca_pfrt': '#CA_pfrt_old',
            'qc_prime_travail': '#QC_pt_old',
            'ramq': '#QC_ramq_old',
            'fss': '#QC_fss_old',
            'qc_allocation_famille': '#QC_sae_old',
            'qc_fournitures_scolaires': '#SFS_old',
            'qc_garde_enfants': '#QC_garde_old',
            'qc_allocation_logement': '#QC_al_old',
            'qc_soutien_aines': '#QC_aines_old',
            'ca_allocation_enfants': '#CA_ace_old',
            'ca_pension_securite': '#CA_psv_old',
            'qc_aide_sociale': '#QC_adr_old',
            'qc_frais_medicaux': '#QC_medic_old',
            'ca_frais_medicaux': '#CA_medic_old',
            'cotisations_total': '#Cotisation_old'
        }

        # Pour 2025, utiliser les sélecteurs _new
        selectors_2025 = {
            'revenu_disponible': '#RD_new',
            'ae_total': '#CA_ae_new',
            'rrq_total': '#CA_rrq_new',
            'rqap_total': '#QC_rqap_new',
            'qc_regime_fiscal_total': '#QC_total_new',
            'ca_regime_fiscal_total': '#CA_total_new',
            'qc_impot': '#QC_impot_new',  # Impôt QC individuel
            'ca_impot': '#CA_impot_new',  # Impôt fédéral individuel
            'qc_solidarite': '#QC_sol_new',
            'ca_tps': '#CA_tps_new',
            'ca_pfrt': '#CA_pfrt_new',
            'qc_prime_travail': '#QC_pt_new',
            'ramq': '#QC_ramq_new',
            'fss': '#QC_fss_new',
            'qc_allocation_famille': '#QC_sae_new',
            'qc_fournitures_scolaires': '#SFS_new',
            'qc_garde_enfants': '#QC_garde_new',
            'qc_allocation_logement': '#QC_al_new',
            'qc_soutien_aines': '#QC_aines_new',
            'ca_allocation_enfants': '#CA_ace_new',
            'ca_pension_securite': '#CA_psv_new',
            'qc_aide_sociale': '#QC_adr_new',
            'qc_frais_medicaux': '#QC_medic_new',
            'ca_frais_medicaux': '#CA_medic_new',
            'cotisations_total': '#Cotisation_new'
        }

        # Utiliser les sélecteurs appropriés selon l'année fiscale
        tax_year = household_data.get('taxYear', 2024)
        selectors = selectors_2025 if tax_year >= 2025 else selectors_2024

        print(f"   📅 Année fiscale: {tax_year}, sélecteurs: {'2025 (_new)' if tax_year >= 2025 else '2024 (_old)'}")

        for key, selector in selectors.items():
            try:
                value = self._extract_numeric_value(selector)
                if value is not None:
                    results[key] = value
                    print(f"   📋 {key}: {value} (CSS: {selector})")
            except Exception as e:
                print(f"   ⚠️  {key}: {e}")
                results[key] = None
        
        print(f"   📊 Résultats finaux: {results}")
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