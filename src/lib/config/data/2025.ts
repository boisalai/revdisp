/**
 * Configuration fiscale 2025 pour le Québec
 * 
 * Sources officielles:
 * - Gouvernement du Canada - Assurance-emploi: https://www.canada.ca/fr/emploi-developpement-social/nouvelles/2024/09/la-commission-de-lassurance-emploi-du-canada-confirme-le-taux-de-cotisation-2025-a-lassurance-emploi.html
 * - Revenu Québec - RQAP: https://www.revenuquebec.ca/fr/entreprises/retenues-et-cotisations-de-lemployeur/calculer-les-retenues-et-les-cotisations/cotisations-au-regime-quebecois-dassurance-parentale/maximum-de-la-remuneration-assurable-et-taux-de-cotisation/
 * - Régie des rentes du Québec: https://www.rrq.gouv.qc.ca/fr/programmes/regime_rentes/cotisations/Pages/cotisations.aspx
 */

import { TaxYearConfig } from '../types'

export const config2025: TaxYearConfig = {
  year: 2025,
  
  /**
   * Impôt fédéral - paramètres officiels 2025
   */
  federal_tax: {
    tax_brackets: [
      { min: 0, max: 57375, rate: 0.145 }, // Taux réduit de 15% à 14.5% en 2025
      { min: 57375, max: 114750, rate: 0.205 },
      { min: 114750, max: 177882, rate: 0.26 },
      { min: 177882, max: 253414, rate: 0.2931 },
      { min: 253414, max: 999999999, rate: 0.33 }
    ],
    credits: {
      basic_amount: 16129,
      age_65_amount: 8790,
      pension_amount: 2000,
      living_alone_amount: 0
    }
  },
  
  /**
   * Impôt du Québec - paramètres provisoires (indexation estimée)
   */
  quebec_tax: {
    tax_brackets: [
      { min: 0, max: 52355, rate: 0.12 },
      { min: 52356, max: 104700, rate: 0.16 },
      { min: 104701, max: 127430, rate: 0.24 },
      { min: 127431, max: Infinity, rate: 0.2575 }
    ],
    credits: {
      basic_amount: 18571, // Montant officiel CFFP 2025
      age_65_amount: 3395, // À confirmer avec sources officielles
      pension_amount: 3017, // À confirmer avec sources officielles
      living_alone_amount: 1890 // À confirmer avec sources officielles
    },
    deduction_rates: {
      cpp: 1.0, // 100% déductible
      ei: 1.0,
      qpip: 1.0
    }
  },

  /**
   * Assurance-emploi fédérale pour les résidents du Québec
   * 
   * Taux réduit pour le Québec (RQAP): 1.31%
   * Taux employeur: 1.83% (1.4 × taux employé)
   * Maximum de la rémunération assurable: 65 700 $
   * 
   * Source: Commission de l'assurance-emploi du Canada (septembre 2024)
   */
  employment_insurance: {
    max_insurable_earnings: 65700,
    employee_rate: 0.0131, // 1.31% (taux réduit pour le Québec)
    max_employee_contribution: 860.67, // 65700 × 1.31%
    min_insurable_earnings: 2000,
    employer_rate_multiplier: 1.4, // Employeur paie 1.4× le taux employé
    quebec_reduction: 0.0033 // Réduction de 0.33% pour les résidents du Québec
  },

  /**
   * Régime québécois d'assurance parentale (RQAP)
   * 
   * Taux employé: 0.494%
   * Taux employeur: 0.692%
   * Taux travailleur autonome: 0.878%
   * Maximum de la rémunération assurable: 98 000 $
   * 
   * Source: Revenu Québec
   */
  qpip: {
    max_insurable_earnings: 98000,
    employee_rate: 0.00494, // 0.494%
    employer_rate: 0.00692, // 0.692%
    self_employed_rate: 0.00878, // 0.878%
    min_earnings: 2000
  },

  /**
   * Régime de rentes du Québec (RRQ)
   * 
   * Paramètres officiels 2025 selon Retraite Québec
   */
  qpp: {
    basic_exemption: 3500,
    max_pensionable_earnings: 71300, // Officiel 2025
    max_additional_earnings: 76100, // Estimation indexée
    base_rate: 0.054, // 5.40% base
    additional_rate_first: 0.01, // 1.00% supplémentaire
    additional_rate_second: 0.01, // 1.00% deuxième tranche (identique)
    self_employed_multiplier: 2.0 // Travailleur autonome paie 2×
  },

  /**
   * Fonds des services de santé (FSS)
   * Applicable aux personnes de 65 ans et plus
   * 
   * Note: Paramètres 2025 non annoncés, estimation indexée
   */
  fss: {
    first_threshold: 17500, // Estimation indexée
    second_threshold: 127000, // Estimation indexée
    rate: 0.01, // 1.0%
    base_contribution: 0,
    max_contribution: 1000
  },

  /**
   * Régime d'assurance médicaments du Québec (RAMQ)
   * 
   * Note: Paramètres 2025 non annoncés, estimation indexée basée sur 2024
   */
  ramq: {
    max_contribution: 744,
    exemption_single: 19790, // Maintenu pour 2025
    exemption_couple: 32080, // Maintenu pour 2025
    exemption_single_one_child: 32080,
    exemption_single_multiple_children: 36185,
    exemption_couple_one_child: 36185,
    exemption_couple_multiple_children: 39975,
    first_threshold: 5000,
    base_rate_single: 0.0747,
    additional_rate_single: 0.1122,
    base_rate_couple: 0.0375,
    additional_rate_couple: 0.0562,
    base_max_single: 373.50,
    base_max_couple: 186.75,
    monthly_adjustment: 60.92
  }
}