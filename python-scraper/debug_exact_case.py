#!/usr/bin/env python3
"""
Test exact du cas de la capture utilisateur
Couple, 40 ans, 49363$ - doit donner revenu disponible 42754$
"""

import json
from calculator_scraper import QuebecCalculatorScraper

def debug_exact_case():
    print("🔍 DEBUG CAS EXACT DE LA CAPTURE")
    print("===============================")
    
    # Cas exact de la capture utilisateur  
    household_data = {
        "householdType": "couple",
        "primaryPerson": {
            "age": 40,
            "grossWorkIncome": 49363,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "spouse": {
            "age": 41,
            "grossWorkIncome": 0,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "numChildren": 0,
        "taxYear": 2024
    }
    
    print("📊 Configuration EXACTE de votre capture:")
    print(f"   - Type: {household_data['householdType']}")
    print(f"   - Personne 1: {household_data['primaryPerson']['age']} ans, {household_data['primaryPerson']['grossWorkIncome']}$")
    print(f"   - Personne 2: {household_data['spouse']['age']} ans, {household_data['spouse']['grossWorkIncome']}$")
    print(f"   - Enfants: {household_data['numChildren']}")
    print()
    
    print("📊 RÉSULTATS ATTENDUS (selon votre capture):")
    print("============================================")
    print("   - Revenu disponible 2024: 42,754$")
    print("   - Régime fiscal QC: -415$") 
    print("   - Régime fiscal fédéral: -888$")
    print("   - Cotisations: -5,306$")
    print("   - Crédit solidarité: 1,173$")
    print("   - Crédit TPS: 451$")
    print()
    
    # Mode non-headless pour voir ce qui se passe
    scraper = QuebecCalculatorScraper(headless=False, timeout=60)
    
    try:
        print("🔍 Début du scraping...")
        results = scraper.scrape_calculator(household_data)
        
        print("\n📊 RÉSULTATS DU SCRAPER:")
        print("========================")
        for key, value in results.items():
            if value is not None:
                print(f"   - {key}: {value}$")
        
        print(f"\n🎯 VÉRIFICATION CLÉS:")
        expected_rd = 42754
        if 'revenu_disponible' in results:
            scraped_rd = results['revenu_disponible']
            diff = abs(scraped_rd - expected_rd) 
            print(f"   - Revenu disponible: {scraped_rd}$ (attendu {expected_rd}$)")
            print(f"   - Écart: {diff}$ ({(diff/expected_rd)*100:.1f}%)")
            
            if diff < 100:  # Moins de 100$ d'écart
                print("   ✅ SUCCÈS: Scraper correct!")
            else:
                print("   ❌ ÉCHEC: Scraper incorrect")
        else:
            print("   ❌ ÉCHEC: Revenu disponible non trouvé")
        
        input("Appuyez sur Entrée pour fermer le navigateur...")
        return results
        
    finally:
        scraper.close()

if __name__ == "__main__":
    debug_exact_case()