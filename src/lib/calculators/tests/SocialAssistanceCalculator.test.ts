/**
 * Tests pour le calculateur d'aide sociale du Québec
 */

import { SocialAssistanceCalculator } from '../SocialAssistanceCalculator'
import { SocialAssistanceInput, SocialAssistanceResult } from '../SocialAssistanceTypes'

describe('SocialAssistanceCalculator', () => {
  let calculator: SocialAssistanceCalculator

  beforeEach(async () => {
    calculator = new SocialAssistanceCalculator(2024)
    await calculator.initialize()
  })

  describe('Aide sociale de base - personne seule', () => {
    test('personne seule sans contrainte, sans revenu', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 0,
        liquid_assets: 500,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(784)
      expect(result.constraint_allocation).toBe(0)
      expect(result.work_income_supplement).toBe(0)
      expect(result.net_benefit).toBe(784)
      expect(result.program).toBe('aide_sociale')
    })

    test('personne seule avec contrainte temporaire, sans revenu', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'temporary',
        work_income: 0,
        liquid_assets: 500,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(784)
      expect(result.constraint_allocation).toBe(166)
      expect(result.net_benefit).toBe(950) // 784 + 166
      expect(result.program).toBe('aide_sociale')
    })

    test('personne seule avec revenus de travail exemptés', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 150, // Sous l'exemption de 200$
        liquid_assets: 500,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(784)
      expect(result.work_income_exemption).toBe(150)
      expect(result.income_reduction).toBe(0)
      expect(result.net_benefit).toBe(784) // Pas de réduction
    })

    test('personne seule avec revenus de travail excédentaires', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 400, // 200$ d'excédent
        liquid_assets: 500,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.work_income_exemption).toBe(200)
      expect(result.income_reduction).toBe(200) // 400 - 200
      expect(result.net_benefit).toBe(584) // 784 - 200
    })

    test('personne seule non admissible - avoirs liquides trop élevés', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 0,
        liquid_assets: 1000, // Au-dessus de la limite de 887$
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(false)
      expect(result.net_benefit).toBe(0)
      expect(result.ineligibility_reason).toContain('Avoirs liquides')
    })
  })

  describe('Aide sociale - couple', () => {
    test('couple sans contrainte, sans revenu', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'couple',
        employment_constraint: 'none',
        partner_employment_constraint: 'none',
        work_income: 0,
        partner_work_income: 0,
        liquid_assets: 1000,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(1213)
      expect(result.constraint_allocation).toBe(0)
      expect(result.net_benefit).toBe(1213)
    })

    test('couple avec contrainte temporaire (une personne)', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'couple',
        employment_constraint: 'temporary',
        partner_employment_constraint: 'none',
        work_income: 0,
        partner_work_income: 0,
        liquid_assets: 1000,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(1213)
      expect(result.constraint_allocation).toBe(166)
      expect(result.net_benefit).toBe(1379) // 1213 + 166
    })

    test('couple avec contrainte temporaire (les deux)', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'couple',
        employment_constraint: 'temporary',
        partner_employment_constraint: 'temporary',
        work_income: 0,
        partner_work_income: 0,
        liquid_assets: 1000,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(1213)
      expect(result.constraint_allocation).toBe(285)
      expect(result.net_benefit).toBe(1498) // 1213 + 285
    })

    test('couple avec revenus de travail combinés', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'couple',
        employment_constraint: 'none',
        partner_employment_constraint: 'none',
        work_income: 200,
        partner_work_income: 200, // Total 400$, exemption 300$
        liquid_assets: 1000,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.total_work_income).toBe(400)
      expect(result.work_income_exemption).toBe(300)
      expect(result.income_reduction).toBe(100) // 400 - 300
      expect(result.net_benefit).toBe(1113) // 1213 - 100
    })
  })

  describe('Programme objectif emploi', () => {
    test('première demande - personne seule', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 0,
        liquid_assets: 500,
        first_time_applicant: true,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(784)
      expect(result.single_adjustment).toBe(45)
      expect(result.net_benefit).toBe(829) // 784 + 45
      expect(result.program).toBe('objectif_emploi')
    })

    test('première demande - couple', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'couple',
        employment_constraint: 'none',
        work_income: 0,
        partner_work_income: 0,
        liquid_assets: 1000,
        first_time_applicant: true,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(1213)
      expect(result.single_adjustment).toBe(45)
      expect(result.net_benefit).toBe(1258) // 1213 + 45
    })
  })

  describe('Supplément revenu de travail 2025', () => {
    test('supplément de 25% sur revenus excédentaires', async () => {
      calculator = new SocialAssistanceCalculator(2025)
      await calculator.initialize()

      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 360, // 160$ d'excédent
        liquid_assets: 500,
        year: 2025
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.work_income_exemption).toBe(200)
      expect(result.work_income_supplement).toBe(40) // 25% de 160$
      expect(result.income_reduction).toBe(160)
      // Net: 800 (base 2025) - 160 (réduction) + 40 (supplément) = 680
    })
  })

  describe('Résidence avec parents', () => {
    test('personne seule vivant chez ses parents', async () => {
      const input: SocialAssistanceInput = {
        household_type: 'single',
        employment_constraint: 'none',
        work_income: 0,
        liquid_assets: 500,
        living_with_parents: true,
        year: 2024
      }

      const result = calculator.calculate(input)

      expect(result.eligible).toBe(true)
      expect(result.base_benefit).toBe(684) // Montant réduit
      expect(result.net_benefit).toBe(684)
    })
  })
})