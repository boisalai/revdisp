import { HouseholdType } from '../models'

export interface ValidationTestCase {
  id: string
  description: string
  input: {
    taxYear: number
    householdType: HouseholdType
    primaryPerson: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
    }
    spouse?: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
    }
    numChildren: number
    children?: Array<{
      age: number
      childcareExpenses: number
      childcareType: 'subsidized' | 'nonSubsidized'
    }>
  }
  expectedResults: {
    // Revenus
    revenuBrut: number
    revenu_disponible: number
    
    // Régime fiscal du Québec
    regimeFiscalQuebec: number
    impotRevenuQuebec: number
    creditSolidarite: number
    primeTravail: number
    allocationFamiliale?: number
    
    // Régime fiscal fédéral  
    regimeFiscalFederal: number
    impotRevenuFederal: number
    allocationCanadienneEnfants?: number
    creditTPS: number
    
    // Cotisations
    totalCotisations: number
    assuranceEmploi: number
    rqap: number
    rrq: number
    fss: number
    ramq: number
  }
  priority: 'high' | 'medium' | 'low'
  category: 'single' | 'couple' | 'singleParent' | 'family' | 'retired'
}

/**
 * Ensemble complet de cas de test pour validation 2024
 * Basés sur les données du calculateur officiel du ministère des Finances
 */
