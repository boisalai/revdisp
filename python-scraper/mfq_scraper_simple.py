#!/usr/bin/env python
"""
Scraper simple et unifié pour le calculateur officiel du MFQ
Fonctionne pour tous les types de ménages
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import sys
import json

class MFQScraperSimple:
    def __init__(self, headless=True):
        """Initialise le scraper avec Chrome"""
        self.driver = None
        self.setup_driver(headless)
        
    def setup_driver(self, headless):
        """Configure Chrome avec les bonnes options"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1280,720')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
        
    def scrape(self, household_data):
        """
        Scrape le calculateur MFQ avec les données du ménage
        
        household_data doit contenir:
        - householdType: 'single' ou 'couple'
        - primaryPerson: {age, grossWorkIncome, grossRetirementIncome}
        - spouse: {age, grossWorkIncome, grossRetirementIncome} ou None
        - numChildren: nombre d'enfants
        - taxYear: 2024 ou 2025
        """
        try:
            # Naviguer vers le calculateur
            self.driver.get("https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp")
            time.sleep(3)
            
            # Accepter les cookies
            try:
                cookie_btn = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accepter')]"))
                )
                cookie_btn.click()
                time.sleep(1)
            except:
                pass  # Pas de cookies
                
            # Attendre que le formulaire soit chargé
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "Situation"))
            )
            
            # Remplir le formulaire
            self.fill_form(household_data)
            
            # Attendre les résultats
            time.sleep(3)
            
            # Extraire les résultats
            results = self.extract_results(household_data['taxYear'])
            
            return results
            
        except Exception as e:
            return {'error': str(e), 'success': False}
            
    def fill_form(self, household):
        """Remplit le formulaire avec les données du ménage"""
        
        # Déterminer le type de ménage
        person1 = household['primaryPerson']
        is_retired1 = person1.get('isRetired', False)
        has_spouse = household.get('spouse') is not None
        has_children = household.get('numChildren', 0) > 0
        
        # Sélectionner le bon type de ménage
        situation = Select(self.driver.find_element(By.ID, "Situation"))
        
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
        
        # Déterminer quel revenu utiliser selon le type de ménage
        if is_retired1:
            # Pour les retraités, utiliser le revenu de retraite
            income_to_use1 = retirement_income1
        else:
            # Pour les non-retraités, utiliser le revenu de travail
            income_to_use1 = work_income1
        
        # Remplir revenu personne 1 - Méthode JavaScript pour garantir le vidage
        revenu1 = self.driver.find_element(By.ID, "Revenu1")
        self.driver.execute_script("arguments[0].value = '';", revenu1)
        time.sleep(0.5)
        revenu1.send_keys(str(income_to_use1))
        time.sleep(0.5)
        
        # Remplir âge personne 1 - Méthode JavaScript pour garantir le vidage
        age_field1 = self.driver.find_element(By.ID, "AgeAdulte1")
        self.driver.execute_script("arguments[0].value = '';", age_field1)
        time.sleep(0.5)
        age_field1.send_keys(str(age1))
        time.sleep(0.5)
        
        # Si couple, remplir personne 2
        if has_spouse:
            person2 = household['spouse']
            work_income2 = int(person2.get('grossWorkIncome', 0))
            retirement_income2 = int(person2.get('grossRetirementIncome', 0))
            age2 = person2['age']
            is_retired2 = person2.get('isRetired', False)
            
            # Déterminer quel revenu utiliser pour le conjoint
            if is_retired2:
                income_to_use2 = retirement_income2
            else:
                income_to_use2 = work_income2
            
            # Revenu personne 2 - Méthode JavaScript pour garantir le vidage
            revenu2 = self.driver.find_element(By.ID, "Revenu2")
            self.driver.execute_script("arguments[0].value = '';", revenu2)
            time.sleep(0.5)
            revenu2.send_keys(str(income_to_use2))
            time.sleep(0.5)
            
            # Âge personne 2 - Méthode JavaScript pour garantir le vidage
            age_field2 = self.driver.find_element(By.ID, "AgeAdulte2")
            self.driver.execute_script("arguments[0].value = '';", age_field2)
            time.sleep(0.5)
            age_field2.send_keys(str(age2))
            time.sleep(0.5)
            
        # Nombre d'enfants
        nb_enfants = Select(self.driver.find_element(By.ID, "NbEnfants"))
        num_children = household.get('numChildren', 0)
        if num_children == 0:
            nb_enfants.select_by_visible_text("Aucun enfant")
        else:
            nb_enfants.select_by_visible_text(str(num_children))
            
            # Remplir les informations pour chaque enfant
            children = household.get('children', [])
            for i in range(min(num_children, 5)):  # Maximum 5 enfants dans le formulaire
                child_num = i + 1
                
                # Âge de l'enfant - Méthode JavaScript pour garantir le vidage
                age_field_id = f"AgeEnfant{child_num}"
                try:
                    age_field = self.driver.find_element(By.ID, age_field_id)
                    self.driver.execute_script("arguments[0].value = '';", age_field)
                    time.sleep(0.2)
                    # Utiliser l'âge de l'enfant si disponible, sinon mettre un âge par défaut
                    if i < len(children) and 'age' in children[i]:
                        age_field.send_keys(str(children[i]['age']))
                    else:
                        age_field.send_keys(str(5 + i))  # Âge par défaut
                    time.sleep(0.2)
                except:
                    pass  # Le champ n'existe peut-être pas
                
                # Frais de garde (par défaut 0) - Méthode JavaScript pour garantir le vidage
                frais_field_id = f"Frais{child_num}"
                try:
                    frais_field = self.driver.find_element(By.ID, frais_field_id)
                    self.driver.execute_script("arguments[0].value = '';", frais_field)
                    time.sleep(0.2)
                    # Utiliser les frais si disponibles
                    if i < len(children) and 'childcare_expenses' in children[i]:
                        frais_field.send_keys(str(children[i]['childcare_expenses']))
                    else:
                        frais_field.send_keys("0")
                    time.sleep(0.2)
                except:
                    pass
                
                # Type de garde (optionnel)
                type_garde_id = f"type_garde{child_num}"
                try:
                    type_garde = Select(self.driver.find_element(By.ID, type_garde_id))
                    # Par défaut, sélectionner le premier type disponible
                    if i < len(children) and 'childcare_type' in children[i]:
                        type_garde.select_by_visible_text(children[i]['childcare_type'])
                    else:
                        # Ne rien faire, garder la valeur par défaut
                        pass
                except:
                    pass
                
    def extract_results(self, tax_year):
        """Extrait tous les résultats du calculateur"""
        
        # Suffixe selon l'année
        suffix = '_old' if tax_year == 2024 else '_new'
        
        # Tous les IDs à extraire
        result_ids = {
            'revenu_disponible': f'RD{suffix}',
            'qc_impot_total': f'QC_total{suffix}',
            'qc_impot': f'QC_impot{suffix}',
            'qc_aide_sociale': f'QC_adr{suffix}',
            'qc_allocation_famille': f'QC_sae{suffix}',
            'qc_fournitures_scolaires': f'SFS{suffix}',
            'qc_prime_travail': f'QC_pt{suffix}',
            'qc_solidarite': f'QC_sol{suffix}',
            'qc_garde_enfants': f'QC_garde{suffix}',
            'qc_allocation_logement': f'QC_al{suffix}',
            'qc_frais_medicaux': f'QC_medic{suffix}',
            'qc_soutien_aines': f'QC_aines{suffix}',
            'ca_impot_total': f'CA_total{suffix}',
            'ca_impot': f'CA_impot{suffix}',
            'ca_allocation_enfants': f'CA_ace{suffix}',
            'ca_tps': f'CA_tps{suffix}',
            'ca_pfrt': f'CA_pfrt{suffix}',
            'ca_pension_securite': f'CA_psv{suffix}',
            'ca_frais_medicaux': f'CA_medic{suffix}',
            'cotisations_total': f'Cotisation{suffix}',
            'ae_total': f'CA_ae{suffix}',
            'rqap_total': f'QC_rqap{suffix}',
            'rrq_total': f'CA_rrq{suffix}',
            'fss': f'QC_fss{suffix}',
            'ramq': f'QC_ramq{suffix}',
            'frais_garde': f'Frais_garde{suffix}'
        }
        
        results = {}
        
        for key, element_id in result_ids.items():
            try:
                element = self.driver.find_element(By.ID, element_id)
                
                # Les résultats sont dans des inputs, obtenir l'attribut value
                if element.tag_name == 'input':
                    text = element.get_attribute('value')
                else:
                    text = element.text.strip()
                
                # Nettoyer le texte
                if text == '―' or text == '—' or text == '-' or text == '' or text is None:
                    value = 0
                else:
                    # Enlever espaces et le signe moins spécial '−'
                    text = text.replace(' ', '').replace(',', '.').replace('−', '-')
                    # Gérer les parenthèses pour les négatifs
                    if text.startswith('(') and text.endswith(')'):
                        text = '-' + text[1:-1]
                    value = float(text)
                    
                results[key] = value
                
            except Exception as e:
                # Si l'élément n'existe pas ou erreur
                results[key] = 0
                
        results['success'] = True
        return results
        
    def close(self):
        """Ferme le navigateur"""
        if self.driver:
            self.driver.quit()

def main():
    """Point d'entrée pour utilisation en ligne de commande"""
    if len(sys.argv) < 2:
        print("Usage: python mfq_scraper_simple.py '{json_data}'")
        sys.exit(1)
        
    try:
        # Parser les données JSON
        household_data = json.loads(sys.argv[1])
        
        # Créer le scraper et exécuter
        scraper = MFQScraperSimple(headless=True)
        results = scraper.scrape(household_data)
        scraper.close()
        
        # Retourner les résultats en JSON
        print(json.dumps(results))
        
    except Exception as e:
        print(json.dumps({'error': str(e), 'success': False}))
        sys.exit(1)

if __name__ == "__main__":
    main()