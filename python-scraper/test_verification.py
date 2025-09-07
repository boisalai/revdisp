#!/usr/bin/env python3
"""
Test de vérification du scraper avec un autre type de ménage
"""

import json
from calculator_scraper import QuebecCalculatorScraper

def test_verification():
    print("🧪 TEST DE VÉRIFICATION DU SCRAPER")
    print("=================================")
    
    # Test avec un ménage différent - personne seule, plus jeune, revenu moyen
    household_data = {
        "householdType": "single",
        "primaryPerson": {
            "age": 35,
            "grossWorkIncome": 35000,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "spouse": None,
        "numChildren": 0,
        "taxYear": 2024
    }
    
    print("📊 Configuration du test:")
    print(f"   - Type: {household_data['householdType']}")
    print(f"   - Âge: {household_data['primaryPerson']['age']} ans")
    print(f"   - Revenus: {household_data['primaryPerson']['grossWorkIncome']}$")
    print()
    
    print("⏳ Lancement du scraper (navigateur visible pour vérification)...")
    
    # Mode visible pour que vous puissiez voir le site
    scraper = QuebecCalculatorScraper(headless=False, timeout=60)
    
    try:
        print("🔍 Début du scraping...")
        results = scraper.scrape_calculator(household_data)
        
        print("\n📊 RÉSULTATS DU SCRAPER:")
        print("========================")
        for key, value in results.items():
            if value is not None:
                print(f"   - {key}: {value}$")
        
        print(f"\n📋 RÉSULTATS PRINCIPAUX:")
        print("========================")
        if 'revenu_disponible' in results:
            print(f"   📊 Revenu disponible: {results['revenu_disponible']}$")
        if 'qc_impot_total' in results:
            print(f"   🏛️  Régime fiscal QC: {results['qc_impot_total']}$")
        if 'ca_impot_total' in results:
            print(f"   🍁 Régime fiscal fédéral: {results['ca_impot_total']}$")
        
        print(f"\n👀 NAVIGATEUR LAISSÉ OUVERT")
        print("===========================")
        print("Vérifiez manuellement les valeurs affichées sur le site MFQ")
        print("Puis fournissez une capture d'écran pour comparaison")
        
        input("Appuyez sur Entrée quand vous avez pris la capture d'écran...")
        return results
        
    finally:
        scraper.close()

if __name__ == "__main__":
    test_verification()