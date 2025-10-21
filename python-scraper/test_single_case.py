"""Test du cas spécifique : personne seule 39 ans, 66539$ revenu brut"""
from calculator_scraper import QuebecCalculatorScraper
import json

def test_specific_case():
    scraper = QuebecCalculatorScraper(headless=True)
    
    try:
        # Cas précis au format du scraper
        household_data = {
            "householdType": "single",
            "primaryPerson": {
                "age": 39,
                "grossWorkIncome": 66539,
                "grossRetirementIncome": 0,
                "isRetired": False
            },
            "spouse": None,
            "numChildren": 0,
            "taxYear": 2024
        }
        
        print(f"\n{'='*80}")
        print(f"Test: Personne seule, 39 ans, 66539$ revenu brut")
        print(f"{'='*80}\n")
        
        result = scraper.scrape_calculator(household_data)
        
        if result and 'error' not in result:
            print("\n" + "="*80)
            print("RÉSULTATS DU CALCULATEUR OFFICIEL (MFQ):")
            print("="*80 + "\n")
            print(f"Revenu disponible: {result.get('revenu_disponible', 'N/A')}$")
            print(f"\n--- RÉGIME FISCAL FÉDÉRAL ---")
            print(f"Régime fiscal fédéral (NET): {result.get('regime_fiscal_federal', 'N/A')}$")
            print(f"Impôt fédéral particuliers: {result.get('impot_federal', 'N/A')}$")
            print(f"Crédit TPS: {result.get('credit_tps', 'N/A')}$")
            print(f"ACT (Allocation canadienne travailleurs): {result.get('allocation_canadienne_travailleurs', 'N/A')}$")
            
            print(f"\n--- RÉGIME FISCAL QUÉBEC ---")
            print(f"Régime fiscal QC (NET): {result.get('regime_fiscal_quebec', 'N/A')}$")
            print(f"Impôt QC particuliers: {result.get('impot_quebec', 'N/A')}$")
            print(f"Crédit solidarité: {result.get('credit_solidarite', 'N/A')}$")
            print(f"Prime au travail: {result.get('prime_travail', 'N/A')}$")
            
            print(f"\n--- COTISATIONS ---")
            print(f"Assurance-emploi: {result.get('assurance_emploi', 'N/A')}$")
            print(f"RQAP: {result.get('rqap', 'N/A')}$")
            print(f"RRQ: {result.get('rrq', 'N/A')}$")
            print(f"FSS: {result.get('fss', 'N/A')}$")
            print(f"RAMQ: {result.get('ramq', 'N/A')}$")
            
            # Sauvegarde des résultats
            with open('official_results_66539.json', 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\nRésultats complets sauvegardés dans 'official_results_66539.json'")
            print("="*80 + "\n")
            
        else:
            print("ERREUR: Aucun résultat obtenu du calculateur officiel")
            print(f"Résultat: {result}")
            
    except Exception as e:
        print(f"ERREUR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        scraper.close()

if __name__ == '__main__':
    test_specific_case()
