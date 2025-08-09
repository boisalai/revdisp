/**
 * Employment Insurance (EI) calculator
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person } from '../models'

export class EmploymentInsuranceCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'employment_insurance'
  }

  calculate(person: Person): Record<string, Decimal> {
    // Les retraités de 65 ans et plus ne cotisent pas à l'AE
    if (person.isRetired && person.age >= 65) {
      return {
        employee: new Decimal(0),
        employer: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Si le revenu est inférieur au seuil minimum, pas de cotisation
    const minEarnings = this.toDecimal(this.getConfigValue('min_insurable_earnings'))
    if (person.grossWorkIncome.lessThan(minEarnings)) {
      return {
        employee: new Decimal(0),
        employer: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Le revenu assurable est le minimum entre le revenu de travail et le maximum assurable
    const maxEarnings = this.toDecimal(this.getConfigValue('max_insurable_earnings'))
    const insurableEarnings = Decimal.min(person.grossWorkIncome, maxEarnings)

    const employeeRate = this.toDecimal(this.getConfigValue('employee_rate'))
    const maxContribution = this.toDecimal(this.getConfigValue('max_employee_contribution'))

    let employeeContribution = Decimal.min(
      insurableEarnings.times(employeeRate),
      maxContribution
    )

    let employerContribution = Decimal.min(
      insurableEarnings.times(this.getEmployerRate()),
      this.getMaxEmployerContribution()
    )

    // Les travailleurs autonomes ne cotisent pas à l'AE
    if (person.selfEmployedIncome.greaterThan(0) && person.grossWorkIncome.equals(0)) {
      employeeContribution = new Decimal(0)
      employerContribution = new Decimal(0)
    }

    const total = employeeContribution.plus(employerContribution)

    return {
      employee: this.quantize(employeeContribution),
      employer: this.quantize(employerContribution),
      total: this.quantize(total)
    }
  }

  private getEmployerRate(): Decimal {
    const employeeRate = this.toDecimal(this.getConfigValue('employee_rate'))
    const multiplier = this.toDecimal(this.getConfigValue('employer_rate_multiplier'))
    return employeeRate.times(multiplier)
  }

  private getMaxEmployerContribution(): Decimal {
    const maxEmployee = this.toDecimal(this.getConfigValue('max_employee_contribution'))
    const multiplier = this.toDecimal(this.getConfigValue('employer_rate_multiplier'))
    return maxEmployee.times(multiplier)
  }
}

// Register the calculator
CalculatorRegistry.register('employment_insurance', EmploymentInsuranceCalculator)