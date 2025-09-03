#!/usr/bin/env python3
"""
Debug visuel pour comparer avec le calculateur officiel
Mode non-headless pour voir ce qui se passe réellement
"""

import time
from calculator_scraper import QuebecCalculatorScraper

def debug_visual():
    print("🔍 DEBUG VISUEL DU SCRAPER")
    print("=========================")
    
    # Test exact: 15000$, 35 ans (comme dans la capture)
    household_data = {
        "householdType": "single",
        "primaryPerson": {
            "age": 35,  # Même âge que capture
            "grossWorkIncome": 15000,  # Même revenu que capture
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "spouse": None,
        "numChildren": 0,
        "taxYear": 2024
    }
    
    print("📊 Test avec données exactes de la capture:")
    print("   - Personne vivant seule")
    print("   - 35 ans") 
    print("   - 15000$ revenu travail")
    print("   - Attendu: ~20 387$ (selon capture)")
    
    # Scraper en mode VISIBLE
    scraper = QuebecCalculatorScraper(headless=False, timeout=60)
    
    try:
        print("\n🌐 Ouverture du navigateur visible...")
        print("👀 REGARDER ATTENTIVEMENT:")
        print("   1. Les valeurs saisies dans les champs")
        print("   2. Le résultat affiché")
        print("   3. Comparer avec la capture d'écran")
        
        # Faire le scraping
        results = scraper.scrape_calculator(household_data)
        
        print(f"\n📊 RÉSULTATS OBTENUS:")
        print(f"   - Revenu disponible: {results.get('revenu_disponible', 'ERREUR')}")
        print(f"   - AE total: {results.get('ae_total', 'N/A')}")
        print(f"   - RRQ total: {results.get('rrq_total', 'N/A')}")
        
        print(f"\n📊 RÉSULTATS ATTENDUS (selon capture):")
        print(f"   - Revenu disponible: ~20 387$")
        print(f"   - Régime fiscal QC: ~2 305$")
        print(f"   - Régime fiscal fédéral: ~4 089$")
        print(f"   - Cotisations: ~-1 007$")
        
        # Laisser le navigateur ouvert pour inspection manuelle
        print(f"\n⏸️  NAVIGATEUR LAISSÉ OUVERT POUR INSPECTION")
        print("   - Vérifiez manuellement les valeurs dans les champs")
        print("   - Comparez les résultats affichés")
        print("   - Appuyez sur Entrée quand terminé...")
        
        input()  # Attendre input utilisateur
        
    finally:
        scraper.close()
        print("✅ Debug terminé")

if __name__ == "__main__":
    debug_visual()