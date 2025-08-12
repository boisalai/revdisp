/**
 * Générateur de cas de test en masse pour validation extensive
 * Capable de produire des milliers de scénarios automatiquement
 */

import { HouseholdType } from '../models'
import { ValidationTestCase } from './ValidationTestCases'

export interface GeneratorConfig {
  /** Nombre total de cas à générer */
  totalCases: number
  /** Année fiscale à utiliser */
  taxYear: number
  /** Distribution des types de ménages */
  householdDistribution: {
    single: number          // %
    couple: number          // %
    singleParent: number    // %
    retiredSingle: number   // %
    retiredCouple: number   // %
  }
  /** Plages de revenus */
  incomeRanges: {
    min: number
    max: number
    step: number
  }
  /** Plages d'âges */
  ageRanges: {
    working: { min: number, max: number }
    retired: { min: number, max: number }
  }
  /** Options pour les enfants */
  childrenOptions: {
    maxChildren: number
    childcareExpensesRange: { min: number, max: number }
  }
}

export interface GenerationStrategy {
  /** Stratégie pour la génération */
  type: 'systematic' | 'random' | 'grid' | 'monte_carlo'
  /** Paramètres spécifiques à la stratégie */
  params?: any
}

export class MassTestGenerator {
  private config: GeneratorConfig
  private strategy: GenerationStrategy

  constructor(config: Partial<GeneratorConfig> = {}, strategy: GenerationStrategy = { type: 'systematic' }) {
    this.config = {
      totalCases: config.totalCases ?? 1000,
      taxYear: config.taxYear ?? 2024,
      householdDistribution: config.householdDistribution ?? {
        single: 30,
        couple: 35,
        singleParent: 15,
        retiredSingle: 10,
        retiredCouple: 10
      },
      incomeRanges: config.incomeRanges ?? {
        min: 10000,
        max: 200000,
        step: 5000
      },
      ageRanges: config.ageRanges ?? {
        working: { min: 18, max: 64 },
        retired: { min: 65, max: 85 }
      },
      childrenOptions: config.childrenOptions ?? {
        maxChildren: 4,
        childcareExpensesRange: { min: 0, max: 15000 }
      }
    }
    this.strategy = strategy
  }

  /**
   * Génère un ensemble massif de cas de test
   */
  async generateMassTestCases(): Promise<ValidationTestCase[]> {
    console.log(`🏭 Génération de ${this.config.totalCases} cas de test...`)
    console.log(`📊 Stratégie: ${this.strategy.type}`)
    console.log(`📅 Année fiscale: ${this.config.taxYear}`)

    let cases: ValidationTestCase[] = []

    switch (this.strategy.type) {
      case 'systematic':
        cases = await this.generateSystematicCases()
        break
      case 'random':
        cases = await this.generateRandomCases()
        break
      case 'grid':
        cases = await this.generateGridCases()
        break
      case 'monte_carlo':
        cases = await this.generateMonteCarloCases()
        break
      default:
        throw new Error(`Stratégie non supportée: ${this.strategy.type}`)
    }

    console.log(`✅ ${cases.length} cas générés avec succès`)
    return cases
  }

  /**
   * Génération systématique - couvre méthodiquement l'espace des paramètres
   */
  private async generateSystematicCases(): Promise<ValidationTestCase[]> {
    const cases: ValidationTestCase[] = []
    const householdTypes = this.getHouseholdTypesFromDistribution()
    
    let caseId = 1
    const targetCasesPerType = Math.floor(this.config.totalCases / householdTypes.length)

    for (const householdType of householdTypes) {
      let casesForType = 0
      
      // Générer les plages de revenus
      const incomeSteps = Math.ceil(Math.sqrt(targetCasesPerType))
      const incomeStep = (this.config.incomeRanges.max - this.config.incomeRanges.min) / incomeSteps

      for (let income1 = this.config.incomeRanges.min; 
           income1 <= this.config.incomeRanges.max && casesForType < targetCasesPerType; 
           income1 += incomeStep) {
        
        for (let income2 = (householdType === HouseholdType.COUPLE || householdType === HouseholdType.RETIRED_COUPLE) 
             ? this.config.incomeRanges.min : 0; 
             income2 <= (householdType === HouseholdType.COUPLE || householdType === HouseholdType.RETIRED_COUPLE 
                         ? this.config.incomeRanges.max : 0) && casesForType < targetCasesPerType;
             income2 += incomeStep) {

          const testCase = this.createTestCase(
            `generated_${caseId++}`,
            householdType,
            income1,
            income2 || undefined
          )
          
          cases.push(testCase)
          casesForType++

          if (income2 === 0) break // Pas de conjoint
        }
      }
    }

    return cases.slice(0, this.config.totalCases)
  }

