#!/usr/bin/env python3
"""
Test du cas spécifique: 35 ans, célibataire, 22000$ revenu
"""

import json
import sys
import os

def test_22k_case():
    print("🧪 TEST CAS SPÉCIFIQUE: 35 ans, 22000$")
    print("=====================================")

    # Cas de test exact de l'utilisateur
    household_data = {
        "householdType": "single",
        "primaryPerson": {
            "age": 35,
            "grossWorkIncome": 22000,
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

        # Test en mode headless pour éviter les popups
        scraper = QuebecCalculatorScraper(headless=True, timeout=30)

        print("\n🔍 Début du scraping...")
        results = scraper.scrape_calculator(household_data)

        scraper.close()

        print("\n📊 RÉSULTATS CALCULATEUR OFFICIEL MFQ:")
        if 'error' in results:
            print(f"❌ Erreur: {results['error']}")
            return False
        else:
            print("✅ Scraping réussi!")

            # Extraire impôt Québec spécifiquement
            impot_qc = results.get('qc_impot_total', 0)
            print(f"\n🎯 IMPÔT QUÉBEC NET: {impot_qc}$")

            # Comparaison avec calculs manuels
            print("\n=== COMPARAISON ===")
            print(f"Calculateur officiel MFQ: {impot_qc}$")
            print("Calcul manuel utilisateur: -103.32$")
            print("Écart:", abs(float(impot_qc) - (-103.32)), "$")

            # Afficher autres résultats pertinents
            print("\n📋 AUTRES RÉSULTATS:")
            relevant_keys = ['revenu_disponible', 'qc_solidarite', 'qc_prime_travail', 'rrq_total', 'rqap_total']
            for key in relevant_keys:
                if key in results:
                    print(f"   - {key}: {results[key]}")

            return True

    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_22k_case()
    sys.exit(0 if success else 1)