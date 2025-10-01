/**
 * Quebec Pension Plan (QPP/RRQ) calculator
 * 
 * Sources officielles:
 * - Chaire en fiscalité et en finances publiques, Cotisations au RRQ, au RQAP et à l'assurance-emploi
 *   https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/
 * - Régie des rentes du Québec
 * - Agence du revenu du Canada
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
        total: new Decimal(0),
        first_contribution: new Decimal(0),
        second_contribution: new Decimal(0)
      }
    }

    // Calcul des cotisations selon le type de revenu avec composantes séparées
    const employmentResult = this.calculateContributionDetailed(this.toDecimal(person.grossWorkIncome))
    const selfEmployedResult = this.calculateContributionDetailed(
      this.toDecimal(person.selfEmployedIncome),
      true
    )

    const total = employmentResult.total.plus(selfEmployedResult.total)
    const firstContribution = employmentResult.first.plus(selfEmployedResult.first)
    const secondContribution = employmentResult.second.plus(selfEmployedResult.second)

    return {
      employment: this.quantize(employmentResult.total),
      self_employed: this.quantize(selfEmployedResult.total),
      total: this.quantize(total),
      first_contribution: this.quantize(firstContribution),
      second_contribution: this.quantize(secondContribution)
    }
  }

  /**
   * Calcule la cotisation avec détails des deux composantes (première et deuxième cotisation)
   * Nécessaire pour le calcul de la déduction à l'impôt du Québec
   */
  private calculateContributionDetailed(income: Decimal, isSelfEmployed: boolean = false): {
    first: Decimal
    second: Decimal
    total: Decimal
  } {
    const basicExemption = this.toDecimal(this.getConfigValue('basic_exemption'))

    if (income.lessThanOrEqualTo(basicExemption)) {
      return {
        first: new Decimal(0),
        second: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Paramètres RRQ 2024+
    const maxPensionableEarnings = this.toDecimal(this.getConfigValue('max_pensionable_earnings'))  // 68500
    const maxAdditionalEarnings = this.toDecimal(this.getConfigValue('max_additional_earnings'))    // 73200
    const firstRate = this.toDecimal(this.getConfigValue('first_contribution_rate'))                // 6.40%
    const secondRate = this.toDecimal(this.getConfigValue('second_contribution_rate'))              // 4.00%

    let firstContrib = new Decimal(0)
    let secondContrib = new Decimal(0)

    // Première cotisation : de 3500$ à 68500$ à 6.40%
    if (income.greaterThan(basicExemption)) {
      const firstBracketIncome = Decimal.min(income, maxPensionableEarnings).minus(basicExemption)
      firstContrib = firstBracketIncome.times(firstRate)

      if (isSelfEmployed) {
        firstContrib = firstContrib.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
      }
    }

    // Deuxième cotisation : revenus au-dessus du maximum de la première cotisation (si applicable)
    if (income.greaterThan(maxPensionableEarnings) && maxAdditionalEarnings.greaterThan(maxPensionableEarnings)) {
      const secondBracketIncome = Decimal.min(income, maxAdditionalEarnings).minus(maxPensionableEarnings)

      // Seulement si le revenu dépasse effectivement le seuil de la première cotisation
      if (secondBracketIncome.greaterThan(0)) {
        secondContrib = secondBracketIncome.times(secondRate)

        if (isSelfEmployed) {
          secondContrib = secondContrib.times(this.toDecimal(this.getConfigValue('self_employed_multiplier')))
        }
      }
    }

    return {
      first: firstContrib,
      second: secondContrib,
      total: firstContrib.plus(secondContrib)
    }
  }

  private calculateContribution(income: Decimal, isSelfEmployed: boolean = false): Decimal {
    return this.calculateContributionDetailed(income, isSelfEmployed).total
  }

}

// Register the calculator
CalculatorRegistry.register('qpp', QppCalculator)