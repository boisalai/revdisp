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
    const base = this.calculateBaseContribution(income, isSelfEmployed)
    const additional = this.calculateAdditionalContribution(income, isSelfEmployed)
    return base.plus(additional)
  }

  private calculateBaseContribution(income: Decimal, isSelfEmployed: boolean = false): Decimal {
    const basicExemption = this.toDecimal(this.getConfigValue('basic_exemption'))
    
    if (income.lessThanOrEqualTo(basicExemption)) {
      return new Decimal(0)
    }

    const maxEarnings = this.toDecimal(this.getConfigValue('max_pensionable_earnings'))
    const pensionableEarnings = Decimal.min(income, maxEarnings).minus(basicExemption)
    
    let rate = this.toDecimal(this.getConfigValue('base_rate'))
    if (isSelfEmployed) {
      rate = rate.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
    }

    return pensionableEarnings.times(rate)
  }

  private calculateAdditionalContribution(income: Decimal, isSelfEmployed: boolean = false): Decimal {
    const basicExemption = this.toDecimal(this.getConfigValue('basic_exemption'))
    
    if (income.lessThanOrEqualTo(basicExemption)) {
      return new Decimal(0)
    }

    const maxPensionable = this.toDecimal(this.getConfigValue('max_pensionable_earnings'))
    let contribution = new Decimal(0)

    // 2024: nouvelle structure à deux paliers
    if (this.taxYear === 2024) {
      // Premier palier (jusqu'au MGA)
      const firstTierEarnings = Decimal.min(income, maxPensionable).minus(basicExemption)
      let firstTierRate = this.toDecimal(this.getConfigValue('additional_rate_first'))
      if (isSelfEmployed) {
        firstTierRate = firstTierRate.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
      }
      contribution = firstTierEarnings.times(firstTierRate)

      // Deuxième palier (entre MGA et maximum additionnel)
      if (income.greaterThan(maxPensionable)) {
        const maxAdditional = this.toDecimal(this.getConfigValue('max_additional_earnings'))
        const secondTierEarnings = Decimal.min(
          income.minus(maxPensionable),
          maxAdditional.minus(maxPensionable)
        )
        let secondTierRate = this.toDecimal(this.getConfigValue('additional_rate_second'))
        if (isSelfEmployed) {
          secondTierRate = secondTierRate.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
        }
        contribution = contribution.plus(secondTierEarnings.times(secondTierRate))
      }
    } else {
      // 2023: structure simple - utilise le premier taux additionnel
      const pensionableEarnings = Decimal.min(income, maxPensionable).minus(basicExemption)
      let rate = this.toDecimal(this.getConfigValue('additional_rate_first'))
      if (isSelfEmployed) {
        rate = rate.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
      }
      contribution = pensionableEarnings.times(rate)
    }

    return contribution
  }
}

// Register the calculator
CalculatorRegistry.register('qpp', QppCalculator)