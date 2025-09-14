#!/usr/bin/env python
"""
Test du scraper simple MFQ avec le cas du couple
"""

from mfq_scraper_simple import MFQScraperSimple
import json

def test_couple():
    """Test avec le couple de l'utilisateur"""
    
    household = {
        'householdType': 'couple',
        'primaryPerson': {
            'age': 19,
            'grossWorkIncome': 53518,
            'grossRetirementIncome': 0
        },
        'spouse': {
            'age': 19,
            'grossWorkIncome': 0,
            'grossRetirementIncome': 0
        },
        'numChildren': 0,
        'taxYear': 2024
    }
    
    print("🧪 TEST SCRAPER SIMPLE MFQ")
    print("=" * 60)
    print("📊 Couple, 19 ans chacun, 53518$ + 0$")
    print()
    
    scraper = MFQScraperSimple(headless=True)  # Mode headless pour test rapide
    try:
        results = scraper.scrape(household)
        
        if results.get('success'):
            print("✅ Scraping réussi!")
            print("\n📊 Résultats extraits:")
            print("-" * 40)
            
            # Afficher les résultats principaux
            print(f"Revenu disponible: {results.get('revenu_disponible', 0)}$")
            print(f"Régime fiscal QC: {results.get('qc_impot_total', 0)}$")
            print(f"Régime fiscal fédéral: {results.get('ca_impot_total', 0)}$")
            print(f"Cotisations totales: {results.get('cotisations_total', 0)}$")
            
            print("\n📋 Valeurs attendues:")
            print("-" * 40)
            print("Revenu disponible: 44801$")
            print("Régime fiscal QC: -1248$")
            print("Régime fiscal fédéral: -1822$")
            print("Cotisations totales: -5647$")
            
            # Vérifier l'écart
            ecart = abs(results.get('revenu_disponible', 0) - 44801)
            if ecart < 100:
                print(f"\n✅ SUCCÈS! Écart de seulement {ecart}$")
            else:
                print(f"\n⚠️ ÉCART: {ecart}$")
                
        else:
            print(f"❌ Erreur: {results.get('error')}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
    finally:
        scraper.close()

def test_single():
    """Test avec une personne seule"""
    
    household = {
        'householdType': 'single',
        'primaryPerson': {
            'age': 51,
            'grossWorkIncome': 14868,
            'grossRetirementIncome': 0
        },
        'spouse': None,
        'numChildren': 0,
        'taxYear': 2024
    }
    
    print("\n🧪 TEST PERSONNE SEULE")
    print("=" * 60)
    print("📊 Single, 51 ans, 14868$")
    print()
    
    scraper = MFQScraperSimple(headless=True)
    try:
        results = scraper.scrape(household)
        
        if results.get('success'):
            print("✅ Scraping réussi!")
            print(f"Revenu disponible: {results.get('revenu_disponible', 0)}$")
            print(f"Attendu: 21826$")
            
            ecart = abs(results.get('revenu_disponible', 0) - 21826)
            if ecart < 100:
                print(f"✅ SUCCÈS! Écart de seulement {ecart}$")
            else:
                print(f"⚠️ ÉCART: {ecart}$")
        else:
            print(f"❌ Erreur: {results.get('error')}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    finally:
        scraper.close()

if __name__ == "__main__":
    # Tester le couple d'abord (mode visible)
    test_couple()
    
    # Puis tester une personne seule (mode headless)
    # test_single()