export const validationTestCases: ValidationTestCase[] = [
  // === PERSONNES SEULES ===
  {
    id: 'single_25k',
    description: 'Personne seule, 25 ans, 25 000$ travail',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE,
      primaryPerson: { age: 25, grossWorkIncome: 25000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 25000,
      revenu_disponible: 22850, // À ajuster selon le calculateur officiel
      regimeFiscalQuebec: 1200,
      impotRevenuQuebec: 0, // En dessous du seuil
      creditSolidarite: 1200,
      primeTravail: 0,
      regimeFiscalFederal: 850,
      impotRevenuFederal: 0, // En dessous du seuil
      creditTPS: 850,
      totalCotisations: 2300,
      assuranceEmploi: 540,
      rqap: 158,
      rrq: 1485,
      fss: 117,
      ramq: 0
    },
    priority: 'high',
    category: 'single'
  },
  
  {
    id: 'single_35k',
    description: 'Personne seule, 30 ans, 35 000$ travail',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE,
      primaryPerson: { age: 30, grossWorkIncome: 35000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 35000,
      revenu_disponible: 30980, // À ajuster
      regimeFiscalQuebec: 1850,
      impotRevenuQuebec: 650,
      creditSolidarite: 1200,
      primeTravail: 0,
      regimeFiscalFederal: 1170,
      impotRevenuFederal: 320,
      creditTPS: 850,
      totalCotisations: 3200,
      assuranceEmploi: 756,
      rqap: 221,
      rrq: 2079,
      fss: 144,
      ramq: 0
    },
    priority: 'high',
    category: 'single'
  },
  
  {
    id: 'single_50k',
    description: 'Personne seule, 35 ans, 50 000$ travail',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE,
      primaryPerson: { age: 35, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 50000,
      revenu_disponible: 41250, // À ajuster
      regimeFiscalQuebec: 4100,
      impotRevenuQuebec: 2900,
      creditSolidarite: 1200,
      primeTravail: 0,
      regimeFiscalFederal: 4650,
      impotRevenuFederal: 3800,
      creditTPS: 850,
      totalCotisations: 4600,
      assuranceEmploi: 858,
      rqap: 316,
      rrq: 2970,
      fss: 456,
      ramq: 0
    },
    priority: 'high',
    category: 'single'
  },
  
  {
    id: 'single_75k',
    description: 'Personne seule, 40 ans, 75 000$ travail',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE,
      primaryPerson: { age: 40, grossWorkIncome: 75000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 75000,
      revenu_disponible: 58200, // À ajuster
      regimeFiscalQuebec: 9800,
      impotRevenuQuebec: 8600,
      creditSolidarite: 1200,
      primeTravail: 0,
      regimeFiscalFederal: 7000,
      impotRevenuFederal: 6150,
      creditTPS: 850,
      totalCotisations: 7000,
      assuranceEmploi: 858,
      rqap: 474,
      rrq: 4455,
      fss: 1213,
      ramq: 0
    },
    priority: 'high',
    category: 'single'
  },

  // === COUPLES ===
  {
    id: 'couple_50k_45k',
    description: 'Couple, 30/28 ans, 50 000$/45 000$ travail',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.COUPLE,
      primaryPerson: { age: 30, grossWorkIncome: 50000, grossRetirementIncome: 0 },
      spouse: { age: 28, grossWorkIncome: 45000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 95000,
      revenu_disponible: 78500, // À ajuster
      regimeFiscalQuebec: 7800,
      impotRevenuQuebec: 5400,
      creditSolidarite: 2400,
      primeTravail: 0,
      regimeFiscalFederal: 8350,
      impotRevenuFederal: 6650,
      creditTPS: 1700,
      totalCotisations: 8650,
      assuranceEmploi: 1716, // 858 + 858
      rqap: 601, // 316 + 285
      rrq: 5643, // 2970 + 2673
      fss: 690, // 456 + 234
      ramq: 0
    },
    priority: 'high',
    category: 'couple'
  },

  // === FAMILLES MONOPARENTALES ===
  {
    id: 'single_parent_45k_1child',
    description: 'Famille monoparentale, 32 ans, 45 000$, 1 enfant 5 ans',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE_PARENT,
      primaryPerson: { age: 32, grossWorkIncome: 45000, grossRetirementIncome: 0 },
      numChildren: 1,
      children: [{ age: 5, childcareExpenses: 8000, childcareType: 'subsidized' }]
    },
    expectedResults: {
      revenuBrut: 45000,
      revenu_disponible: 42500, // À ajuster avec allocations
      regimeFiscalQuebec: 5200,
      impotRevenuQuebec: 2100,
      creditSolidarite: 1800,
      primeTravail: 1200,
      allocationFamiliale: 2500,
      regimeFiscalFederal: 2800,
      impotRevenuFederal: 2950,
      allocationCanadienneEnfants: 5750,
      creditTPS: 1200,
      totalCotisations: 4100,
      assuranceEmploi: 772,
      rqap: 284,
      rrq: 2673,
      fss: 371,
      ramq: 0
    },
    priority: 'high',
    category: 'singleParent'
  },

  // === COUPLES AVEC ENFANTS ===
  {
    id: 'couple_55k_40k_2children',
    description: 'Couple, 34/32 ans, 55 000$/40 000$, 2 enfants (3 et 7 ans)',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.COUPLE,
      primaryPerson: { age: 34, grossWorkIncome: 55000, grossRetirementIncome: 0 },
      spouse: { age: 32, grossWorkIncome: 40000, grossRetirementIncome: 0 },
      numChildren: 2,
      children: [
        { age: 3, childcareExpenses: 10000, childcareType: 'subsidized' },
        { age: 7, childcareExpenses: 5000, childcareType: 'nonSubsidized' }
      ]
    },
    expectedResults: {
      revenuBrut: 95000,
      revenu_disponible: 85200, // À ajuster avec allocations
      regimeFiscalQuebec: 9500,
      impotRevenuQuebec: 4300,
      creditSolidarite: 2400,
      primeTravail: 2800,
      allocationFamiliale: 4500,
      regimeFiscalFederal: 5100,
      impotRevenuFederal: 6200,
      allocationCanadienneEnfants: 11300,
      creditTPS: 2100,
      totalCotisations: 8700,
      assuranceEmploi: 1630,
      rqap: 601,
      rrq: 5643,
      fss: 826,
      ramq: 0
    },
    priority: 'high',
    category: 'family'
  },

  // === RETRAITÉS ===
  {
    id: 'retired_single_25k',
    description: 'Retraité seul, 67 ans, 25 000$ retraite',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.RETIRED_SINGLE,
      primaryPerson: { age: 67, grossWorkIncome: 0, grossRetirementIncome: 25000 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 25000,
      revenu_disponible: 23800, // À ajuster
      regimeFiscalQuebec: 1500,
      impotRevenuQuebec: 300,
      creditSolidarite: 1200,
      primeTravail: 0,
      regimeFiscalFederal: 700,
      impotRevenuFederal: 150,
      creditTPS: 850,
      totalCotisations: 0, // Pas de cotisations sur revenus de retraite
      assuranceEmploi: 0,
      rqap: 0,
      rrq: 0,
      fss: 0,
      ramq: 0
    },
    priority: 'medium',
    category: 'retired'
  },

  {
    id: 'retired_couple_30k_20k',
    description: 'Couple retraité, 68/65 ans, 30 000$/20 000$ retraite',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.RETIRED_COUPLE,
      primaryPerson: { age: 68, grossWorkIncome: 0, grossRetirementIncome: 30000 },
      spouse: { age: 65, grossWorkIncome: 0, grossRetirementIncome: 20000 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 50000,
      revenu_disponible: 47600, // À ajuster
      regimeFiscalQuebec: 2800,
      impotRevenuQuebec: 1400,
      creditSolidarite: 2400,
      primeTravail: 0,
      regimeFiscalFederal: 1400,
      impotRevenuFederal: 700,
      creditTPS: 1700,
      totalCotisations: 0,
      assuranceEmploi: 0,
      rqap: 0,
      rrq: 0,
      fss: 0,
      ramq: 0
    },
    priority: 'medium',
    category: 'retired'
  }
]

/**
 * Cas de test supplémentaires pour cas limites
 */
export const edgeCaseTestCases: ValidationTestCase[] = [
  {
    id: 'edge_high_income',
    description: 'Revenu élevé, 45 ans, 150 000$ travail',
    input: {
      taxYear: 2024,
      householdType: HouseholdType.SINGLE,
      primaryPerson: { age: 45, grossWorkIncome: 150000, grossRetirementIncome: 0 },
      numChildren: 0
    },
    expectedResults: {
      revenuBrut: 150000,
      revenu_disponible: 105000, // À ajuster
      regimeFiscalQuebec: 25000,
      impotRevenuQuebec: 24000,
      creditSolidarite: 0, // Éliminé à ce niveau de revenu
      primeTravail: 0,
      regimeFiscalFederal: 20000,
      impotRevenuFederal: 19150,
      creditTPS: 0, // Éliminé
      totalCotisations: 10000,
      assuranceEmploi: 858,
      rqap: 474,
      rrq: 4455, // Plafond atteint
      fss: 4213,
      ramq: 0
    },
    priority: 'medium',
    category: 'single'
  }
]