/**
 * Allocation famille du Québec Calculator
 * 
 * Calcule l'allocation famille québécoise pour tous les enfants de moins de 18 ans
 * 
 * Règles principales:
 * - Prestation universelle non imposable avec montant minimum garanti
 * - Même montant pour tous les enfants peu importe le rang
 * - Supplément pour familles monoparentales
 * - Réduction progressive de 4% selon le revenu familial net
 * - Suppléments pour fournitures scolaires et enfants handicapés
 * 
 * Sources officielles:
 * - Chaire en fiscalité et en finances publiques, Allocation famille
 *   https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/allocation-famille/
 * - Retraite Québec
 *   https://www.retraitequebec.gouv.qc.ca/fr/enfants/allocation-famille/
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Household, HouseholdType } from '../models'

export interface FamilyAllowanceResult {
  /** Allocation de base par enfant */
  basic_allowance: Decimal
  /** Supplément pour famille monoparentale */
  single_parent_supplement: Decimal
  /** Supplément pour fournitures scolaires */
  school_supplies_supplement: Decimal
  /** Supplément pour enfant handicapé */
  disabled_child_supplement: Decimal
  /** Total brut avant réduction */
  gross_total: Decimal
  /** Montant de la réduction selon le revenu */
  reduction_amount: Decimal
  /** Allocation nette finale */
  net_allowance: Decimal
  /** Revenu familial net utilisé pour le calcul */
  family_net_income: Decimal
  /** Nombre d'enfants éligibles */
  eligible_children: number
  /** Seuil de réduction applicable */
  reduction_threshold: Decimal
}