  /**
   * Génération aléatoire - échantillonnage aléatoire de l'espace des paramètres
   */
  private async generateRandomCases(): Promise<ValidationTestCase[]> {
    const cases: ValidationTestCase[] = []
    const householdTypes = this.getHouseholdTypesFromDistribution()

    for (let i = 0; i < this.config.totalCases; i++) {
      // Sélectionner un type de ménage aléatoirement selon la distribution
      const householdType = this.selectRandomHouseholdType(householdTypes)
      
      // Générer des revenus aléatoires
      const income1 = this.generateRandomIncome()
      const income2 = (householdType === HouseholdType.COUPLE || householdType === HouseholdType.RETIRED_COUPLE) 
        ? this.generateRandomIncome() : undefined

      const testCase = this.createTestCase(
        `random_${i + 1}`,
        householdType,
        income1,
        income2
      )

      cases.push(testCase)
    }

    return cases
  }

  /**
   * Génération en grille - combinaisons systématiques des paramètres clés
   */
  private async generateGridCases(): Promise<ValidationTestCase[]> {
    const cases: ValidationTestCase[] = []
    
    // Définir les points de grille
    const incomePoints = [15000, 25000, 35000, 50000, 75000, 100000, 150000]
    const agePoints = {
      working: [25, 35, 45, 55],
      retired: [65, 70, 75, 80]
    }
    const childrenCounts = [0, 1, 2, 3]

    let caseId = 1

    for (const householdType of Object.values(HouseholdType)) {
      const isRetired = householdType === HouseholdType.RETIRED_SINGLE || householdType === HouseholdType.RETIRED_COUPLE
      const ages = isRetired ? agePoints.retired : agePoints.working

      for (const income1 of incomePoints) {
        if (householdType === HouseholdType.COUPLE || householdType === HouseholdType.RETIRED_COUPLE) {
          for (const income2 of incomePoints) {
            for (const age1 of ages) {
              for (const age2 of ages) {
                for (const numChildren of childrenCounts) {
                  if (cases.length >= this.config.totalCases) break

                  const testCase = this.createTestCase(
                    `grid_${caseId++}`,
                    householdType,
                    income1,
                    income2,
                    age1,
                    age2,
                    numChildren
                  )
                  cases.push(testCase)
                }
              }
            }
          }
        } else {
          for (const age of ages) {
            for (const numChildren of (householdType === HouseholdType.SINGLE_PARENT ? childrenCounts.filter(n => n > 0) : [0])) {
              if (cases.length >= this.config.totalCases) break

              const testCase = this.createTestCase(
                `grid_${caseId++}`,
                householdType,
                income1,
                undefined,
                age,
                undefined,
                numChildren
              )
              cases.push(testCase)
            }
          }
        }
      }
    }

    return cases.slice(0, this.config.totalCases)
  }

  /**
   * Génération Monte Carlo - échantillonnage intelligent avec distribution pondérée
   */
  private async generateMonteCarloCases(): Promise<ValidationTestCase[]> {
    const cases: ValidationTestCase[] = []
    
    // Distributions de probabilité pour un échantillonnage plus réaliste
    const incomeDistribution = this.createLogNormalDistribution(45000, 25000) // Médiane ~45k, écart-type ~25k
    const ageDistribution = this.createNormalDistribution(40, 12) // Moyenne 40 ans, écart-type 12

    for (let i = 0; i < this.config.totalCases; i++) {
      const householdType = this.selectRandomHouseholdType()
      
      // Échantillonner selon les distributions réalistes
      const income1 = Math.max(10000, Math.min(200000, incomeDistribution()))
      const income2 = (householdType === HouseholdType.COUPLE || householdType === HouseholdType.RETIRED_COUPLE)
        ? Math.max(10000, Math.min(200000, incomeDistribution()))
        : undefined

      const isRetired = householdType === HouseholdType.RETIRED_SINGLE || householdType === HouseholdType.RETIRED_COUPLE
      const age1 = isRetired 
        ? Math.max(65, Math.min(85, 70 + Math.random() * 10))
        : Math.max(18, Math.min(64, ageDistribution()))

      const age2 = (income2 !== undefined) 
        ? (isRetired 
           ? Math.max(65, Math.min(85, 70 + Math.random() * 10))
           : Math.max(18, Math.min(64, ageDistribution())))
        : undefined

      const numChildren = householdType === HouseholdType.SINGLE_PARENT 
        ? Math.floor(Math.random() * 3) + 1 
        : (householdType === HouseholdType.COUPLE ? Math.floor(Math.random() * 4) : 0)

      const testCase = this.createTestCase(
        `montecarlo_${i + 1}`,
        householdType,
        income1,
        income2,
        age1,
        age2,
        numChildren
      )

      cases.push(testCase)
    }

    return cases
  }

