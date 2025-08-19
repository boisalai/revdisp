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
    full_pension_years: 40
  }
} as const