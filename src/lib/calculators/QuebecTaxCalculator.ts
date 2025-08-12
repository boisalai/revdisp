/**
 * Calculateur d'impôt du Québec intégré au système principal
 * Wrapper autour du QuebecIncomeTaxCalculator pour compatibilité avec BaseCalculator
 */

import { BaseCalculator } from '../core/BaseCalculator'
import { Person, Household } from '../models'
import { ConfigManager } from '../config/ConfigManager'
import { QuebecIncomeTaxCalculator, QuebecTaxInputs, QuebecTaxResults } from './QuebecIncomeTaxCalculator'
import Decimal from 'decimal.js'

export interface HouseholdQuebecTaxResult {
  primary: QuebecTaxResults
  spouse?: QuebecTaxResults
  combined: {
    netTax: Decimal
    grossTax: Decimal
    netTaxableIncome: Decimal
    nonRefundableCredits: Decimal
    totalDeductions: Decimal
  }
}

/**
 * Calculateur d'impôt du Québec compatible avec l'architecture BaseCalculator
 */
export class QuebecTaxCalculator extends BaseCalculator {
  private taxCalculator!: QuebecIncomeTaxCalculator

  constructor(taxYear: number) {
    super(taxYear)
    // Le taxCalculator sera initialisé dans initialize()
  }

  get calculatorName(): string {
    return 'quebec_tax_calculator'
  }

  async initialize(): Promise<void> {
    await super.initialize()
    
    // Charger la configuration fiscale
    const config = await ConfigManager.loadConfig(this.taxYear)
    this.taxCalculator = new QuebecIncomeTaxCalculator(config.quebec_tax, this.taxYear)
  }

  /**
   * Calcule l'impôt du Québec pour un ménage complet
   * Utilisé par le MainCalculator
   */
  calculateHousehold(
    household: Household, 
    contributions: {
      rrq: Decimal
      ei: Decimal  
      rqap: Decimal
    }
  ): HouseholdQuebecTaxResult {
    // Diviser les cotisations entre les conjoints
    // Approximation simple: proportionnel au revenu
    const totalIncome = this.calculateTotalIncome(household)
    const primaryIncome = household.primaryPerson.isRetired
      ? household.primaryPerson.grossRetirementIncome.toNumber()
      : household.primaryPerson.grossWorkIncome.toNumber()
    
    const spouseIncome = household.spouse 
      ? (household.spouse.isRetired 
         ? household.spouse.grossRetirementIncome.toNumber()
         : household.spouse.grossWorkIncome.toNumber())
      : 0

    // Répartir les cotisations proportionnellement aux revenus
    let primaryContributions, spouseContributions
    
    if (totalIncome > 0) {
      const primaryRatio = new Decimal(primaryIncome).div(totalIncome)
      const spouseRatio = household.spouse ? new Decimal(spouseIncome).div(totalIncome) : new Decimal(0)
      
      primaryContributions = {
        rrq: contributions.rrq.times(primaryRatio),
        ei: contributions.ei.times(primaryRatio),
        rqap: contributions.rqap.times(primaryRatio)
      }
      
      spouseContributions = household.spouse ? {
        rrq: contributions.rrq.times(spouseRatio),
        ei: contributions.ei.times(spouseRatio),
        rqap: contributions.rqap.times(spouseRatio)
      } : undefined
    } else {
      // Pas de revenus, pas de cotisations
      primaryContributions = {
        rrq: new Decimal(0),
        ei: new Decimal(0),
        rqap: new Decimal(0)
      }
      spouseContributions = undefined
    }

    // Calculer l'impôt pour la personne principale
    const primaryInputs: QuebecTaxInputs = {
      primaryPerson: household.primaryPerson,
      spouse: household.spouse || undefined, // Nécessaire pour les crédits familiaux
      numChildren: household.numChildren,
      deductibleContributions: primaryContributions
    }

    const primaryResults = this.taxCalculator.calculateDetailed(primaryInputs)

    // Calculer l'impôt pour le conjoint (si applicable)
    let spouseResults: QuebecTaxResults | undefined
    if (household.spouse && spouseContributions) {
      const spouseInputs: QuebecTaxInputs = {
        primaryPerson: household.spouse,
        spouse: household.primaryPerson, // Inverser pour le conjoint
        numChildren: household.numChildren,
        deductibleContributions: spouseContributions
      }
      spouseResults = this.taxCalculator.calculateDetailed(spouseInputs)
    }

    // Combiner les résultats
    const combined = {
      netTax: primaryResults.netTax.plus(spouseResults?.netTax || 0),
      grossTax: primaryResults.grossTax.plus(spouseResults?.grossTax || 0),
      netTaxableIncome: primaryResults.netTaxableIncome.plus(spouseResults?.netTaxableIncome || 0),
      nonRefundableCredits: primaryResults.nonRefundableCredits.plus(spouseResults?.nonRefundableCredits || 0),
      totalDeductions: primaryResults.deductionDetails.totalDeductions.plus(spouseResults?.deductionDetails.totalDeductions || 0)
    }

    return {
      primary: primaryResults,
      spouse: spouseResults,
      combined
    }
  }

  /**
   * Calcule l'impôt pour une personne individuelle  
   * Compatibilité avec l'interface BaseCalculator
   */
  calculate(person: Person): Record<string, Decimal> {
    // Pour compatibilité avec BaseCalculator - utilisé par les tests individuels
    const contributions = {
      rrq: new Decimal(0), // À calculer séparément
      ei: new Decimal(0),
      rqap: new Decimal(0)
    }

    const inputs: QuebecTaxInputs = {
      primaryPerson: person,
      numChildren: 0, // Pas d'info disponible au niveau individuel
      deductibleContributions: contributions
    }

    return this.taxCalculator.calculate(inputs)
  }

  /**
   * Calcule le revenu total du ménage
   */
  private calculateTotalIncome(household: Household): number {
    let total = household.primaryPerson.isRetired
      ? household.primaryPerson.grossRetirementIncome.toNumber()
      : household.primaryPerson.grossWorkIncome.toNumber()

    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome.toNumber()
        : household.spouse.grossWorkIncome.toNumber()
      total += spouseIncome
    }

    return total
  }

  /**
   * Obtient le taux marginal d'imposition pour un niveau de revenu
   */
  getMarginalRate(netTaxableIncome: number): number {
    return this.taxCalculator.getMarginalTaxRate(new Decimal(netTaxableIncome))
  }

  /**
   * Obtient le taux effectif d'imposition
   */
  getAverageRate(netTaxableIncome: number, netTax: number): number {
    return this.taxCalculator.getAverageTaxRate(new Decimal(netTaxableIncome), new Decimal(netTax))
  }
}