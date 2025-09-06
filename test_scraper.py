#!/usr/bin/env python3
"""
Test du scraper Python avec quelques cas simples
"""

import json
from calculator_scraper import QuebecCalculatorScraper

def test_scraper():
    print("🧪 TEST DU SCRAPER PYTHON/SELENIUM")
    print("==================================")
    
    # Cas de test
    test_cases = [
        {
            "id": "cas1",
            "description": "Personne seule, 25 ans, 15000$",
            "data": {
                "householdType": "single",
                "primaryPerson": {
                    "age": 25,
                    "grossWorkIncome": 15000,
                    "grossRetirementIncome": 0,
                    "isRetired": False
                },
                "spouse": None,
                "numChildren": 0,
                "taxYear": 2024
            }
        },
        {
            "id": "cas2", 
            "description": "Personne seule, 35 ans, 35000$",
            "data": {
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
        },
        {
            "id": "cas3",
            "description": "Retraité seul, 70 ans, 25000$ retraite",
            "data": {
                "householdType": "retired_single",
                "primaryPerson": {
                    "age": 70,
                    "grossWorkIncome": 0,
                    "grossRetirementIncome": 25000,
                    "isRetired": True
                },
                "spouse": None,
                "numChildren": 0,
                "taxYear": 2024
            }
        }
    ]
    
    results = []
    
    # Créer le scraper (mode visible pour debug)
    scraper = QuebecCalculatorScraper(headless=False, timeout=30)
    
    try:
        for i, test_case in enumerate(test_cases):
            print(f"\n🧪 TEST {i+1}/3: {test_case['description']}")
            
            # Scraper le cas
            result = scraper.scrape_calculator(test_case['data'])
            
            # Stocker le résultat
            results.append({
                'test_case': test_case,
                'result': result
            })
            
            print(f"   📊 Revenu disponible: {result.get('revenu_disponible', 'ERREUR')}")
            
            # Délai entre les tests
            if i < len(test_cases) - 1:
                print("   ⏳ Délai avant test suivant...")
                import time
                time.sleep(2)
    
    finally:
        scraper.close()
    
    # Analyse des résultats
    print(f"\n📊 ANALYSE DES RÉSULTATS")
    print("========================")
    
    unique_values = set()
    for result in results:
        rd_value = result['result'].get('revenu_disponible')
        if rd_value:
            unique_values.add(rd_value)
    
    if len(unique_values) > 1:
        print("✅ SUCCÈS: Les résultats sont différents!")
        print("   👉 Le scraper Python fonctionne correctement")
    else:
        print("❌ ÉCHEC: Les résultats sont identiques")
        print("   👉 Même problème qu'avec Puppeteer")
    
    print(f"\n📋 DÉTAIL:")
    for i, result in enumerate(results):
        test_desc = result['test_case']['description']
        rd_value = result['result'].get('revenu_disponible', 'ERREUR')
        print(f"{i+1}. {test_desc} → RD: {rd_value}")
    
    return results

if __name__ == "__main__":
    test_scraper()