/**
 * Régime québécois d'assurance parentale (RQAP) calculator
 * 
 * Sources officielles:
 * - Chaire en fiscalité et en finances publiques, Cotisations au RRQ, au RQAP et à l'assurance-emploi
 *   https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/
 * - Conseil de gestion de l'assurance parentale (CGAP)
 * - Régie des rentes du Québec
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person } from '../models'

export class RqapCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'qpip'
  }

  calculate(person: Person): Record<string, Decimal> {
    // Les retraités de 65 ans et plus ne cotisent pas au RQAP
    if (person.isRetired && person.age >= 65) {
      return {
        employee: new Decimal(0),
        self_employed: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Calcul des cotisations selon le type de revenu
    const employeeContrib = this.calculateEmployeeContribution(person.grossWorkIncome)
    const selfEmployedContrib = this.calculateSelfEmployedContribution(person.selfEmployedIncome)

    const total = employeeContrib.plus(selfEmployedContrib)

    return {
      employee: this.quantize(employeeContrib),
      self_employed: this.quantize(selfEmployedContrib),
      total: this.quantize(total)
    }
  }

  private calculateEmployeeContribution(income: Decimal): Decimal {
    const minEarnings = this.toDecimal(this.getConfigValue('min_earnings'))
    
    if (income.lessThan(minEarnings)) {
      return new Decimal(0)
    }

    const maxInsurable = this.toDecimal(this.getConfigValue('max_insurable_earnings'))
    const insurableEarnings = Decimal.min(income, maxInsurable)
    const rate = this.toDecimal(this.getConfigValue('employee_rate'))

    return insurableEarnings.times(rate)
  }

  private calculateSelfEmployedContribution(income: Decimal): Decimal {
    const minEarnings = this.toDecimal(this.getConfigValue('min_earnings'))
    
    if (income.lessThan(minEarnings)) {
      return new Decimal(0)
    }

    const maxInsurable = this.toDecimal(this.getConfigValue('max_insurable_earnings'))
    const insurableEarnings = Decimal.min(income, maxInsurable)
    const rate = this.toDecimal(this.getConfigValue('self_employed_rate'))

    return insurableEarnings.times(rate)
  }
}

// Register the calculator
CalculatorRegistry.register('qpip', RqapCalculator)