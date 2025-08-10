/**
 * Fonds des services de santé (FSS) calculator
 * Applicable aux retraités de 65 ans et plus seulement
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person } from '../models'

export class FssCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'fss'
  }

  calculate(person: Person): Record<string, Decimal> {
    // FSS s'applique uniquement aux retraités de 65 ans et plus
    if (!person.isRetired || person.age < 65) {
      return {
        contribution: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Calcul basé sur le revenu de retraite total
    const totalRetirementIncome = person.grossRetirementIncome
    const contribution = this.calculateFssContribution(totalRetirementIncome)

    return {
      contribution: this.quantize(contribution),
      total: this.quantize(contribution)
    }
  }

  private calculateFssContribution(income: Decimal): Decimal {
    const maxContribution = this.toDecimal(this.getConfigValue('max_contribution'))
    const rate = this.toDecimal(this.getConfigValue('rate'))

    // Structure FSS 2024 (source officielle validée)
    const structure2024 = {
      tier1: { min: 0, max: 17630, calculation: () => new Decimal(0) },
      tier2: { min: 17630, max: 32630, calculation: (income: Decimal) => income.minus(17630).times(rate) },
      tier3: { min: 32630, max: 61315, calculation: () => new Decimal(150) },
      tier4: { min: 61315, max: 146315, calculation: (income: Decimal) => new Decimal(150).plus(income.minus(61315).times(rate)) },
      tier5: { min: 146315, max: Infinity, calculation: () => new Decimal(1000) }
    }

    // Structure FSS 2025 (estimation indexée)
    const structure2025 = {
      tier1: { min: 0, max: 17500, calculation: () => new Decimal(0) },
      tier2: { min: 17500, max: 32500, calculation: (income: Decimal) => income.minus(17500).times(rate) },
      tier3: { min: 32500, max: 61000, calculation: () => new Decimal(150) },
      tier4: { min: 61000, max: 145000, calculation: (income: Decimal) => new Decimal(150).plus(income.minus(61000).times(rate)) },
      tier5: { min: 145000, max: Infinity, calculation: () => new Decimal(1000) }
    }

    const structure = this.taxYear === 2024 ? structure2024 : structure2025
    const incomeNum = income.toNumber()

    // Déterminer le palier et calculer la contribution
    for (const tier of Object.values(structure)) {
      if (incomeNum >= tier.min && incomeNum <= tier.max) {
        return tier.calculation(income)
      }
    }

    // Par sécurité, plafonner à la contribution maximale
    return Decimal.min(maxContribution, new Decimal(1000))
  }
}

// Register the calculator
CalculatorRegistry.register('fss', FssCalculator)