  /**
   * Crée un cas de test individuel
   */
  private createTestCase(
    id: string,
    householdType: HouseholdType,
    income1: number,
    income2?: number,
    age1?: number,
    age2?: number,
    numChildren: number = 0
  ): ValidationTestCase {
    const isRetired = householdType === HouseholdType.RETIRED_SINGLE || householdType === HouseholdType.RETIRED_COUPLE

    // Âges par défaut si non spécifiés
    const defaultAge1 = isRetired 
      ? 65 + Math.floor(Math.random() * 20)
      : 18 + Math.floor(Math.random() * 47)
    const defaultAge2 = isRetired 
      ? 65 + Math.floor(Math.random() * 20) 
      : 18 + Math.floor(Math.random() * 47)

    // Estimer les résultats attendus (approximations pour démarrer)
    const expectedResults = this.estimateExpectedResults(householdType, income1, income2, numChildren)

    return {
      id,
      description: `${this.getHouseholdDescription(householdType)} - ${income1}$${income2 ? ` + ${income2}$` : ''}${numChildren > 0 ? ` (${numChildren} enfant${numChildren > 1 ? 's' : ''})` : ''}`,
      input: {
        taxYear: this.config.taxYear,
        householdType,
        primaryPerson: {
          age: age1 ?? defaultAge1,
          grossWorkIncome: isRetired ? 0 : income1,
          grossRetirementIncome: isRetired ? income1 : 0
        },
        spouse: income2 !== undefined ? {
          age: age2 ?? defaultAge2,
          grossWorkIncome: isRetired ? 0 : income2,
          grossRetirementIncome: isRetired ? income2 : 0
        } : undefined,
        numChildren,
        children: numChildren > 0 ? this.generateChildrenData(numChildren) : undefined
      },
      expectedResults,
      priority: this.assignPriority(income1, householdType, income2),
      category: this.getCategoryFromHouseholdType(householdType)
    }
  }

  /**
   * Estime les résultats attendus (approximations)
   * Ces valeurs seront remplacées par le scraping du calculateur officiel
   */
  private estimateExpectedResults(
    householdType: HouseholdType, 
    income1: number, 
    income2?: number, 
    numChildren: number = 0
  ) {
    const totalIncome = income1 + (income2 || 0)
    const isRetired = householdType === HouseholdType.RETIRED_SINGLE || householdType === HouseholdType.RETIRED_COUPLE

    // Estimations grossières pour cotisations (à affiner)
    const estimatedCotisations = {
      assuranceEmploi: isRetired ? 0 : Math.min(858, totalIncome * 0.0216),
      rqap: isRetired ? 0 : Math.min(474, totalIncome * 0.00632),
      rrq: isRetired ? 0 : Math.min(4455, totalIncome * 0.0594),
      fss: isRetired ? totalIncome * 0.01 : 0,
      ramq: 0 // Dépend du revenu familial, complexe à estimer
    }

    const totalCotisations = Object.values(estimatedCotisations).reduce((sum, val) => sum + val, 0)

    // Estimations très grossières pour impôts et crédits
    const estimatedQuebecTax = Math.max(0, totalIncome * 0.15 - 15000)
    const estimatedFederalTax = Math.max(0, totalIncome * 0.15 - 15000)

    return {
      revenuBrut: totalIncome,
      revenuDisponible: totalIncome - totalCotisations - estimatedQuebecTax - estimatedFederalTax,
      regimeFiscalQuebec: estimatedQuebecTax,
      impotRevenuQuebec: estimatedQuebecTax,
      creditSolidarite: totalIncome < 50000 ? 1200 : 0,
      primeTravail: 0,
      allocationFamiliale: numChildren * 2500,
      regimeFiscalFederal: estimatedFederalTax,
      impotRevenuFederal: estimatedFederalTax,
      allocationCanadienneEnfants: numChildren * 5000,
      creditTPS: totalIncome < 50000 ? 850 : 0,
      totalCotisations,
      ...estimatedCotisations
    }
  }

