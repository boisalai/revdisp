/**
 * Quebec Pension Plan (QPP/RRQ) calculator
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person } from '../models'

export class QppCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'qpp'
  }

  calculate(person: Person): Record<string, Decimal> {
    // Les retraités de 65 ans et plus ne cotisent pas au RRQ
    if (person.isRetired && person.age >= 65) {
      return {
        employment: new Decimal(0),
        self_employed: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Calcul des cotisations selon le type de revenu
    const employmentContrib = this.calculateContribution(person.grossWorkIncome)
    const selfEmployedContrib = this.calculateContribution(
      person.selfEmployedIncome,
      true
    )

    const total = employmentContrib.plus(selfEmployedContrib)

    return {
      employment: this.quantize(employmentContrib),
      self_employed: this.quantize(selfEmployedContrib),
      total: this.quantize(total)
    }
  }

  private calculateContribution(income: Decimal, isSelfEmployed: boolean = false): Decimal {
    const basicExemption = this.toDecimal(this.getConfigValue('basic_exemption'))
    
    if (income.lessThanOrEqualTo(basicExemption)) {
      return new Decimal(0)
    }

    const maxEarnings = this.toDecimal(this.getConfigValue('max_pensionable_earnings'))
    const pensionableEarnings = Decimal.min(income, maxEarnings).minus(basicExemption)
    
    // Utilise le taux total : 6.40% (5.40% base + 1.00% supplémentaire)
    let rate = this.toDecimal(this.getConfigValue('total_rate') || 0.064)
    if (isSelfEmployed) {
      rate = rate.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
    }

    return pensionableEarnings.times(rate)
  }

}

// Register the calculator
CalculatorRegistry.register('qpp', QppCalculator)