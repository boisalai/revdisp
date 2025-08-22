import { TaxYearConfig } from '../types'

/**
 * Configuration fiscale 2023 - Québec et Canada
 * Sources: Ministère des Finances du Québec et Agence du revenu du Canada
 */
export const config2023: TaxYearConfig = {
  year: 2023,
  federal_tax: {
    tax_brackets: [
      { min: 0, max: 53359, rate: 0.15 },
      { min: 53359, max: 106717, rate: 0.205 },
      { min: 106717, max: 165430, rate: 0.26 },
      { min: 165430, max: 235675, rate: 0.2932 },
      { min: 235675, max: 999999999, rate: 0.33 }
    ],
    credits: {
      basic_amount: 15000,
      age_65_amount: 8790,
      pension_amount: 2000,
      living_alone_amount: 0
    }
  },
  quebec_tax: {
    tax_brackets: [
      { min: 0, max: 46295, rate: 0.14 },
      { min: 46295, max: 92580, rate: 0.19 },
      { min: 92580, max: 112655, rate: 0.24 },
      { min: 112655, max: 999999999, rate: 0.2575 }
    ],
    credits: {
      basic_amount: 16495,
      age_65_amount: 3211,
      pension_amount: 3017,
      living_alone_amount: 1890
    },
    deduction_rates: {
      cpp: 1.0,
      ei: 1.0,
      qpip: 1.0
    }
  },
  employment_insurance: {
    max_insurable_earnings: 61500,
    employee_rate: 0.0127,
    max_employee_contribution: 781.05,
    min_insurable_earnings: 2000,
    employer_rate_multiplier: 1.4
  },
  qpip: {
    max_insurable_earnings: 91000,
    employee_rate: 0.00494,
    employer_rate: 0.00692,
    self_employed_rate: 0.00878,
    min_earnings: 2000
  },
  qpp: {
    basic_exemption: 3500,
    max_pensionable_earnings: 66600,
    max_additional_earnings: 66600, // Pas de palier additionnel en 2023
    base_rate: 0.054,
    additional_rate_first: 0.01,
    additional_rate_second: 0.01, // Même taux en 2023
    self_employed_multiplier: 2.0
  },
  fss: {
    first_threshold: 16780,
    second_threshold: 58350,
    rate: 0.01,
    base_contribution: 150,
    max_contribution: 1000
  },

  /**
   * Crédit d'impôt pour solidarité du Québec 2023
   * 
   * Sources:
   * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2023-2024.html
   */
  solidarity: {
    tvq_component: {
      base_amount: 329,
      spouse_amount: 329,
      single_additional: 156
    },
    housing_component: {
      couple_amount: 821,
      single_amount: 677,
      child_amount: 144
    },
    northern_village_component: {
      adult_amount: 1935,
      child_amount: 418
    },
    reduction: {
      threshold: 39160,
      rate: 0.06,
      single_component_rate: 0.03
    }
  },

  /**
   * Prime au travail du Québec 2023
   * 
   * Sources:
   * - Estimations basées sur l'indexation et les paramètres 2024
   */
  work_premium: {
    minimum_work_income: {
      single: 2400,
      couple: 3600
    },
    maximum_amounts: {
      single: 1120, // Estimation 2023
      single_parent: 2900, // Estimation 2023
      couple_with_children: 3770, // Estimation 2023
      couple_without_children: 1120
    },
    growth_rates: {
      no_children: 0.116,
      with_children: 0.25
    },
    reduction: {
      rate: 0.10,
      thresholds: {
        single: 22200, // Estimation 2023
        single_parent: 39100, // Estimation 2023
        couple_with_children: 56300,
        couple_without_children: 33600
      }
    },
    excluded_work_income: {
      single: 2400,
      couple: 3600
    }
  },

  ramq: {
    max_contribution: 720.50,
    exemption_single: 18910,
    exemption_couple: 30640,
    exemption_single_one_child: 30640,
    exemption_single_multiple_children: 34545,
    exemption_couple_one_child: 34545,
    exemption_couple_multiple_children: 38150,
    first_threshold: 5000,
    base_rate_single: 0.0747,
    additional_rate_single: 0.1122,
    base_rate_couple: 0.0375,
    additional_rate_couple: 0.0562,
    base_max_single: 373.50,
    base_max_couple: 186.75,
    monthly_adjustment: 60.04
  },
  /**
   * Allocation famille du Québec 2023
   * 
   * Montants et seuils pour la période de versement juillet 2023 à juin 2024
   * (basé sur le revenu familial net de 2022)
   * 
   * Sources:
   * - Retraite Québec
   * - Calculconversion.com
   */
  family_allowance: {
    basic_allowance: {
      max_amount: 2782,
      min_amount: 1107
    },
    single_parent_supplement: {
      max_amount: 976,
      min_amount: 389
    },
    school_supplies_supplement: {
      amount: 115,
      min_age: 4,
      max_age: 16
    },
    disabled_child_supplement: {
      basic_amount: 2616,
      exceptional_care_tier1: 13224,
      exceptional_care_tier2: 8796
    },
    reduction: {
      thresholds: {
        couple: 55183,
        single_parent: 40168
      },
      rate: 0.04
    }
  },
  /**
   * Allocation canadienne pour enfants (ACE) 2023
   * 
   * Période de versement: juillet 2023 à juin 2024
   * Basé sur le revenu familial net ajusté de 2022
   * 
   * Sources:
   * - Agence du revenu du Canada
   * - Canada.ca: CCB calculation sheet
   */
  canada_child_benefit: {
    base_amounts: {
      under_6: 7437,      // Maximum annuel pour enfants < 6 ans
      age_6_to_17: 6275   // Maximum annuel pour enfants 6-17 ans
    },
    disability_benefit: {
      amount: 3173        // Prestation pour enfants handicapés
    },
    thresholds: {
      first: 34863,       // Seuil pour réduction phase 1
      second: 75537       // Seuil pour réduction phase 2
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
    base_amount: 325,              // Montant de base pour un adulte
    spouse_amount: 325,            // Montant pour conjoint ou personne à charge admissible
    child_amount: 171,             // Montant par enfant
    single_income_threshold: 10544, // Seuil de revenu pour supplément de célibataire
    single_supplement_rate: 0.02,  // Taux de 2% pour le supplément
    single_supplement_max: 171,    // Maximum du supplément pour célibataire
    family_income_threshold: 42335, // Seuil de revenu familial pour réduction
    reduction_rate: 0.05           // Taux de réduction de 5%
  },

  /**
   * Allocation canadienne pour les travailleurs (ACT) - Canada Workers Benefit (CWB) 2023
   * Source: https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-travailleurs.html
   */
  canada_workers: {
    basic_amount: {
      single_max: 1518,             // Montant maximal pour célibataires (estimation)
      family_max: 2616              // Montant maximal pour familles (estimation)
    },
    disability_supplement: {
      max_amount: 700               // Supplément maximal pour personnes handicapées (estimation)
    },
    income_thresholds: {
      minimum_work_income: 3000,    // Revenu minimum de travail requis
      phase_in_start: 0,            // Début de l'accumulation
      phase_out_start_single: 26149, // Début de réduction pour célibataires
      phase_out_start_family: 29833, // Début de réduction pour familles
      phase_out_end_single: 36749,   // Fin d'admissibilité pour célibataires
      phase_out_end_family: 48093,   // Fin d'admissibilité pour familles
      disability_phase_out_start_single: 36748, // Début réduction supplément invalidité (célibataires)
      disability_phase_out_start_family: 48091,  // Début réduction supplément invalidité (familles)
      disability_phase_out_end_single: 42222,    // Fin supplément invalidité (célibataires)
      disability_phase_out_end_family: 53565     // Fin supplément invalidité (familles - one disabled)
    },
    calculation_rates: {
      phase_in_rate: 0.27,          // Taux d'accumulation de 27%
      phase_out_rate: 0.15,         // Taux de réduction de 15%
      disability_phase_out_rate: 0.075 // Taux de réduction du supplément invalidité 7.5%
    },
    secondary_earner_exemption: 14000 // Exemption conjoint secondaire
  },
  
  /**
   * Supplément remboursable pour frais médicaux fédéral 2023
   * Sources: TaxTips.ca, Agence du revenu du Canada
   */
  medical_expense_supplement_federal: {
    maximum_amount: 1399,                    // Montant maximal du supplément
    minimum_work_income: 4083,               // Revenu de travail minimum requis
    reduction_threshold: 30964,              // Seuil de réduction du revenu familial net
    reduction_rate: 0.05,                    // Taux de réduction (5%)
    medical_expense_rate: 0.25,              // Taux de crédit sur frais médicaux (25%)
    phase_out_end: 58944                     // Seuil d'élimination complète
  },

  /**
   * Crédit d'impôt remboursable pour frais médicaux - Québec 2023
   * Sources: Budget Finances Québec, CFFP
   */
  medical_expense_supplement_quebec: {
    maximum_amount: 1356,                    // Montant maximal du crédit
    minimum_work_income: 3470,               // Revenu de travail minimum requis
    reduction_threshold: 26220,              // Seuil de réduction du revenu familial net
    reduction_rate: 0.05,                    // Taux de réduction (5%)
    medical_expense_rate: 0.25,              // Taux de crédit sur frais médicaux (25%)
    phase_out_end: 53340                     // Seuil d'élimination complète (estimation)
  },

  old_age_security: {
    quarters: {
      q1: {
        max_amount_65_74: 687.56,
        max_amount_75_plus: 756.32,
        recovery_threshold: 86912,
        recovery_upper_limit_65_74: 142124,
        recovery_upper_limit_75_plus: 147645
      },
      q2: {
        max_amount_65_74: 691.00,
        max_amount_75_plus: 760.10,
        recovery_threshold: 86912,
        recovery_upper_limit_65_74: 142124,
        recovery_upper_limit_75_plus: 147645
      },
      q3: {
        max_amount_65_74: 698.60,
        max_amount_75_plus: 768.46,
        recovery_threshold: 86912,
        recovery_upper_limit_65_74: 142428,
        recovery_upper_limit_75_plus: 147979
      },
      q4: {
        max_amount_65_74: 707.68,
        max_amount_75_plus: 778.45,
        recovery_threshold: 86912,
        recovery_upper_limit_65_74: 142609,
        recovery_upper_limit_75_plus: 148179
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
        q4: {
          single_max_amount: 1026.96,
          single_income_cutoff: 20832,
          single_top_up_cutoff: 9680,
          couple_both_oas_max: 618.15,
          couple_both_oas_income_cutoff: 27552,
          couple_both_oas_top_up_cutoff: 8416,
          couple_one_oas_max: 1026.96,
          couple_one_oas_income_cutoff: 49920,
          couple_one_oas_top_up_cutoff: 19360
        }
      },
      employment_income_exemption: {
        first_exemption: 5000,      // Premier 5 000 $ de revenu d'emploi
        partial_exemption: 15000,   // 50% du revenu entre 5 000 $ et 15 000 $
        partial_rate: 0.50
      },
      reduction_rate: 0.50  // 0.50 $ de réduction par dollar de revenu
    }
  }
} as const