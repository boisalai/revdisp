export interface Translation {
  // Header
  title: string
  subtitle: string
  
  // Form labels
  taxYear: string
  familySituation: string
  grossWorkIncome: string
  grossRetirementIncome: string
  age: string
  spouseGrossWorkIncome: string
  spouseGrossRetirementIncome: string
  spouseAge: string
  numberOfChildren: string
  
  // Household types
  householdTypes: {
    single: string
    singleParent: string
    couple: string
    retiredSingle: string
    retiredCouple: string
  }
  
  // Children
  child: string
  firstChild: string
  secondChild: string
  thirdChild: string
  fourthChild: string
  fifthChild: string
  childAge: string
  childcareExpenses: string
  childcareService: string
  
  // Children options
  childrenOptions: {
    none: string
    one: string
    two: string
    three: string
    four: string
    five: string
  }
  
  // Childcare types
  childcareTypes: {
    subsidized: string
    nonSubsidized: string
  }
  
  // Actions
  calculate: string
  calculating: string
  
  // Results
  results: string
  rrq: string
  employmentInsurance: string
  rqap: string
  fss: string
  ramq: string
  totalContributions: string
  
  // Footer
  basedOnOfficial: string
  note: string
}

export const translations: Record<string, Translation> = {
  fr: {
    // Header
    title: "Calculateur du revenu disponible",
    subtitle: "Calculez vos impôts, cotisations et transferts au Québec avec une interface moderne et conviviale",
    
    // Form labels
    taxYear: "Année d'imposition",
    familySituation: "Votre situation familiale",
    grossWorkIncome: "Votre revenu brut de travail",
    grossRetirementIncome: "Votre revenu brut de retraite",
    age: "Votre âge",
    spouseGrossWorkIncome: "Revenu brut de travail de votre conjoint(e)",
    spouseGrossRetirementIncome: "Revenu brut de retraite de votre conjoint(e)",
    spouseAge: "Âge de votre conjoint(e)",
    numberOfChildren: "Nombre d'enfants",
    
    // Household types
    householdTypes: {
      single: "Personne vivant seule",
      singleParent: "Famille monoparentale",
      couple: "Couple",
      retiredSingle: "Retraité vivant seul",
      retiredCouple: "Couple de retraités"
    },
    
    // Children
    child: "enfant",
    firstChild: "Premier enfant",
    secondChild: "Deuxième enfant",
    thirdChild: "Troisième enfant",
    fourthChild: "Quatrième enfant",
    fifthChild: "Cinquième enfant",
    childAge: "Âge",
    childcareExpenses: "Frais de garde",
    childcareService: "Service de garde",
    
    // Children options
    childrenOptions: {
      none: "Aucun enfant",
      one: "Un enfant",
      two: "Deux enfants",
      three: "Trois enfants",
      four: "Quatre enfants",
      five: "Cinq enfants"
    },
    
    // Childcare types
    childcareTypes: {
      subsidized: "Subventionné",
      nonSubsidized: "Non subventionné"
    },
    
    // Actions
    calculate: "Calculer",
    calculating: "Calcul en cours...",
    
    // Results
    results: "Résultats",
    rrq: "RRQ/QPP",
    employmentInsurance: "Assurance-emploi",
    rqap: "RQAP",
    fss: "FSS",
    ramq: "RAMQ",
    totalContributions: "Total des cotisations",
    
    // Footer
    basedOnOfficial: "Basé sur le calculateur officiel du ministère des Finances du Québec",
    note: "Seuls quelques calculateurs sont actuellement implémentés (RRQ, AE). D'autres composants (impôts, transferts) seront ajoutés progressivement."
  },
  
  en: {
    // Header
    title: "Disposable Income Calculator",
    subtitle: "Calculate your taxes, contributions and transfers in Quebec with a modern and user-friendly interface",
    
    // Form labels
    taxYear: "Tax Year",
    familySituation: "Your family situation",
    grossWorkIncome: "Your gross work income",
    grossRetirementIncome: "Your gross retirement income",
    age: "Your age",
    spouseGrossWorkIncome: "Your spouse's gross work income",
    spouseGrossRetirementIncome: "Your spouse's gross retirement income",
    spouseAge: "Your spouse's age",
    numberOfChildren: "Number of children",
    
    // Household types
    householdTypes: {
      single: "Single person",
      singleParent: "Single-parent family",
      couple: "Couple",
      retiredSingle: "Single retiree",
      retiredCouple: "Retired couple"
    },
    
    // Children
    child: "child",
    firstChild: "First child",
    secondChild: "Second child",
    thirdChild: "Third child",
    fourthChild: "Fourth child",
    fifthChild: "Fifth child",
    childAge: "Age",
    childcareExpenses: "Childcare expenses",
    childcareService: "Childcare service",
    
    // Children options
    childrenOptions: {
      none: "No child",
      one: "One child",
      two: "Two children",
      three: "Three children",
      four: "Four children",
      five: "Five children"
    },
    
    // Childcare types
    childcareTypes: {
      subsidized: "Subsidized",
      nonSubsidized: "Non-subsidized"
    },
    
    // Actions
    calculate: "Calculate",
    calculating: "Calculating...",
    
    // Results
    results: "Results",
    rrq: "RRQ/QPP",
    employmentInsurance: "Employment Insurance",
    rqap: "QPIP",
    fss: "HSF",
    ramq: "RAMQ",
    totalContributions: "Total Contributions",
    
    // Footer
    basedOnOfficial: "Based on the official calculator of the Quebec Ministry of Finance",
    note: "Only a few calculators are currently implemented (RRQ, EI). Other components (taxes, transfers) will be added progressively."
  }
}