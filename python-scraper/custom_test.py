#!/usr/bin/env python3
"""
Test personnalisé pour personne seule, 35 ans, 45000$ revenus bruts
"""

from calculator_scraper import QuebecCalculatorScraper

def main():
    print("🧪 TEST PERSONNALISÉ - PERSONNE SEULE 35 ANS, 45000$")
    print("=" * 55)
    
    # Configuration du test personnalisé
    household_data = {
        "householdType": "single",
        "primaryPerson": {
            "age": 35,
            "grossWorkIncome": 45000,
            "grossRetirementIncome": 0,
            "isRetired": False
        },
        "spouse": None,
        "children": 0,
        "year": 2024
    }
    
    print(f"📊 Configuration:")
    print(f"   - Type: Personne vivant seule")
    print(f"   - Âge: {household_data['primaryPerson']['age']} ans")
    print(f"   - Revenus: {household_data['primaryPerson']['grossWorkIncome']:,}$")
    print()
    
    try:
        print("🔍 Début du scraping...")
        scraper = QuebecCalculatorScraper(headless=True)
        results = scraper.scrape_calculator(household_data)
        scraper.close()
        
        if results and "revenu_disponible" in results:
            print("✅ Scraping réussi!")
            print("\n📊 RÉSULTATS DÉTAILLÉS:")
            print("=" * 40)
            
            # Formatage des résultats en tableau
            programs = [
                ("Revenu disponible", results.get("revenu_disponible", 0)),
                ("", ""),  # Ligne vide
                ("=== COTISATIONS ===", ""),
                ("Assurance-emploi", results.get("ae_total", 0)),
                ("RRQ", results.get("rrq_total", 0)),
                ("RQAP", results.get("rqap_total", 0)),
                ("FSS", results.get("fss_total", 0)),
                ("RAMQ", results.get("ramq_total", 0)),
                ("", ""),
                ("=== IMPÔTS ===", ""),
                ("Impôt Québec", results.get("qc_impot_total", 0)),
                ("Impôt fédéral", results.get("ca_impot_total", 0)),
                ("", ""),
                ("=== CRÉDITS/ALLOCATIONS ===", ""),
                ("Solidarité QC", results.get("qc_solidarite", 0)),
                ("Crédit TPS", results.get("ca_tps", 0)),
                ("Allocation canadienne enfants", results.get("ca_pfrt", 0)),
                ("Prime au travail QC", results.get("qc_prime_travail", 0)),
            ]
            
            print(f"{'Programme':<35} {'Montant':<12}")
            print("-" * 50)
            
            for program, amount in programs:
                if program == "":
                    print()
                elif "===" in program:
                    print(f"{program}")
                elif program == "Revenu disponible":
                    print(f"{program:<35} {amount:>10.0f} $")
                    print("-" * 50)
                else:
                    if amount != 0:
                        print(f"{program:<35} {amount:>10.0f} $")
            
        else:
            print("❌ Échec du scraping")
            print("Résultats:", results)
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()