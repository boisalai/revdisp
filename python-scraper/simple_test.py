#!/usr/bin/env python3
"""
Test simple du scraper Python (version CLI)
"""

import json
import sys
import os

# Nous sommes déjà dans le bon répertoire

def test_simple():
    print("🧪 TEST SIMPLE DU SCRAPER PYTHON")
    print("================================")
    
    # Test avec les données d'un cas simple
    household_data = {
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
    
    try:
        from calculator_scraper import QuebecCalculatorScraper
        
        print("✅ Module importé avec succès")
        print("📊 Configuration du test:")
        print(f"   - Type: {household_data['householdType']}")
        print(f"   - Âge: {household_data['primaryPerson']['age']} ans")
        print(f"   - Revenus: {household_data['primaryPerson']['grossWorkIncome']}$")
        
        # Test en mode headless pour éviter les popups système
        scraper = QuebecCalculatorScraper(headless=True, timeout=30)
        
        print("\n🔍 Début du scraping...")
        results = scraper.scrape_calculator(household_data)
        
        scraper.close()
        
        print("\n📊 RÉSULTATS:")
        if 'error' in results:
            print(f"❌ Erreur: {results['error']}")
            return False
        else:
            print("✅ Scraping réussi!")
            for key, value in results.items():
                if value is not None:
                    print(f"   - {key}: {value}")
            return True
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

if __name__ == "__main__":
    success = test_simple()
    sys.exit(0 if success else 1)