export class FamilyAllowanceCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'family_allowance'
  }

  /**
   * Méthode héritée de BaseCalculator (interface simplifiée)
   * @param household Données du ménage
   * @returns Allocation sous format Record<string, Decimal>
   */
  calculate(household: Household): Record<string, Decimal> {
    const result = this.calculateDetailed(household)
    return {
      net_allowance: result.net_allowance,
      basic_allowance: result.basic_allowance,
      total_supplements: result.single_parent_supplement
        .plus(result.school_supplies_supplement)
        .plus(result.disabled_child_supplement)
    }
  }

  /**
   * Calcule l'allocation famille détaillée avec tous les suppléments
   * 
   * @param household Données du ménage
   * @param taxResults Résultats des calculs d'impôt (optionnel)
   * @returns Détails complets de l'allocation famille
   */
  calculateDetailed(
    household: Household, 
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): FamilyAllowanceResult {
    
    // Vérification de l'éligibilité de base
    if ((household.children?.length ?? 0) === 0) {
      return this.createZeroResult(new Decimal(0))
    }

    // Calcul du revenu familial net
    const familyNetIncome = this.calculateFamilyNetIncome(household, taxResults)
    
    // Paramètres de configuration
    const config = this.getConfigValue('basic_allowance')
    const maxAmount = this.toDecimal(config.max_amount)
    const minAmount = this.toDecimal(config.min_amount)
    
    // 1. Allocation de base par enfant
    const basicAllowance = maxAmount.times((household.children?.length ?? 0))
    
    // 2. Supplément pour famille monoparentale
    const singleParentSupplement = this.calculateSingleParentSupplement(household)
    
    // 3. Supplément pour fournitures scolaires (maintenant calculé séparément)
    const schoolSuppliesSupplement = new Decimal(0)
    
    // 4. Supplément pour enfant handicapé (non implémenté dans ce MVP)
    const disabledChildSupplement = new Decimal(0)
    
    // 5. Total brut
    const grossTotal = basicAllowance
      .plus(singleParentSupplement)
      .plus(schoolSuppliesSupplement)
      .plus(disabledChildSupplement)
    
    // 6. Calcul de la réduction selon le revenu
    const reductionThreshold = this.getReductionThreshold(household)
    const reductionAmount = this.calculateReduction(grossTotal, familyNetIncome, reductionThreshold, household)
    
    // 7. Allocation nette (minimum garanti par enfant)
    const minimumTotal = minAmount.times((household.children?.length ?? 0))
    const netAllowance = Decimal.max(minimumTotal, grossTotal.minus(reductionAmount))

    return {
      basic_allowance: this.quantize(basicAllowance),
      single_parent_supplement: this.quantize(singleParentSupplement),
      school_supplies_supplement: this.quantize(schoolSuppliesSupplement),
      disabled_child_supplement: this.quantize(disabledChildSupplement),
      gross_total: this.quantize(grossTotal),
      reduction_amount: this.quantize(reductionAmount),
      net_allowance: this.quantize(netAllowance),
      family_net_income: this.quantize(familyNetIncome),
      eligible_children: (household.children?.length ?? 0),
      reduction_threshold: this.quantize(reductionThreshold)
    }
  }

  /**
   * Calcule le revenu familial net
   */
  private calculateFamilyNetIncome(
    household: Household, 
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Decimal {
    // Utiliser les résultats d'impôt si disponibles
    if (taxResults?.quebec_net_income && taxResults?.federal_net_income) {
      // Utiliser le plus conservateur (généralement le Québec)
      return Decimal.min(taxResults.quebec_net_income, taxResults.federal_net_income)
    }
    
    // Estimation de base : revenu brut moins déductions estimées
    let grossIncome = household.primaryPerson.isRetired 
      ? household.primaryPerson.grossRetirementIncome 
      : household.primaryPerson.grossWorkIncome

    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      grossIncome = grossIncome.plus(spouseIncome)
    }

    // Estimation conservative : 85% du revenu brut comme revenu net
    return grossIncome.times(0.85)
  }

  /**
   * Calcule le supplément pour famille monoparentale
   */
  private calculateSingleParentSupplement(household: Household): Decimal {
    if (household.householdType !== HouseholdType.SINGLE_PARENT) {
      return new Decimal(0)
    }

    const supplementConfig = this.getConfigValue('single_parent_supplement')
    return this.toDecimal(supplementConfig.max_amount)
  }


  /**
   * Obtient le seuil de réduction selon le type de ménage
   */
  private getReductionThreshold(household: Household): Decimal {
    const reductionConfig = this.getConfigValue('reduction')
    
    if (household.householdType === HouseholdType.SINGLE_PARENT) {
      return this.toDecimal(reductionConfig.thresholds.single_parent)
    }
    
    return this.toDecimal(reductionConfig.thresholds.couple)
  }

  /**
   * Calcule la réduction selon le revenu familial net
   */
  private calculateReduction(
    grossTotal: Decimal, 
    familyNetIncome: Decimal, 
    reductionThreshold: Decimal,
    household: Household
  ): Decimal {
    // Pas de réduction si le revenu est sous le seuil
    if (familyNetIncome.lessThanOrEqualTo(reductionThreshold)) {
      return new Decimal(0)
    }

    // Calcul de l'excédent de revenu
    const excessIncome = familyNetIncome.minus(reductionThreshold)
    
    // Application du taux de réduction (4%)
    const reductionConfig = this.getConfigValue('reduction')
    const reductionRate = this.toDecimal(reductionConfig.rate)
    const reductionAmount = excessIncome.times(reductionRate)

    // La réduction ne peut pas dépasser le montant brut moins le minimum garanti
    const basicConfig = this.getConfigValue('basic_allowance')
    const minAmount = this.toDecimal(basicConfig.min_amount)
    const minimumTotal = minAmount.times((household.children?.length ?? 0))
    
    const maxReduction = grossTotal.minus(minimumTotal)
    
    return Decimal.min(reductionAmount, Decimal.max(0, maxReduction))
  }

  /**
   * Crée un résultat vide pour les cas non éligibles
   */
  private createZeroResult(familyNetIncome: Decimal): FamilyAllowanceResult {
    const zero = new Decimal(0)
    return {
      basic_allowance: zero,
      single_parent_supplement: zero,
      school_supplies_supplement: zero,
      disabled_child_supplement: zero,
      gross_total: zero,
      reduction_amount: zero,
      net_allowance: zero,
      family_net_income: this.quantize(familyNetIncome),
      eligible_children: 0,
      reduction_threshold: zero
    }
  }

  /**
   * Vérifie si un ménage est éligible à l'allocation famille
   */
  public isEligible(household: Household): boolean {
    return (household.children?.length ?? 0) > 0
  }

  /**
   * Obtient le montant maximum par enfant
   */
  public getMaxAmountPerChild(): Decimal {
    const config = this.getConfigValue('basic_allowance')
    return this.toDecimal(config.max_amount)
  }

  /**
   * Obtient le montant minimum par enfant
   */
  public getMinAmountPerChild(): Decimal {
    const config = this.getConfigValue('basic_allowance')
    return this.toDecimal(config.min_amount)
  }
}

// Enregistrement du calculateur dans le registre
CalculatorRegistry.register('family_allowance', FamilyAllowanceCalculator)