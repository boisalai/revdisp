#!/usr/bin/env python3
"""
Test du cas spécifique fourni par l'utilisateur
Couple, 56 ans, 47832$ de revenu
"""

import json
from calculator_scraper import QuebecCalculatorScraper

def test_specific_case():
    print("🧪 TEST CAS SPÉCIFIQUE")
    print("====================")
    
    # Cas exact de l'utilisateur
    household_data = {
        "householdType": "couple",
        "primaryPerson": {
            "age": 56,
            "grossWorkIncome": 47832,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "spouse": {
            "age": 56,
            "grossWorkIncome": 0,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "numChildren": 0,
        "taxYear": 2024
    }
    
    print("📊 Configuration du test:")
    print(f"   - Type: {household_data['householdType']}")
    print(f"   - Âge: {household_data['primaryPerson']['age']} ans")
    print(f"   - Revenus: {household_data['primaryPerson']['grossWorkIncome']}$")
    print()
    
    scraper = QuebecCalculatorScraper(headless=True, timeout=60)
    
    try:
        print("🔍 Début du scraping...")
        results = scraper.scrape_calculator(household_data)
        
        print("\n📊 RÉSULTATS DU SCRAPER:")
        print("========================")
        for key, value in results.items():
            if value is not None:
                print(f"   - {key}: {value}$")
        
        print("\n📊 RÉSULTATS ATTENDUS (selon capture utilisateur):")
        print("=================================================")
        print("   - revenu_disponible: 42,228$")
        print("   - Régime fiscal du Québec: -105$")
        print("   - Régime fiscal fédéral: -329$")
        print("   - Cotisations: -5,170$")
        
        print(f"\n🎯 COMPARAISON REVENU DISPONIBLE:")
        if 'revenu_disponible' in results:
            scraped = results['revenu_disponible']
            expected = 42228
            diff = abs(scraped - expected)
            percent_diff = (diff / expected) * 100
            print(f"   - Scraper: {scraped}$")
            print(f"   - Attendu: {expected}$")
            print(f"   - Écart: {diff}$ ({percent_diff:.1f}%)")
            
            if percent_diff < 5:
                print("   ✅ Écart acceptable (<5%)")
            else:
                print("   ❌ Écart trop important (>5%)")
        
        return results
        
    finally:
        scraper.close()

if __name__ == "__main__":
    test_specific_case()