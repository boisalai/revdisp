#!/usr/bin/env python3
"""
Test avec plusieurs cas différents pour vérifier la variabilité
"""

from calculator_scraper import QuebecCalculatorScraper

def multi_test():
    print("🧪 TEST MULTI-CAS PYTHON")
    print("========================")
    
    test_cases = [
        {"name": "Cas 1: 25 ans, 15000$", "age": 25, "income": 15000, "type": "single"},
        {"name": "Cas 2: 35 ans, 35000$", "age": 35, "income": 35000, "type": "single"}, 
        {"name": "Cas 3: 70 ans, 25000$ (retraité)", "age": 70, "income": 25000, "type": "retired_single"}
    ]
    
    scraper = QuebecCalculatorScraper(headless=True, timeout=30)
    results = []
    
    try:
        for i, case in enumerate(test_cases):
            print(f"\n🧪 TEST {i+1}: {case['name']}")
            
            # Préparer les données
            is_retired = case['type'] == 'retired_single'
            household_data = {
                "householdType": case['type'],
                "primaryPerson": {
                    "age": case['age'],
                    "grossWorkIncome": 0 if is_retired else case['income'],
                    "grossRetirementIncome": case['income'] if is_retired else 0,
                    "isRetired": is_retired
                },
                "spouse": None,
                "numChildren": 0,
                "taxYear": 2024
            }
            
            # Scraper
            result = scraper.scrape_calculator(household_data)
            rd_value = result.get('revenu_disponible', 'ERREUR')
            
            results.append({
                'case': case,
                'rd_value': rd_value
            })
            
            print(f"   📊 Revenu disponible: {rd_value}")
    
    finally:
        scraper.close()
    
    # Analyse
    print(f"\n📊 ANALYSE FINALE")
    print("=================")
    
    unique_values = set(r['rd_value'] for r in results if r['rd_value'] != 'ERREUR')
    
    if len(unique_values) > 1:
        print("✅ SUCCÈS: Les résultats varient!")
        print("   👉 Python/Selenium résout le problème")
    else:
        print("❌ PROBLÈME PERSISTANT: Résultats identiques")
        print("   👉 Le problème est plus profond")
    
    print(f"\n📋 DÉTAILS:")
    for result in results:
        print(f"   {result['case']['name']} → {result['rd_value']}")
        
    return len(unique_values) > 1

if __name__ == "__main__":
    success = multi_test()
    print(f"\n🎯 RÉSULTAT: {'SUCCÈS' if success else 'ÉCHEC'}")