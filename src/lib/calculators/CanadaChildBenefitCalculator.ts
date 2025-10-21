/**
 * Calculateur pour l'Allocation canadienne pour enfants (ACE)
 * 
 * L'ACE est une prestation mensuelle non imposable versée aux familles
 * admissibles pour les aider à assumer les coûts liés à l'éducation
 * des enfants de moins de 18 ans.
 * 
 * Sources officielles:
 * - https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants.html
 * - https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/calculateur-prestations-enfants-familles.html
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { Household, HouseholdType } from '../models'
import { CalculatorRegistry } from '../core/factory'
import { CanadaChildBenefitConfig } from '../config/types'
import { ConfigManager } from '../config/ConfigManager'

export interface CanadaChildBenefitResult {
  base_benefit: Decimal
  disability_benefit: Decimal
  reduction_amount: Decimal
  net_benefit: Decimal
  eligible_children_under_6: number
  eligible_children_6_to_17: number
  eligible_children_disabled: number
  family_net_income: Decimal
  reduction_phase: 'none' | 'first' | 'second'
  effective_reduction_rate: Decimal
}

/**
 * Calculateur de l'Allocation canadienne pour enfants
 */
export class CanadaChildBenefitCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'canada_child_benefit'
  }
  
  /**
   * Calcule l'ACE avec les détails complets
   */
  calculateDetailed(household: Household, taxResults?: {
    federal_net_income?: Decimal
  }): CanadaChildBenefitResult {
    // Obtenir les paramètres de configuration
    const baseAmountsConfig = this.getConfigValue('base_amounts')
    const disabilityConfig = this.getConfigValue('disability_benefit')
    const thresholdsConfig = this.getConfigValue('thresholds')
    const reductionRatesConfig = this.getConfigValue('reduction_rates')
    
    // Calculer le revenu familial net ajusté
    const familyNetIncome = this.calculateFamilyNetIncome(household, taxResults)
    
    // Déterminer le nombre d'enfants éligibles par catégorie d'âge
    const childrenUnder6 = this.countChildrenUnder6(household)
    const children6To17 = this.countChildren6To17(household)
    const childrenDisabled = this.countDisabledChildren(household)
    const totalChildren = childrenUnder6 + children6To17
    
    // Si aucun enfant, aucune prestation
    if (totalChildren === 0) {
      return {
        base_benefit: new Decimal(0),
        disability_benefit: new Decimal(0),
        reduction_amount: new Decimal(0),
        net_benefit: new Decimal(0),
        eligible_children_under_6: 0,
        eligible_children_6_to_17: 0,
        eligible_children_disabled: 0,
        family_net_income: familyNetIncome,
        reduction_phase: 'none',
        effective_reduction_rate: new Decimal(0)
      }
    }
    
    // Calculer la prestation de base maximale
    const baseBenefit = this.toDecimal(baseAmountsConfig.under_6)
      .times(childrenUnder6)
      .plus(this.toDecimal(baseAmountsConfig.age_6_to_17).times(children6To17))
    
    // Calculer la prestation pour enfants handicapés
    const disabilityBenefit = this.toDecimal(disabilityConfig.amount)
      .times(childrenDisabled)
    
    // Calculer la réduction selon le revenu familial
    const { reductionAmount, phase, effectiveRate } = this.calculateReduction(
      familyNetIncome,
      baseBenefit.plus(disabilityBenefit),
      totalChildren,
      thresholdsConfig,
      reductionRatesConfig
    )
    
    // Calculer la prestation nette
    const netBenefit = Decimal.max(
      0,
      baseBenefit.plus(disabilityBenefit).minus(reductionAmount)
    )
    
    return {
      base_benefit: baseBenefit,
      disability_benefit: disabilityBenefit,
      reduction_amount: reductionAmount,
      net_benefit: netBenefit,
      eligible_children_under_6: childrenUnder6,
      eligible_children_6_to_17: children6To17,
      eligible_children_disabled: childrenDisabled,
      family_net_income: familyNetIncome,
      reduction_phase: phase,
      effective_reduction_rate: effectiveRate
    }
  }
  
  /**
   * Calcule le revenu familial net ajusté
   */
  private calculateFamilyNetIncome(
    household: Household,
    taxResults?: { federal_net_income?: Decimal }
  ): Decimal {
    // Si on a le revenu net de l'impôt fédéral, l'utiliser
    if (taxResults?.federal_net_income) {
      return taxResults.federal_net_income
    }
    
    // Sinon, utiliser le revenu brut comme approximation
    let familyIncome = household.primaryPerson.isRetired
      ? household.primaryPerson.grossRetirementIncome
      : household.primaryPerson.grossWorkIncome
    
    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      familyIncome = familyIncome.plus(spouseIncome)
    }
    
    return familyIncome
  }
  
  /**
   * Compte les enfants de moins de 6 ans
   */
  private countChildrenUnder6(household: Household): number {
    if (!household.children || household.children.length === 0) {
      return 0
    }

    // Utiliser l'âge réel des enfants
    return household.children.filter(child => child.age < 6).length
  }

  /**
   * Compte les enfants de 6 à 17 ans
   */
  private countChildren6To17(household: Household): number {
    if (!household.children || household.children.length === 0) {
      return 0
    }

    // Utiliser l'âge réel des enfants
    return household.children.filter(child => child.age >= 6 && child.age <= 17).length
  }
  
  /**
   * Compte les enfants handicapés
   */
  private countDisabledChildren(household: Household): number {
    // Pour l'instant, on n'a pas cette information dans le modèle
    // On retourne 0 par défaut
    return 0
  }
  
  /**
   * Calcule la réduction selon le revenu familial
   */
  private calculateReduction(
    familyNetIncome: Decimal,
    maxBenefit: Decimal,
    numChildren: number,
    thresholdsConfig: any,
    reductionRatesConfig: any
  ): { reductionAmount: Decimal; phase: 'none' | 'first' | 'second'; effectiveRate: Decimal } {
    // Si le revenu est sous le premier seuil, aucune réduction
    const firstThreshold = this.toDecimal(thresholdsConfig.first)
    const secondThreshold = this.toDecimal(thresholdsConfig.second)
    
    if (familyNetIncome.lte(firstThreshold)) {
      return {
        reductionAmount: new Decimal(0),
        phase: 'none',
        effectiveRate: new Decimal(0)
      }
    }
    
    // Déterminer le taux de réduction selon le nombre d'enfants
    const getReductionRate = (phase: 'first_phase' | 'second_phase') => {
      const rates = reductionRatesConfig[phase]
      if (numChildren === 1) return rates.one_child
      if (numChildren === 2) return rates.two_children
      if (numChildren === 3) return rates.three_children
      return rates.four_plus_children
    }
    
    let reductionAmount = new Decimal(0)
    let phase: 'none' | 'first' | 'second' = 'none'
    let effectiveRate = new Decimal(0)
    
    // Phase 1: Entre le premier et le deuxième seuil
    if (familyNetIncome.gt(firstThreshold) && familyNetIncome.lte(secondThreshold)) {
      const excessIncome = familyNetIncome.minus(firstThreshold)
      effectiveRate = new Decimal(getReductionRate('first_phase'))
      reductionAmount = excessIncome.times(effectiveRate)
      phase = 'first'
    }
    // Phase 2: Au-dessus du deuxième seuil
    else if (familyNetIncome.gt(secondThreshold)) {
      // Réduction pour la première phase (montant fixe)
      const firstPhaseIncome = secondThreshold.minus(firstThreshold)
      const firstPhaseRate = new Decimal(getReductionRate('first_phase'))
      const firstPhaseReduction = firstPhaseIncome.times(firstPhaseRate)
      
      // Réduction pour la deuxième phase
      const secondPhaseIncome = familyNetIncome.minus(secondThreshold)
      effectiveRate = new Decimal(getReductionRate('second_phase'))
      const secondPhaseReduction = secondPhaseIncome.times(effectiveRate)
      
      reductionAmount = firstPhaseReduction.plus(secondPhaseReduction)
      phase = 'second'
    }
    
    // S'assurer que la réduction ne dépasse pas le montant maximum de la prestation
    reductionAmount = Decimal.min(reductionAmount, maxBenefit)
    
    return { reductionAmount, phase, effectiveRate }
  }
  
  /**
   * Méthode requise par BaseCalculator (non utilisée directement)
   */
  calculate(): any {
    throw new Error('Use calculateDetailed method instead')
  }
}

// Enregistrer le calculateur
CalculatorRegistry.register('canada_child_benefit', CanadaChildBenefitCalculator)