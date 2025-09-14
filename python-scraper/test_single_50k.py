#!/usr/bin/env python
"""
Test spécifique : personne seule, 35 ans, 50000$ de revenu
"""

from mfq_scraper_simple import MFQScraperSimple
import json

def test_single_50k():
    """Test pour personne seule 35 ans avec 50000$ de revenu"""
    
    household = {
        'householdType': 'single',
        'primaryPerson': {
            'age': 35,
            'grossWorkIncome': 50000,
            'grossRetirementIncome': 0,
            'isRetired': False
        },
        'spouse': None,
        'numChildren': 0,
        'taxYear': 2024
    }
    
    print("🧪 TEST CALCULATEUR MFQ OFFICIEL")
    print("=" * 60)
    print("📊 Configuration:")
    print("   - Type: Personne vivant seule")
    print("   - Âge: 35 ans")
    print("   - Revenu brut de travail: 50 000$")
    print("   - Année: 2024")
    print()
    
    scraper = MFQScraperSimple(headless=True)
    try:
        print("🔍 Lancement du scraper...")
        results = scraper.scrape(household)
        
        if results.get('success'):
            print("\n✅ RÉSULTATS DU CALCULATEUR OFFICIEL MFQ (2024):")
            print("=" * 60)
            
            # Afficher le revenu disponible en premier
            print(f"\n💰 REVENU DISPONIBLE: {results.get('revenu_disponible', 0):,.0f}$")
            
            # Régime fiscal du Québec
            print("\n🏛️ RÉGIME FISCAL DU QUÉBEC:")
            print("-" * 40)
            print(f"{'Régime fiscal QC (net)':30} : {results.get('qc_impot_total', 0):>10,.0f}$")
            print(f"{'Impôt sur le revenu QC':30} : {results.get('qc_impot', 0):>10,.0f}$")
            print(f"{'Crédit pour la solidarité':30} : {results.get('qc_solidarite', 0):>10,.0f}$")
            print(f"{'Prime au travail':30} : {results.get('qc_prime_travail', 0):>10,.0f}$")
            print(f"{'Allocation famille':30} : {results.get('qc_allocation_famille', 0):>10,.0f}$")
            print(f"{'Allocation-logement':30} : {results.get('qc_allocation_logement', 0):>10,.0f}$")
            
            # Régime fiscal fédéral
            print("\n🍁 RÉGIME FISCAL FÉDÉRAL:")
            print("-" * 40)
            print(f"{'Régime fiscal fédéral (net)':30} : {results.get('ca_impot_total', 0):>10,.0f}$")
            print(f"{'Impôt sur le revenu fédéral':30} : {results.get('ca_impot', 0):>10,.0f}$")
            print(f"{'Crédit pour la TPS':30} : {results.get('ca_tps', 0):>10,.0f}$")
            print(f"{'ACT (travailleurs)':30} : {results.get('ca_pfrt', 0):>10,.0f}$")
            
            # Cotisations
            print("\n💼 COTISATIONS:")
            print("-" * 40)
            print(f"{'Cotisations totales':30} : {results.get('cotisations_total', 0):>10,.0f}$")
            print(f"{'Assurance-emploi':30} : {results.get('ae_total', 0):>10,.0f}$")
            print(f"{'RRQ':30} : {results.get('rrq_total', 0):>10,.0f}$")
            print(f"{'RQAP':30} : {results.get('rqap_total', 0):>10,.0f}$")
            print(f"{'RAMQ':30} : {results.get('ramq', 0):>10,.0f}$")
            print(f"{'FSS':30} : {results.get('fss', 0):>10,.0f}$")
            
            # Résumé
            print("\n📊 RÉSUMÉ:")
            print("-" * 40)
            revenu_brut = 50000
            revenu_disponible = results.get('revenu_disponible', 0)
            total_deductions = revenu_brut - revenu_disponible
            taux_effectif = (total_deductions / revenu_brut) * 100 if revenu_brut > 0 else 0
            
            print(f"Revenu brut:        {revenu_brut:>10,.0f}$")
            print(f"Revenu disponible:  {revenu_disponible:>10,.0f}$")
            print(f"Total déductions:   {total_deductions:>10,.0f}$")
            print(f"Taux effectif:      {taux_effectif:>10.1f}%")
            
        else:
            print(f"❌ Erreur: {results.get('error')}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
    finally:
        scraper.close()

if __name__ == "__main__":
    test_single_50k()