/**
 * Quebec prescription drug insurance (RAMQ) calculator
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Household, HouseholdType } from '../models'

interface QcTaxResult {
  net_income: {
    family: Decimal
  }
}

export class RamqCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'ramq'
  }

  calculate(household: Household, qcTaxResult: QcTaxResult): Record<string, Decimal> {
    // CORRECTION MAJEURE: Les retraités de 65+ ans sont exemptés de RAMQ
    // selon la validation officielle du MFQ
    const isRetiredHousehold = [HouseholdType.RETIRED_SINGLE, HouseholdType.RETIRED_COUPLE].includes(household.householdType)
    
    if (isRetiredHousehold) {
      // Vérifier si au moins une personne a 65+ ans (critère d'exemption)
      const primaryAge = household.primaryPerson.age
      const spouseAge = household.spouse?.age || 0
      
      if (primaryAge >= 65 || spouseAge >= 65) {
        return { contribution: new Decimal(0) }
      }
    }

    // Utiliser le revenu familial net calculé par l'impôt du Québec
    const totalIncome = qcTaxResult.net_income.family

    // Déterminer le seuil d'exemption
    const exemption = this.getExemptionThreshold(household.householdType, household.numChildren)

    // Si le revenu est sous le seuil d'exemption, pas de cotisation
    if (totalIncome.lessThanOrEqualTo(exemption)) {
      return { contribution: new Decimal(0) }
    }

    // Calculer le revenu servant au calcul de la cotisation
    const incomeForCalculation = totalIncome.minus(exemption)

    const isCouple = [HouseholdType.COUPLE, HouseholdType.RETIRED_COUPLE].includes(household.householdType)

    let contribution: Decimal
    if (isCouple) {
      contribution = this.calculateCoupleContribution(incomeForCalculation)
      // CORRECTION: Ne pas multiplier par 2 pour un couple
      // La contribution calculée est déjà pour le couple complet
    } else {
      contribution = this.calculateSingleContribution(incomeForCalculation)
    }

    return {
      contribution: this.quantize(contribution)
    }
  }

  private getExemptionThreshold(householdType: HouseholdType, numChildren: number): Decimal {
    if ([HouseholdType.SINGLE, HouseholdType.RETIRED_SINGLE].includes(householdType)) {
      if (numChildren === 0) {
        return this.toDecimal(this.getConfigValue('exemption_single'))
      } else if (numChildren === 1) {
        return this.toDecimal(this.getConfigValue('exemption_single_one_child'))
      } else {
        return this.toDecimal(this.getConfigValue('exemption_single_multiple_children'))
      }
    } else {
      // Couple ou couple retraité
      if (numChildren === 0) {
        return this.toDecimal(this.getConfigValue('exemption_couple'))
      } else if (numChildren === 1) {
        return this.toDecimal(this.getConfigValue('exemption_couple_one_child'))
      } else {
        return this.toDecimal(this.getConfigValue('exemption_couple_multiple_children'))
      }
    }
  }

  private calculateSingleContribution(income: Decimal): Decimal {
    if (income.lessThanOrEqualTo(0)) {
      return new Decimal(0)
    }

    const firstThreshold = this.toDecimal(this.getConfigValue('first_threshold'))
    const baseRateSingle = this.toDecimal(this.getConfigValue('base_rate_single'))
    const additionalRateSingle = this.toDecimal(this.getConfigValue('additional_rate_single'))
    const baseMaxSingle = this.toDecimal(this.getConfigValue('base_max_single'))
    const maxContribution = this.toDecimal(this.getConfigValue('max_contribution'))

    if (income.lessThanOrEqualTo(firstThreshold)) {
      return Decimal.min(
        income.times(baseRateSingle),
        baseMaxSingle
      )
    }

    const baseContribution = firstThreshold.times(baseRateSingle)
    const additionalContribution = income.minus(firstThreshold).times(additionalRateSingle)

    return Decimal.min(
      baseContribution.plus(additionalContribution),
      maxContribution
    )
  }

  private calculateCoupleContribution(income: Decimal): Decimal {
    if (income.lessThanOrEqualTo(0)) {
      return new Decimal(0)
    }

    const firstThreshold = this.toDecimal(this.getConfigValue('first_threshold'))
    const baseRateCouple = this.toDecimal(this.getConfigValue('base_rate_couple'))
    const additionalRateCouple = this.toDecimal(this.getConfigValue('additional_rate_couple'))
    const baseMaxCouple = this.toDecimal(this.getConfigValue('base_max_couple'))
    const maxContribution = this.toDecimal(this.getConfigValue('max_contribution'))

    if (income.lessThanOrEqualTo(firstThreshold)) {
      return Decimal.min(
        income.times(baseRateCouple),
        baseMaxCouple
      )
    }

    const baseContribution = firstThreshold.times(baseRateCouple)
    const additionalContribution = income.minus(firstThreshold).times(additionalRateCouple)

    return Decimal.min(
      baseContribution.plus(additionalContribution),
      maxContribution
    )
  }
}

// Register the calculator
CalculatorRegistry.register('ramq', RamqCalculator)