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
   * Crédit d'impôt pour solidarité du Québec 2025
   * 
   * Crédit remboursable comprenant trois composantes:
   * - TVQ: Compense l'effet de la taxe sur le pouvoir d'achat
   * - Logement: Pour propriétaires, locataires ou sous-locataires
   * - Village nordique: Coût de la vie plus élevé (14 villages)
   * 
   * Sources:
   * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2024-2025.html
   * - https://hellosafe.ca/outils/credit-impot-pour-solidarite
   */
  solidarity: {
    tvq_component: {
      base_amount: 346, // Montant de base 2025
      spouse_amount: 346, // Montant conjoint
      single_additional: 164 // Supplément personne seule
    },
    housing_component: {
      couple_amount: 863, // Montant couple
      single_amount: 711, // Montant personne seule/parent monoparental
      child_amount: 151 // Par enfant à charge
    },
    northern_village_component: {
      adult_amount: 2033, // Par adulte en village nordique
      child_amount: 439 // Par enfant en village nordique
    },
    reduction: {
      threshold: 41150, // Seuil de réduction 2025
      rate: 0.06, // Taux de réduction 6%
      single_component_rate: 0.03 // Taux réduit 3% (une seule composante)
    }
  },

  /**
   * Prime au travail du Québec 2025
   * 
   * Crédit d'impôt remboursable pour soutenir et valoriser l'effort de travail
   * et inciter les personnes à quitter l'aide financière de dernier recours.
   * 
   * Sources:
   * - https://www.revenuquebec.ca/en/citizens/tax-credits/work-premium-tax-credits/
   * - https://www.budget.finances.gouv.qc.ca/budget/outils/depenses-fiscales/fiches/fiche-110905.asp
   */
  work_premium: {
    minimum_work_income: {
      single: 2400, // Revenu minimum requis pour personne seule
      couple: 3600  // Revenu minimum requis pour couple
    },
    maximum_amounts: {
      single: 1175, // Montant maximum pour personne seule (indexé 2025)
      single_parent: 3040, // Montant maximum pour parent seul
      couple_with_children: 3950, // Montant maximum pour couple avec enfants
      couple_without_children: 1175 // Montant maximum pour couple sans enfants
    },
    growth_rates: {
      no_children: 0.116, // Taux de croissance 11.6% pour ménages sans enfants
      with_children: 0.25  // Taux de croissance 25% pour ménages avec enfants
    },
    reduction: {
      rate: 0.10, // Taux de réduction 10%
      thresholds: {
        single: 23260, // Seuil de réduction pour personne seule
        single_parent: 41000, // Seuil de réduction pour parent seul
        couple_with_children: 58950, // Seuil de réduction pour couple avec enfants
        couple_without_children: 35200 // Seuil de réduction pour couple sans enfants
      }
    },
    excluded_work_income: {
      single: 2400, // Revenu de travail exclu pour personne seule
      couple: 3600  // Revenu de travail exclu pour couple
    }
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
  },
  /**
   * Allocation famille du Québec 2025
   * 
   * Montants et seuils pour la période de versement juillet 2025 à juin 2026
   * (basé sur le revenu familial net de 2024)
   * 
   * Sources:
   * - Retraite Québec
   * - Chaire en fiscalité et en finances publiques (CFFP)
   */
  family_allowance: {
    basic_allowance: {
      max_amount: 3006,
      min_amount: 1196
    },
    single_parent_supplement: {
      max_amount: 1055,
      min_amount: 421
    },
    school_supplies_supplement: {
      amount: 124,
      min_age: 4,
      max_age: 16
    },
    disabled_child_supplement: {
      basic_amount: 2836, // Estimé avec indexation
      exceptional_care_tier1: 14324, // Estimé avec indexation
      exceptional_care_tier2: 9535 // Estimé avec indexation
    },
    reduction: {
      thresholds: {
        couple: 59369,
        single_parent: 43280
      },
      rate: 0.04
    }
  },
  /**
   * Allocation canadienne pour enfants (ACE) 2025
   * 
   * Période de versement: juillet 2025 à juin 2026
   * Basé sur le revenu familial net ajusté de 2024
   * 
   * Sources:
   * - Agence du revenu du Canada (montants indexés)
   * - Calculateur officiel ARC
   */
  canada_child_benefit: {
    base_amounts: {
      under_6: 7997,      // Maximum annuel pour enfants < 6 ans
      age_6_to_17: 6748   // Maximum annuel pour enfants 6-17 ans
    },
    disability_benefit: {
      amount: 3411        // Prestation pour enfants handicapés
    },
    thresholds: {
      first: 37487,       // Seuil pour réduction phase 1
      second: 81222       // Seuil pour réduction phase 2
    },
    reduction_rates: {
      first_phase: {      // Taux de réduction entre seuil 1 et 2
        one_child: 0.07,
        two_children: 0.135,
        three_children: 0.19,
        four_plus_children: 0.23
      },
      second_phase: {     // Taux de réduction après seuil 2
        one_child: 0.032,
        two_children: 0.057,
        three_children: 0.08,
        four_plus_children: 0.095
      }
    }
  },
  gst_credit: {
    base_amount: 349,              // Montant de base pour un adulte
    spouse_amount: 349,            // Montant pour conjoint ou personne à charge admissible
    child_amount: 184,             // Montant par enfant
    single_income_threshold: 11337, // Seuil de revenu pour supplément de célibataire
    single_supplement_rate: 0.02,  // Taux de 2% pour le supplément
    single_supplement_max: 184,    // Maximum du supplément pour célibataire
    family_income_threshold: 45521, // Seuil de revenu familial pour réduction
    reduction_rate: 0.05           // Taux de réduction de 5%
  },

  /**
   * Allocation canadienne pour les travailleurs (ACT) - Canada Workers Benefit (CWB) 2025
   * Source: https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-travailleurs.html
   */
  canada_workers: {
    basic_amount: {
      single_max: 1633,             // Montant maximal pour célibataires
      family_max: 2813,             // Montant maximal pour familles
      single_parent_max: 1633,      // Montant maximal parent seul (estimation)
      family_with_children_max: 2813 // Montant maximal couple avec enfants (estimation)
    },
    disability_supplement: {
      max_amount: 843               // Supplément maximal pour personnes handicapées
    },
    income_thresholds: {
      minimum_work_income: 3000,    // Revenu minimum de travail requis
      minimum_work_income_couple: 3000, // Revenu minimum de travail couples (estimation)
      phase_in_start: 0,            // Début de l'accumulation
      phase_out_start_single: 26855, // Début de réduction pour célibataires
      phase_out_start_family: 30639, // Début de réduction pour familles
      phase_out_start_single_parent: 26855, // Début de réduction parent seul (estimation)
      phase_out_start_family_children: 30639, // Début de réduction couple avec enfants (estimation)
      phase_out_end_single: 37740,   // Fin d'admissibilité pour célibataires (supplément invalidité)
      phase_out_end_family: 49389,   // Fin d'admissibilité pour familles (supplément invalidité)
      disability_phase_out_start_single: 37740, // Début réduction supplément invalidité (célibataires)
      disability_phase_out_start_family: 49389,  // Début réduction supplément invalidité (familles)
      disability_phase_out_end_single: 49011,    // Fin supplément invalidité (célibataires)
      disability_phase_out_end_family: 60620     // Fin supplément invalidité (familles)
    },
    calculation_rates: {
      phase_in_rate: 0.27,          // Taux d'accumulation de 27%
      phase_in_rate_single_parent: 0.27, // Taux pour parent seul (estimation)
      phase_in_rate_family_children: 0.27, // Taux couple avec enfants (estimation)
      phase_out_rate: 0.15,         // Taux de réduction de 15%
      disability_phase_out_rate: 0.075 // Taux de réduction du supplément invalidité 7.5%
    },
    secondary_earner_exemption: 14000 // Exemption conjoint secondaire
  },

  /**
   * Supplément remboursable pour frais médicaux fédéral 2025
   * Sources: Estimations basées sur l'indexation et tendances historiques
   */
  medical_expense_supplement_federal: {
    maximum_amount: 1500,                    // Montant maximal du supplément (estimation)
    minimum_work_income: 4400,               // Revenu de travail minimum requis (estimation)
    reduction_threshold: 33300,              // Seuil de réduction du revenu familial net (estimation)
    reduction_rate: 0.05,                    // Taux de réduction (5%)
    medical_expense_rate: 0.25,              // Taux de crédit sur frais médicaux (25%)
    phase_out_end: 63300                     // Seuil d'élimination complète (estimation)
  },

  /**
   * Crédit d'impôt remboursable pour frais médicaux - Québec 2025
   * Sources: Budget Finances Québec, CFFP
   */
  medical_expense_supplement_quebec: {
    maximum_amount: 1466,                    // Montant maximal du crédit
    minimum_work_income: 3750,               // Revenu de travail minimum requis
    reduction_threshold: 28335,              // Seuil de réduction du revenu familial net
    reduction_rate: 0.05,                    // Taux de réduction (5%)
    medical_expense_rate: 0.25,              // Taux de crédit sur frais médicaux (25%)
    phase_out_end: 57650                     // Seuil d'élimination complète (estimation)
  },

  /**
   * Supplément pour l'achat de fournitures scolaires 2025
   * 
   * Aide financière automatique pour les enfants d'âge scolaire.
   * Montant fixe par enfant éligible, non conditionnel au revenu.
   * 
   * Sources:
   * - Retraite Québec: https://www.retraitequebec.gouv.qc.ca/fr/enfants/Pages/supplement-achat-fournitures-scolaires.aspx
   * - Calculateur MFQ: https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp
   */
  school_supplies_supplement: {
    amount: 124,                    // Montant par enfant éligible 2025
    min_age: 4,                     // Âge minimum (4 ans au 30 septembre)
    max_age: 16,                    // Âge maximum standard (16 ans au 30 septembre)
    max_age_with_disability: 17     // Âge maximum si supplément enfant handicapé
  },

  /**
   * Crédit d'impôt pour le soutien aux aînés 2025
   * 
   * Crédit d'impôt remboursable du Québec pour les personnes âgées de 70 ans et plus.
   * 
   * Sources:
   * - Revenu Québec: https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credit-dimpot-pour-soutien-aux-aines/
   * - Budget Québec: Dépenses fiscales 2024 (fiche 110108)
   * - CFFP: Guide des mesures fiscales
   */
  senior_support: {
    min_age: 70,                    // Âge minimum requis (70 ans au 31 décembre)
    max_credit: {
      single: 2000,                 // Crédit maximal personne seule
      couple: 4000                  // Crédit maximal couple (2000$ par conjoint admissible)
    },
    income_thresholds: {
      single: 27870,                // Seuil de réduction personne seule (estimé avec indexation ~3%)
      couple: 45360                 // Seuil de réduction couple (estimé avec indexation ~3%)
    },
    income_limits: {
      single: 64872,                // Revenu maximum personne seule
      couple: 119344                // Revenu maximum couple
    },
    reduction_rate: 0.0540          // Taux de réduction 5,40% (2025)
  },

  old_age_security: {
    quarters: {
      q1: {
        max_amount_65_74: 727.67,
        max_amount_75_plus: 800.44,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148451,
        recovery_upper_limit_75_plus: 154196
      },
      q2: {
        max_amount_65_74: 727.67,
        max_amount_75_plus: 800.44,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148451,
        recovery_upper_limit_75_plus: 154196
      },
      q3: {
        max_amount_65_74: 734.95,
        max_amount_75_plus: 808.45,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148541,
        recovery_upper_limit_75_plus: 154196
      },
      q4: {
        max_amount_65_74: 734.95,
        max_amount_75_plus: 808.45,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148541,
        recovery_upper_limit_75_plus: 154196
      }
    },
    recovery_rate: 0.15,
    minimum_residence_years: 10,
    full_pension_years: 40,
    // Supplément de revenu garanti (SRG) / Guaranteed Income Supplement (GIS)
    gis: {
      quarters: {
        q1: {
          single_max_amount: 1086.88,
          single_income_cutoff: 22056,
          single_top_up_cutoff: 10112,
          couple_both_oas_max: 654.23,
          couple_both_oas_income_cutoff: 29136,
          couple_both_oas_top_up_cutoff: 8608,
          couple_one_oas_max: 1086.88,
          couple_one_oas_income_cutoff: 52848,
          couple_one_oas_top_up_cutoff: 20224
        },
        q2: {
          single_max_amount: 1086.88,
          single_income_cutoff: 22056,
          single_top_up_cutoff: 10112,
          couple_both_oas_max: 654.23,
          couple_both_oas_income_cutoff: 29136,
          couple_both_oas_top_up_cutoff: 8608,
          couple_one_oas_max: 1086.88,
          couple_one_oas_income_cutoff: 52848,
          couple_one_oas_top_up_cutoff: 20224
        },
        q3: {
          single_max_amount: 1097.75,
          single_income_cutoff: 22272,
          single_top_up_cutoff: 10208,
          couple_both_oas_max: 660.78,
          couple_both_oas_income_cutoff: 29424,
          couple_both_oas_top_up_cutoff: 8704,
          couple_one_oas_max: 1097.75,
          couple_one_oas_income_cutoff: 53376,
          couple_one_oas_top_up_cutoff: 20416
        },
        q4: {
          single_max_amount: 1097.75,
          single_income_cutoff: 22272,
          single_top_up_cutoff: 10208,
          couple_both_oas_max: 660.78,
          couple_both_oas_income_cutoff: 29424,
          couple_both_oas_top_up_cutoff: 8704,
          couple_one_oas_max: 1097.75,
          couple_one_oas_income_cutoff: 53376,
          couple_one_oas_top_up_cutoff: 20416
        }
      },
      employment_income_exemption: {
        first_exemption: 5000,      // Premier 5 000 $ de revenu d'emploi
        partial_exemption: 15000,   // 50% du revenu entre 5 000 $ et 15 000 $
        partial_rate: 0.50
      },
      reduction_rate: 0.50  // 0.50 $ de réduction par dollar de revenu
    }
  },

  /**
   * Aide sociale du Québec
   * 
   * Programme d'assistance financière de dernier recours pour les personnes 
   * et familles dans le besoin au Québec.
   * 
   * Source: Ministère de l'Emploi et de la Solidarité sociale du Québec
   * https://www.quebec.ca/famille-et-soutien-aux-personnes/aide-sociale-et-solidarite-sociale/montants-prestations-aide-sociale
   */
  social_assistance: {
    aide_sociale: {
      single_adult: {
        base: 784,                      // Montant officiel 2025
        adjustment: 45,                 // Ajustement officiel 2025
        temp_constraint_amount: 166     // Allocation contrainte temporaire
      },
      single_with_parents: {
        base: 681,                      // Base réduite pour personne vivant avec parents
        adjustment: 45,
        temp_constraint_amount: 166
      },
      couple: {
        base: 1216,                     // Montant couple 2025
        adjustment: 45,
        temp_constraint_amount: 291     // Allocation contrainte temporaire couple
      },
      couple_with_parents: {
        base: 1113,
        adjustment: 45,
        temp_constraint_amount: 291
      },
      couple_one_constraint: {
        temp_constraint_amount: 166
      }
    },
    solidarite_sociale: {
      single_adult: {
        base: 1191,                     // Montant solidarité sociale 2025
        adjustment: 103                 // Ajustement solidarité sociale
      },
      single_with_parents: {
        base: 1088,
        adjustment: 103
      },
      couple: {
        base: 1787,                     // Montant couple solidarité sociale 2025
        adjustment: 103                 // Ajustement solidarité sociale
      },
      couple_with_parents: {
        base: 1684,
        adjustment: 103
      }
    },
    objectif_emploi: {
      single_adjustment: 45             // Ajustement programme objectif emploi
    },
    work_income_exemption: {
      single: 200,                      // Exemption revenus de travail mensuelle
      couple: 300
    },
    work_income_supplement_rate: 0.25,         // 25% de supplément (entrée en vigueur 2025)
    work_income_supplement_start_year: 2025,   // Année d'entrée en vigueur
    work_income_supplement_max_monthly: 200,   // Maximum mensuel du supplément
    liquid_asset_limits: {
      single_no_children: 913,          // Montants indexés 2025
      single_with_children: 1379,
      couple_no_children: 1379,
      couple_with_children: 1845
    }
  },

  /**
   * Crédit d'impôt pour frais de garde d'enfants - Québec 2025
   * 
   * Sources:
   * - Budget Finances Québec
   * - CFFP Université de Sherbrooke
   * - Revenu Québec
   */
  childcare_tax_credit: {
    max_expenses: {
      disabled_child: 16800,            // Maximum pour enfant handicapé
      under_7: 12275,                   // Maximum pour enfant de moins de 7 ans
      other_children: 6180              // Maximum pour autres enfants éligibles
    },
    rate_schedule: [
      { income_min: 0, income_max: 24795, rate: 0.78 },           // 78% jusqu'à 24 795$
      { income_min: 24795, income_max: 31310, rate: 0.77 },       // 77%
      { income_min: 31310, income_max: 37825, rate: 0.76 },       // 76%
      { income_min: 37825, income_max: 44340, rate: 0.75 },       // 75%
      { income_min: 44340, income_max: 50855, rate: 0.74 },       // 74%
      { income_min: 50855, income_max: 57370, rate: 0.73 },       // 73%
      { income_min: 57370, income_max: 63885, rate: 0.72 },       // 72%
      { income_min: 63885, income_max: 70400, rate: 0.71 },       // 71%
      { income_min: 70400, income_max: 76915, rate: 0.70 },       // 70%
      { income_min: 76915, income_max: 83430, rate: 0.69 },       // 69%
      { income_min: 83430, income_max: 89945, rate: 0.68 },       // 68%
      { income_min: 89945, income_max: 119835, rate: 0.67 },      // 67% jusqu'à 119 835$
      { income_min: 119835, income_max: 999999999, rate: 0.67 }   // 67% au-delà
    ]
  },
  /**
   * Allocation-logement du Québec 2025
   * 
   * Paramètres indexés selon l'inflation (estimations basées sur 2024).
   * Les seuils sont généralement indexés annuellement.
   * 
   * Sources:
   * - Revenu Québec: Programme allocation-logement
   * - Indexation estimée à +3% par rapport à 2024
   */
  housing_allowance: {
    max_liquid_assets: 50000,
    amounts: {
      tier_30_49: 100,    // Maintenu à 100$ jusqu'en septembre 2027
      tier_50_79: 155,    // 150$ + indexation estimée
      tier_80_plus: 175   // 170$ + indexation estimée
    },
    thresholds: {
      single_no_children: 25173,        // 24440$ + indexation (~3%)
      couple_no_children: 34546,        // 33540$ + indexation
      single_parent_1_2_children: 41962,  // 40740$ + indexation
      single_parent_3plus_children: 48039, // 46640$ + indexation
      couple_1_child: 41962,            // 40740$ + indexation
      couple_2plus_children: 48039      // 46640$ + indexation
    },
    reduction_threshold_ratio: 0.85     // Ratio maintenu
  }
}