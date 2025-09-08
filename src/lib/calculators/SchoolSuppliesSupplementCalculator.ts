/**
 * Supplément pour l'achat de fournitures scolaires Calculator
 * 
 * Calcule le supplément québécois pour l'achat de fournitures scolaires
 * 
 * Règles principales:
 * - Aide financière automatique de 124$ par enfant éligible (2025)
 * - Enfants âgés de 4 à 16 ans au 30 septembre de l'année scolaire
 * - Enfants âgés de 4 à 17 ans s'ils reçoivent un supplément pour enfant handicapé
 * - Non imposable et non conditionnel au revenu familial
 * - Versé automatiquement en juillet avec l'Allocation famille
 * - En garde partagée (40-60% du temps), chaque parent reçoit 50%
 * 
 * Sources officielles:
 * - Retraite Québec: https://www.retraitequebec.gouv.qc.ca/fr/enfants/Pages/supplement-achat-fournitures-scolaires.aspx
 * - Calculateur MFQ: https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Household } from '../models'

export interface SchoolSuppliesSupplementResult {
  /** Montant total du supplément */
  total_amount: Decimal
  /** Montant par enfant éligible */
  amount_per_child: Decimal
  /** Nombre d'enfants éligibles */
  eligible_children: number
  /** Âge minimum pour l'éligibilité */
  min_age: number
  /** Âge maximum pour l'éligibilité standard */
  max_age: number
  /** Âge maximum si supplément pour enfant handicapé */
  max_age_with_disability: number
}

export class SchoolSuppliesSupplementCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'school_supplies_supplement'
  }

  /**
   * Méthode héritée de BaseCalculator (interface simplifiée)
   * @param household Données du ménage
   * @returns Supplément sous format Record<string, Decimal>
   */
  calculate(household: Household): Record<string, Decimal> {
    const result = this.calculateDetailed(household)
    return {
      total_amount: result.total_amount,
      eligible_children: new Decimal(result.eligible_children)
    }
  }

  /**
   * Calcule le supplément pour fournitures scolaires détaillé
   * 
   * @param household Données du ménage
   * @param hasDisabledChildSupplement Indique si au moins un enfant reçoit le supplément handicap (optionnel)
   * @returns Détails complets du supplément
   */
  calculateDetailed(
    household: Household,
    hasDisabledChildSupplement: boolean = false
  ): SchoolSuppliesSupplementResult {
    
    // Vérification de l'éligibilité de base
    if ((household.children?.length ?? 0) === 0) {
      return this.createZeroResult()
    }

    // Paramètres de configuration
    const amountPerChild = this.toDecimal(this.getConfigValue('amount'))
    const minAge = this.getConfigValue('min_age')
    const maxAge = this.getConfigValue('max_age')
    const maxAgeWithDisability = this.getConfigValue('max_age_with_disability', 17)
    
    // Calcul du nombre d'enfants éligibles
    // Dans cette implémentation MVP, on assume que tous les enfants sont dans la tranche d'âge éligible
    // Une implémentation complète nécessiterait l'âge individuel de chaque enfant
    const eligibleChildren = this.calculateEligibleChildren(
      household, 
      minAge, 
      hasDisabledChildSupplement ? maxAgeWithDisability : maxAge
    )
    
    // Calcul du montant total
    const totalAmount = amountPerChild.times(eligibleChildren)

    return {
      total_amount: this.quantize(totalAmount),
      amount_per_child: this.quantize(amountPerChild),
      eligible_children: eligibleChildren,
      min_age: minAge,
      max_age: maxAge,
      max_age_with_disability: maxAgeWithDisability
    }
  }

  /**
   * Calcule le nombre d'enfants éligibles selon l'âge
   * 
   * Dans cette implémentation MVP, on assume que tous les enfants du ménage
   * sont éligibles (âgés de 4-16 ans). Une implémentation complète nécessiterait
   * l'âge individuel de chaque enfant.
   */
  private calculateEligibleChildren(
    household: Household,
    minAge: number,
    maxAge: number
  ): number {
    // Pour cette implémentation MVP, on assume que tous les enfants sont éligibles
    // Ceci est cohérent avec l'implémentation actuelle dans FamilyAllowanceCalculator
    return (household.children?.length ?? 0)
  }

  /**
   * Crée un résultat vide pour les cas non éligibles
   */
  private createZeroResult(): SchoolSuppliesSupplementResult {
    const zero = new Decimal(0)
    return {
      total_amount: zero,
      amount_per_child: zero,
      eligible_children: 0,
      min_age: this.getConfigValue('min_age'),
      max_age: this.getConfigValue('max_age'),
      max_age_with_disability: this.getConfigValue('max_age_with_disability', 17)
    }
  }

  /**
   * Vérifie si un ménage est éligible au supplément
   */
  public isEligible(household: Household): boolean {
    return (household.children?.length ?? 0) > 0
  }

  /**
   * Obtient le montant par enfant pour l'année fiscale
   */
  public getAmountPerChild(): Decimal {
    return this.toDecimal(this.getConfigValue('amount'))
  }

  /**
   * Vérifie si un enfant d'un âge donné est éligible
   */
  public isChildEligible(age: number, hasDisabilitySupplement: boolean = false): boolean {
    const minAge = this.getConfigValue('min_age')
    const maxAge = hasDisabilitySupplement 
      ? this.getConfigValue('max_age_with_disability', 17)
      : this.getConfigValue('max_age')
    
    return age >= minAge && age <= maxAge
  }

  /**
   * Calcule le montant en cas de garde partagée (50% à chaque parent)
   */
  public calculateSharedCustodyAmount(household: Household): Decimal {
    const fullAmount = this.calculateDetailed(household).total_amount
    return this.quantize(fullAmount.dividedBy(2))
  }
}

// Enregistrement du calculateur dans le registre
CalculatorRegistry.register('school_supplies_supplement', SchoolSuppliesSupplementCalculator)