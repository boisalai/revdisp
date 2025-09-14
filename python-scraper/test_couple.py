#!/usr/bin/env python
"""
Test spécifique pour le cas: couple, 19 ans chacun, 53518$ (personne 1), 0$ (personne 2)
Pour débugger pourquoi le scraper retourne 90400$ au lieu de 44801$
"""

from calculator_scraper import QuebecCalculatorScraper
import json

def main():
    """Test avec le cas exact du couple de l'utilisateur"""
    
    # Configuration exacte du test (format attendu par le scraper)
    household = {
        'householdType': 'couple',
        'primaryPerson': {
            'age': 19,
            'grossWorkIncome': 53518,
            'grossRetirementIncome': 0,
            'isRetired': False
        },
        'spouse': {
            'age': 19,
            'grossWorkIncome': 0,
            'grossRetirementIncome': 0,
            'isRetired': False
        },
        'numChildren': 0,
        'taxYear': 2024
    }
    
    print("🧪 TEST SPÉCIFIQUE - Couple, 19 ans chacun, 53518$ + 0$")
    print("=" * 60)
    print(f"📊 Configuration:")
    print(f"   - Type: {household['householdType']}")
    print(f"   - Personne 1: {household['primaryPerson']['age']} ans, {household['primaryPerson']['grossWorkIncome']}$")
    print(f"   - Personne 2: {household['spouse']['age']} ans, {household['spouse']['grossWorkIncome']}$")
    print(f"   - Enfants: {household['numChildren']}")
    print()
    
    # Lancer le scraper en mode visible pour debug
    scraper = QuebecCalculatorScraper(headless=False)  # Mode visible pour voir ce qui se passe
    try:
        print("🔍 Lancement du scraper en mode VISIBLE...")
        results = scraper.scrape_calculator(household)
        
        print("\n✅ Résultats extraits:")
        print("=" * 60)
        
        # Afficher tous les résultats trouvés
        for key, value in sorted(results.items()):
            if key not in ['timestamp', 'success', 'error']:
                if value is not None and value != 0:
                    print(f"   {key}: {value}")
        
        print()
        print("📋 Valeurs attendues selon la capture d'écran:")
        print("   - Revenu disponible: 44801$ ⚠️")
        print("   - Régime fiscal QC: -1248$")
        print("   - Impôt QC: -2174$")
        print("   - Crédit solidarité: 926$")
        print("   - Régime fiscal fédéral: -1822$")
        print("   - Impôt fédéral: -2067$")
        print("   - Crédit TPS: 245$")
        print("   - Cotisations: -5647$")
        print("   - AE: -706$")
        print("   - RQAP: -264$")
        print("   - RRQ: -3201$")
        print()
        
        # Vérifier l'écart
        if 'revenu_disponible' in results:
            ecart = results['revenu_disponible'] - 44801
            if abs(ecart) > 100:
                print(f"❌ ÉCART MAJEUR: {results['revenu_disponible']}$ vs 44801$ attendu (écart: {ecart}$)")
                print("\n🔍 PROBLÈME POSSIBLE:")
                print("   - Le scraper pourrait remplir incorrectement les revenus du couple")
                print("   - Vérifier si les deux revenus sont bien séparés (53518$ et 0$)")
                print("   - Ou si le scraper met 53518$ pour chaque personne")
            else:
                print(f"✅ Revenu disponible correct: {results['revenu_disponible']}$")
                
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        input("\n⏸️  Appuyez sur Entrée pour fermer le navigateur...")
        scraper.close()

if __name__ == "__main__":
    main()