  /**
   * Génère des données d'enfants aléatoirement
   */
  private generateChildrenData(numChildren: number) {
    const children = []
    for (let i = 0; i < numChildren; i++) {
      children.push({
        age: Math.floor(Math.random() * 18), // 0-17 ans
        childcareExpenses: Math.floor(Math.random() * this.config.childrenOptions.childcareExpensesRange.max),
        childcareType: Math.random() > 0.5 ? 'subsidized' as const : 'nonSubsidized' as const
      })
    }
    return children
  }

  /**
   * Assigne une priorité basée sur les caractéristiques du cas
   */
  private assignPriority(income1: number, householdType: HouseholdType, income2?: number): 'high' | 'medium' | 'low' {
    const totalIncome = income1 + (income2 || 0)
    
    // Priorité élevée pour les cas courants et importants
    if (totalIncome >= 25000 && totalIncome <= 75000) return 'high'
    if (householdType === HouseholdType.SINGLE_PARENT) return 'high'
    if (totalIncome >= 75000 && totalIncome <= 150000) return 'medium'
    
    return 'low'
  }

  /**
   * Utilitaires pour la génération
   */
  private getHouseholdTypesFromDistribution(): HouseholdType[] {
    const types: HouseholdType[] = []
    const dist = this.config.householdDistribution
    
    // Répéter selon la distribution
    for (let i = 0; i < dist.single; i++) types.push(HouseholdType.SINGLE)
    for (let i = 0; i < dist.couple; i++) types.push(HouseholdType.COUPLE)
    for (let i = 0; i < dist.singleParent; i++) types.push(HouseholdType.SINGLE_PARENT)
    for (let i = 0; i < dist.retiredSingle; i++) types.push(HouseholdType.RETIRED_SINGLE)
    for (let i = 0; i < dist.retiredCouple; i++) types.push(HouseholdType.RETIRED_COUPLE)
    
    return types
  }

  private selectRandomHouseholdType(types?: HouseholdType[]): HouseholdType {
    const householdTypes = types || this.getHouseholdTypesFromDistribution()
    return householdTypes[Math.floor(Math.random() * householdTypes.length)]
  }

  private generateRandomIncome(): number {
    return Math.floor(Math.random() * (this.config.incomeRanges.max - this.config.incomeRanges.min) + this.config.incomeRanges.min)
  }

  private getHouseholdDescription(type: HouseholdType): string {
    const descriptions = {
      [HouseholdType.SINGLE]: 'Personne seule',
      [HouseholdType.COUPLE]: 'Couple',
      [HouseholdType.SINGLE_PARENT]: 'Famille monoparentale',
      [HouseholdType.RETIRED_SINGLE]: 'Retraité seul',
      [HouseholdType.RETIRED_COUPLE]: 'Couple retraité'
    }
    return descriptions[type]
  }

  private getCategoryFromHouseholdType(type: HouseholdType): 'single' | 'couple' | 'singleParent' | 'family' | 'retired' {
    const mapping = {
      [HouseholdType.SINGLE]: 'single' as const,
      [HouseholdType.COUPLE]: 'couple' as const,
      [HouseholdType.SINGLE_PARENT]: 'singleParent' as const,
      [HouseholdType.RETIRED_SINGLE]: 'retired' as const,
      [HouseholdType.RETIRED_COUPLE]: 'retired' as const
    }
    return mapping[type]
  }

  /**
   * Générateurs de distributions statistiques
   */
  private createLogNormalDistribution(median: number, stdDev: number): () => number {
    return () => {
      const normal = this.boxMullerNormal()
      return Math.exp(Math.log(median) + (stdDev / median) * normal)
    }
  }

  private createNormalDistribution(mean: number, stdDev: number): () => number {
    return () => mean + stdDev * this.boxMullerNormal()
  }

  private boxMullerNormal(): number {
    let u = 0, v = 0
    while(u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }
}