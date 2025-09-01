import { TaxYearConfig } from '../types'

/**
 * Configuration fiscale 2024 - Québec et Canada
 * Sources: Ministère des Finances du Québec et Agence du revenu du Canada
 */
export const config2024: TaxYearConfig = {
  year: 2024,
  federal_tax: {
    tax_brackets: [
      { min: 0, max: 55867, rate: 0.15 },
      { min: 55867, max: 111733, rate: 0.205 },
      { min: 111733, max: 173205, rate: 0.26 },
      { min: 173205, max: 246752, rate: 0.2932 },
      { min: 246752, max: 999999999, rate: 0.33 }
    ],
    credits: {
      basic_amount: 15705,
      age_65_amount: 8790,
      pension_amount: 2000,
      living_alone_amount: 0
    }
  },
  quebec_tax: {
    tax_brackets: [
      { min: 0, max: 49275, rate: 0.14 },
      { min: 49275, max: 98540, rate: 0.19 },
      { min: 98540, max: 119910, rate: 0.24 },
      { min: 119910, max: 999999999, rate: 0.2575 }
    ],
    credits: {
      basic_amount: 18056, // Mis à jour selon la source CFFP 2024
      age_65_amount: 3395,
      pension_amount: 3017,
      living_alone_amount: 1890
    },
    deduction_rates: {
      cpp: 1.0, // 100% déductible (RRQ au Québec)
      ei: 1.0,  // 100% déductible (assurance-emploi)
      qpip: 1.0 // 100% déductible (RQAP)
    }
  },
  /**
   * Assurance-emploi fédérale pour les résidents du Québec
   * 
   * Taux réduit pour le Québec (RQAP): 1.32%
   * Taux employeur: 1.85% (1.4 × taux employé)
   * Maximum de la rémunération assurable: 63 200 $
   * 
   * Source: Commission de l'assurance-emploi du Canada
   */
  employment_insurance: {
    max_insurable_earnings: 63200,
    employee_rate: 0.0132, // 1.32% (taux réduit pour le Québec)
    max_employee_contribution: 834.24, // 63200 × 1.32%
    min_insurable_earnings: 2000,
    employer_rate_multiplier: 1.4, // Employeur paie 1.4× le taux employé
    quebec_reduction: 0.0034 // Réduction de 0.34% pour les résidents du Québec
  },
  qpip: {
    max_insurable_earnings: 94000,
    employee_rate: 0.00494,
    employer_rate: 0.00692,
    self_employed_rate: 0.00878,
    min_earnings: 2000
  },
  qpp: {
    basic_exemption: 3500,
    max_pensionable_earnings: 68500,
    max_additional_earnings: 73200,
    base_rate: 0.054, // 5.40% base
    additional_rate_first: 0.01, // 1.00% supplémentaire
    additional_rate_second: 0.01, // 1.00% deuxième tranche (identique)
    self_employed_multiplier: 2.0
  },
  fss: {
    first_threshold: 17630,
    second_threshold: 61315,
    rate: 0.01,
    base_contribution: 150,
    max_contribution: 1000
  },

  /**
   * Crédit d'impôt pour solidarité du Québec 2024
   * 
   * Sources:
   * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2024-2025.html
   */
  solidarity: {
    tvq_component: {
      base_amount: 346,
      spouse_amount: 346,
      single_additional: 164
    },
    housing_component: {
      couple_amount: 863,
      single_amount: 711,
      child_amount: 151
    },
    northern_village_component: {
      adult_amount: 2033,
      child_amount: 439
    },
    reduction: {
      threshold: 41150,
      rate: 0.06,
      single_component_rate: 0.03
    }
  },

  /**
   * Prime au travail du Québec 2024
   * 
   * Sources:
   * - https://www.revenuquebec.ca/en/citizens/tax-credits/work-premium-tax-credits/
   */
  work_premium: {
    minimum_work_income: {
      single: 2400,
      couple: 3600
    },
    maximum_amounts: {
      single: 1152, // Montant confirmé 2024
      single_parent: 2980, // Montant confirmé 2024
      couple_with_children: 3873, // Montant confirmé 2024
      couple_without_children: 1152
    },
    growth_rates: {
      no_children: 0.116,
      with_children: 0.25
    },
    reduction: {
      rate: 0.10,
      thresholds: {
        single: 22795, // Montant confirmé 2024
        single_parent: 40168, // Montant confirmé 2024
        couple_with_children: 57822,
        couple_without_children: 34500
      }
    },
    excluded_work_income: {
      single: 2400,
      couple: 3600
    }
  },

  ramq: {
    max_contribution: 737.50,
    exemption_single: 19790,
    exemption_couple: 32080,
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
   * Allocation famille du Québec 2024
   * 
   * Montants et seuils pour la période de versement juillet 2024 à juin 2025
   * (basé sur le revenu familial net de 2023)
   * 
   * Sources:
   * - Retraite Québec
   * - Chaire en fiscalité et en finances publiques (CFFP)
   */
  family_allowance: {
    basic_allowance: {
      max_amount: 2923,
      min_amount: 1158
    },
    single_parent_supplement: {
      max_amount: 1024,
      min_amount: 408
    },
    school_supplies_supplement: {
      amount: 121,
      min_age: 4,
      max_age: 16
    },
    disabled_child_supplement: {
      basic_amount: 2748,
      exceptional_care_tier1: 13896,
      exceptional_care_tier2: 9240
    },
    reduction: {
      thresholds: {
        couple: 57822,
        single_parent: 42136
      },
      rate: 0.04
    }
  },
  /**
   * Allocation canadienne pour enfants (ACE) 2024
   * 
   * Période de versement: juillet 2024 à juin 2025
   * Basé sur le revenu familial net ajusté de 2023
   * 
   * Sources:
   * - Agence du revenu du Canada
   * - CFFP Université de Sherbrooke
   */
  canada_child_benefit: {
    base_amounts: {
      under_6: 7787,      // Maximum annuel pour enfants < 6 ans
      age_6_to_17: 6570   // Maximum annuel pour enfants 6-17 ans
    },
    disability_benefit: {
      amount: 3322        // Prestation pour enfants handicapés
    },
    thresholds: {
      first: 36502,       // Seuil pour réduction phase 1
      second: 79087       // Seuil pour réduction phase 2
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
    base_amount: 340,              // Montant de base pour un adulte
    spouse_amount: 340,            // Montant pour conjoint ou personne à charge admissible
    child_amount: 179,             // Montant par enfant
    single_income_threshold: 11039, // Seuil de revenu pour supplément de célibataire
    single_supplement_rate: 0.02,  // Taux de 2% pour le supplément
    single_supplement_max: 179,    // Maximum du supplément pour célibataire
    family_income_threshold: 44324, // Seuil de revenu familial pour réduction
    reduction_rate: 0.05           // Taux de réduction de 5%
  },

  /**
   * Allocation canadienne pour les travailleurs (ACT) - Canada Workers Benefit (CWB) 2024
   * Source: https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-travailleurs.html
   */
  canada_workers: {
    basic_amount: {
      single_max: 1590,             // Montant maximal pour célibataires
      family_max: 2739              // Montant maximal pour familles
    },
    disability_supplement: {
      max_amount: 737               // Supplément maximal pour personnes handicapées
    },
    income_thresholds: {
      minimum_work_income: 3000,    // Revenu minimum de travail requis
      phase_in_start: 0,            // Début de l'accumulation
      phase_out_start_single: 26149, // Début de réduction pour célibataires
      phase_out_start_family: 29833, // Début de réduction pour familles
      phase_out_end_single: 65577,   // Fin d'admissibilité pour célibataires
      phase_out_end_family: 65595,   // Fin d'admissibilité pour familles
      disability_phase_out_start_single: 36748, // Début réduction supplément invalidité (célibataires)
      disability_phase_out_start_family: 48091,  // Début réduction supplément invalidité (familles)
      disability_phase_out_end_single: 42222,    // Fin supplément invalidité (célibataires)
      disability_phase_out_end_family: 59038     // Fin supplément invalidité (familles - both disabled)
    },
    calculation_rates: {
      phase_in_rate: 0.27,          // Taux d'accumulation de 27%
      phase_out_rate: 0.15,         // Taux de réduction de 15%
      disability_phase_out_rate: 0.075 // Taux de réduction du supplément invalidité 7.5%
    },
    secondary_earner_exemption: 14000 // Exemption conjoint secondaire
  },

  /**
   * Supplément remboursable pour frais médicaux fédéral 2024
   * Sources: Canada.ca, Agence du revenu du Canada
   */
  medical_expense_supplement_federal: {
    maximum_amount: 1464,                    // Montant maximal du supplément
    minimum_work_income: 4275,               // Revenu de travail minimum requis
    reduction_threshold: 32419,              // Seuil de réduction du revenu familial net
    reduction_rate: 0.05,                    // Taux de réduction (5%)
    medical_expense_rate: 0.25,              // Taux de crédit sur frais médicaux (25%)
    phase_out_end: 61699                     // Seuil d'élimination complète
  },

  /**
   * Crédit d'impôt remboursable pour frais médicaux - Québec 2024
   * Sources: Budget Finances Québec, CFFP
   */
  medical_expense_supplement_quebec: {
    maximum_amount: 1425,                    // Montant maximal du crédit
    minimum_work_income: 3645,               // Revenu de travail minimum requis
    reduction_threshold: 27550,              // Seuil de réduction du revenu familial net
    reduction_rate: 0.05,                    // Taux de réduction (5%)
    medical_expense_rate: 0.25,              // Taux de crédit sur frais médicaux (25%)
    phase_out_end: 56050                     // Seuil d'élimination complète
  },

  /**
   * Supplément pour l'achat de fournitures scolaires 2024
   */
  school_supplies_supplement: {
    amount: 121,                    // Montant par enfant éligible 2024
    min_age: 4,                     // Âge minimum (4 ans au 30 septembre)
    max_age: 16,                    // Âge maximum standard (16 ans au 30 septembre)
    max_age_with_disability: 17     // Âge maximum si supplément enfant handicapé
  },

  /**
   * Crédit d'impôt pour le soutien aux aînés 2024
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
      single: 27065,                // Seuil de réduction personne seule
      couple: 44015                 // Seuil de réduction couple
    },
    income_limits: {
      single: 64730,                // Revenu maximum personne seule
      couple: 119345                // Revenu maximum couple
    },
    reduction_rate: 0.0531          // Taux de réduction 5,31% (2024)
  },

  old_age_security: {
    quarters: {
      q1: {
        max_amount_65_74: 713.34,
        max_amount_75_plus: 784.67,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148065,
        recovery_upper_limit_75_plus: 153771
      },
      q2: {
        max_amount_65_74: 713.34,
        max_amount_75_plus: 784.67,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148065,
        recovery_upper_limit_75_plus: 153771
      },
      q3: {
        max_amount_65_74: 718.33,
        max_amount_75_plus: 790.16,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148264,
        recovery_upper_limit_75_plus: 153991
      },
      q4: {
        max_amount_65_74: 727.67,
        max_amount_75_plus: 800.44,
        recovery_threshold: 90997,
        recovery_upper_limit_65_74: 148451,
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
          single_max_amount: 1026.96,
          single_income_cutoff: 20832,
          single_top_up_cutoff: 9680,
          couple_both_oas_max: 618.15,
          couple_both_oas_income_cutoff: 27552,
          couple_both_oas_top_up_cutoff: 8416,
          couple_one_oas_max: 1026.96,
          couple_one_oas_income_cutoff: 49920,
          couple_one_oas_top_up_cutoff: 19360
        },
        q2: {
          single_max_amount: 1026.96,
          single_income_cutoff: 20832,
          single_top_up_cutoff: 9680,
          couple_both_oas_max: 618.15,
          couple_both_oas_income_cutoff: 27552,
          couple_both_oas_top_up_cutoff: 8416,
          couple_one_oas_max: 1026.96,
          couple_one_oas_income_cutoff: 49920,
          couple_one_oas_top_up_cutoff: 19360
        },
        q3: {
          single_max_amount: 1072.93,
          single_income_cutoff: 21768,
          single_top_up_cutoff: 10016,
          couple_both_oas_max: 645.84,
          couple_both_oas_income_cutoff: 28752,
          couple_both_oas_top_up_cutoff: 8608,
          couple_one_oas_max: 1072.93,
          couple_one_oas_income_cutoff: 52176,
          couple_one_oas_top_up_cutoff: 20032
        },
        q4: {
          single_max_amount: 1086.88,
          single_income_cutoff: 22056,
          single_top_up_cutoff: 10112,
          couple_both_oas_max: 654.23,
          couple_both_oas_income_cutoff: 29136,
          couple_both_oas_top_up_cutoff: 8608,
          couple_one_oas_max: 1086.88,
          couple_one_oas_income_cutoff: 52848,
          couple_one_oas_top_up_cutoff: 20224
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
    aide_sociale: {  // Regular social assistance
      single_adult: {
        base: 762,                      // Prestation de base mensuelle 2024
        adjustment: 45,                 // Ajustement 2024
        temp_constraint_amount: 166     // Allocation contrainte temporaire
      },
      single_with_parents: {
        base: 659,                      // Prestation de base mensuelle (avec parents)
        adjustment: 45,                 // Ajustement
        temp_constraint_amount: 166     // Allocation contrainte temporaire
      },
      couple: {
        base: 1179,                     // Prestation de base mensuelle
        adjustment: 45,                 // Ajustement 2024
        temp_constraint_amount: 285     // Allocation contrainte temporaire (les deux)
      },
      couple_with_parents: {
        base: 1076,                     // Prestation de base mensuelle (avec parents)
        adjustment: 45,                 // Ajustement
        temp_constraint_amount: 285     // Allocation contrainte temporaire (les deux)
      },
      couple_one_constraint: {
        temp_constraint_amount: 166     // Allocation contrainte temporaire (un seul)
      }
    },
    solidarite_sociale: {  // Social solidarity (severe constraints)
      single_adult: {
        base: 1158,                     // Prestation de base mensuelle (estimé 784+374)
        adjustment: 0                   // Ajustement (inclus dans base)
      },
      single_with_parents: {
        base: 1058,                     // Prestation de base mensuelle (estimé 684+374)
        adjustment: 0                   // Ajustement
      },
      couple: {
        base: 1731,                     // Prestation de base mensuelle (estimé 1213+518)
        adjustment: 0                   // Ajustement (inclus dans base)
      },
      couple_with_parents: {
        base: 1631,                     // Prestation de base mensuelle (estimé 1113+518)
        adjustment: 0                   // Ajustement
      }
    },
    objectif_emploi: {
      single_adjustment: 45             // Ajustement personne seule (Programme objectif emploi)
    },
    work_income_exemption: {
      single: 200,                      // Exemption revenus de travail mensuelle - personne seule
      couple: 300                       // Exemption revenus de travail mensuelle - couple
    },
    work_income_supplement_rate: 0.25,         // 25% de supplément (entrée en vigueur 2025)
    work_income_supplement_start_year: 2025,   // Année d'entrée en vigueur
    work_income_supplement_max_monthly: 200,   // Maximum mensuel du supplément
    liquid_asset_limits: {
      single_no_children: 887,          // Personne seule sans enfant
      single_with_children: 1340,       // Personne seule avec enfant(s)
      couple_no_children: 1340,         // Couple sans enfant
      couple_with_children: 1793        // Couple avec enfant(s)
    }
  },

  /**
   * Crédit d'impôt pour frais de garde d'enfants - Québec 2024
   * 
   * Sources:
   * - Budget Finances Québec
   * - CFFP Université de Sherbrooke
   * - Revenu Québec
   */
  childcare_tax_credit: {
    max_expenses: {
      disabled_child: 16335,            // Maximum pour enfant handicapé
      under_7: 11935,                   // Maximum pour enfant de moins de 7 ans
      other_children: 6010              // Maximum pour autres enfants éligibles
    },
    rate_schedule: [
      { income_min: 0, income_max: 24110, rate: 0.78 },           // 78% jusqu'à 24 110$
      { income_min: 24110, income_max: 30470, rate: 0.77 },       // 77%
      { income_min: 30470, income_max: 36835, rate: 0.76 },       // 76%
      { income_min: 36835, income_max: 43200, rate: 0.75 },       // 75%
      { income_min: 43200, income_max: 49560, rate: 0.74 },       // 74%
      { income_min: 49560, income_max: 55925, rate: 0.73 },       // 73%
      { income_min: 55925, income_max: 62285, rate: 0.72 },       // 72%
      { income_min: 62285, income_max: 68650, rate: 0.71 },       // 71%
      { income_min: 68650, income_max: 75010, rate: 0.70 },       // 70%
      { income_min: 75010, income_max: 81375, rate: 0.69 },       // 69%
      { income_min: 81375, income_max: 87735, rate: 0.68 },       // 68%
      { income_min: 87735, income_max: 116515, rate: 0.67 },      // 67% jusqu'à 116 515$
      { income_min: 116515, income_max: 999999999, rate: 0.67 }   // 67% au-delà
    ]
  },
  /**
   * Allocation-logement du Québec 2024
   * 
   * Programme d'aide financière pour les ménages à faible revenu qui consacrent
   * une proportion importante de leur revenu au logement.
   * 
   * Sources:
   * - Revenu Québec: Programme allocation-logement
   * - CFFP: Guide des mesures fiscales
   */
  housing_allowance: {
    max_liquid_assets: 50000,
    amounts: {
      tier_30_49: 100,    // 100$ pour 30-49.9% d'effort
      tier_50_79: 150,    // 150$ pour 50-79.9% d'effort
      tier_80_plus: 170   // 170$ pour 80%+ d'effort
    },
    thresholds: {
      single_no_children: 24440,        // Personne seule 50+ ans
      couple_no_children: 33540,        // Couple sans enfants (50+ ans)
      single_parent_1_2_children: 40740,  // Parent seul, 1-2 enfants
      single_parent_3plus_children: 46640, // Parent seul, 3+ enfants
      couple_1_child: 40740,            // Couple avec 1 enfant
      couple_2plus_children: 46640      // Couple avec 2+ enfants
    },
    reduction_threshold_ratio: 0.85     // Seuil de réduction progressive
  }
} as const