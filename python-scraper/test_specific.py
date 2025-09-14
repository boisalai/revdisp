#!/usr/bin/env python
"""
Test spécifique pour le cas: single, 51 ans, 14868$ de revenu
Pour vérifier que nous capturons bien l'allocation-logement et autres valeurs
"""

from calculator_scraper import QuebecCalculatorScraper
import json

def main():
    """Test avec le cas exact de l'utilisateur"""
    
    # Configuration exacte du test (format attendu par le scraper)
    household = {
        'householdType': 'single',
        'primaryPerson': {
            'age': 51,
            'grossWorkIncome': 14868,
            'grossRetirementIncome': 0,
            'isRetired': False
        },
        'spouse': None,
        'numChildren': 0,
        'taxYear': 2024
    }
    
    print("🧪 TEST SPÉCIFIQUE - Personne seule, 51 ans, 14868$")
    print("=" * 60)
    print(f"📊 Configuration:")
    print(f"   - Type: {household['householdType']}")
    print(f"   - Âge: {household['primaryPerson']['age']} ans")
    print(f"   - Revenus travail: {household['primaryPerson']['grossWorkIncome']}$")
    print()
    
    # Lancer le scraper
    scraper = QuebecCalculatorScraper()
    try:
        results = scraper.scrape_calculator(household)
        
        print("✅ Résultats extraits:")
        print("=" * 60)
        
        # Afficher tous les résultats trouvés
        for key, value in sorted(results.items()):
            if key not in ['timestamp', 'success', 'error']:
                if value is not None and value != 0:
                    print(f"   {key}: {value}")
        
        print()
        print("📋 Valeurs attendues selon la capture d'écran:")
        print("   - Revenu disponible: 21826$")
        print("   - Régime fiscal QC: 4021$")
        print("   - Prime au travail: 1000$")
        print("   - Crédit solidarité: 1221$")
        print("   - Allocation-logement: 1800$ ⚠️")
        print("   - Régime fiscal fédéral: 3935$")
        print("   - Crédit TPS: 414$")
        print("   - ACT: 3520$")
        print("   - Cotisations: -997$")
        print()
        
        # Vérifier si allocation-logement est capturée
        if 'qc_allocation_logement' in results:
            if results['qc_allocation_logement'] == 1800:
                print("✅ Allocation-logement correctement capturée!")
            else:
                print(f"❌ Allocation-logement incorrecte: {results['qc_allocation_logement']}$ vs 1800$ attendu")
        else:
            print("❌ Allocation-logement NON capturée dans les résultats")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
    finally:
        scraper.close()

if __name__ == "__main__":
    main()