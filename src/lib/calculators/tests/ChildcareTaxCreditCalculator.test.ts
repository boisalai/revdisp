import { ChildcareTaxCreditCalculator, ChildcareTaxCreditInput } from '../ChildcareTaxCreditCalculator'
import { ConfigManager } from '../../config/ConfigManager'

/**
 * Tests de validation du calculateur de crédit d'impôt pour frais de garde
 * 
 * Ces tests utilisent des scénarios réels pour valider la conformité
 * avec le calculateur officiel du ministère des Finances du Québec.
 */

describe('ChildcareTaxCreditCalculator', () => {
  let calculator: ChildcareTaxCreditCalculator
  
  beforeEach(() => {
    calculator = new ChildcareTaxCreditCalculator(2024)
  })

  describe('Scénarios de validation 2024', () => {
    test('Famille à 30 000$ avec 1 enfant de 3 ans - 5000$ de frais', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 30000,
        children: [
          {
            age: 3,
            has_disability: false,
            childcare_expenses: 5000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      
      // Enfant de 3 ans = moins de 7 ans
      // Maximum éligible: 11 935$ (2024)
      // Frais éligibles: min(5000, 11935) = 5000$
      // Taux à 30 000$: 77% (dans la tranche 24110-30470)
      // Crédit attendu: 5000 * 0.77 = 3850$
      
      expect(result.eligible_children).toBe(1)
      expect(result.total_eligible_expenses).toBe(5000)
      expect(result.credit_rate).toBe(0.77)
      expect(result.gross_credit).toBe(3850)
      expect(result.net_credit).toBe(3850)
    })

    test('Famille à 50 000$ avec 2 enfants (5 ans et 12 ans)', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 50000,
        children: [
          {
            age: 5,
            has_disability: false,
            childcare_expenses: 8000
          },
          {
            age: 12,
            has_disability: false,
            childcare_expenses: 4000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      
      // Enfant de 5 ans: max 11 935$, frais 8000$ → éligible 8000$
      // Enfant de 12 ans: max 6010$, frais 4000$ → éligible 4000$
      // Total éligible: 12 000$
      // Taux à 50 000$: 74% (dans la tranche 49560-55925)
      // Crédit: 12000 * 0.74 = 8880$
      
      expect(result.eligible_children).toBe(2)
      expect(result.total_eligible_expenses).toBe(12000)
      expect(result.credit_rate).toBe(0.74)
      expect(result.gross_credit).toBe(8880)
    })

    test('Famille à 80 000$ avec enfant handicapé', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 80000,
        children: [
          {
            age: 8,
            has_disability: true,
            childcare_expenses: 15000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      
      // Enfant handicapé: max 16 335$ (2024)
      // Frais éligibles: min(15000, 16335) = 15000$
      // Taux à 80 000$: 69% (dans la tranche 75010-81375)
      // Crédit: 15000 * 0.69 = 10350$
      
      expect(result.eligible_children).toBe(1)
      expect(result.total_eligible_expenses).toBe(15000)
      expect(result.credit_rate).toBe(0.69)
      expect(result.gross_credit).toBe(10350)
    })

    test('Famille à revenu élevé (150 000$)', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 150000,
        children: [
          {
            age: 4,
            has_disability: false,
            childcare_expenses: 10000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      
      // Revenu > 116 515$ → taux minimum 67%
      // Frais éligibles: min(10000, 11935) = 10000$
      // Crédit: 10000 * 0.67 = 6700$
      
      expect(result.eligible_children).toBe(1)
      expect(result.total_eligible_expenses).toBe(10000)
      expect(result.credit_rate).toBe(0.67)
      expect(result.gross_credit).toBe(6700)
    })

    test('Enfant de 17 ans - non éligible', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 40000,
        children: [
          {
            age: 17,
            has_disability: false,
            childcare_expenses: 5000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      
      // Enfant > 16 ans = non éligible
      expect(result.eligible_children).toBe(0)
      expect(result.total_eligible_expenses).toBe(0)
      expect(result.gross_credit).toBe(0)
    })
  })

  describe('Calculs de taux selon le revenu', () => {
    test('Taux maximum (78%) pour revenu très faible', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 20000,
        children: [
          {
            age: 5,
            has_disability: false,
            childcare_expenses: 5000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      expect(result.credit_rate).toBe(0.78)
    })

    test('Vérification des seuils de revenus 2024', () => {
      // Test des limites exactes des tranches
      const testCases = [
        { income: 24109, expectedRate: 0.78 }, // Juste avant le seuil
        { income: 24110, expectedRate: 0.77 }, // Exactement au seuil
        { income: 30469, expectedRate: 0.77 }, // Juste avant le suivant
        { income: 30470, expectedRate: 0.76 }, // Nouveau seuil
      ]

      testCases.forEach(({ income, expectedRate }) => {
        const input: ChildcareTaxCreditInput = {
          family_net_income: income,
          children: [
            {
              age: 5,
              has_disability: false,
              childcare_expenses: 1000
            }
          ]
        }

        const result = calculator.calculateChildcareTaxCredit(input)
        expect(result.credit_rate).toBe(expectedRate)
      })
    })
  })

  describe('Limites maximales des frais éligibles', () => {
    test('Enfant de moins de 7 ans - limite 11 935$ (2024)', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 40000,
        children: [
          {
            age: 6,
            has_disability: false,
            childcare_expenses: 15000 // Dépasse la limite
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      expect(result.total_eligible_expenses).toBe(11935) // Plafonné
    })

    test('Enfant handicapé - limite 16 335$ (2024)', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 40000,
        children: [
          {
            age: 10,
            has_disability: true,
            childcare_expenses: 20000 // Dépasse la limite
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      expect(result.total_eligible_expenses).toBe(16335) // Plafonné
    })

    test('Autres enfants éligibles - limite 6 010$ (2024)', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 40000,
        children: [
          {
            age: 10,
            has_disability: false,
            childcare_expenses: 8000 // Dépasse la limite
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      expect(result.total_eligible_expenses).toBe(6010) // Plafonné
    })
  })

  describe('Tests de régression pour 2023 et 2025', () => {
    test('Configuration 2023 chargée correctement', () => {
      const calculator2023 = new ChildcareTaxCreditCalculator(2023)
      const config = calculator2023.calculatorConfig as any
      
      // Vérifier les montants 2023
      expect(config.max_expenses.disabled_child).toBe(15545)
      expect(config.max_expenses.under_7).toBe(11360)
      expect(config.max_expenses.other_children).toBe(5720)
    })

    test('Configuration 2025 avec indexation', () => {
      const calculator2025 = new ChildcareTaxCreditCalculator(2025)
      const config = calculator2025.calculatorConfig as any
      
      // Vérifier les montants 2025 (indexés)
      expect(config.max_expenses.disabled_child).toBe(16800)
      expect(config.max_expenses.under_7).toBe(12275)
      expect(config.max_expenses.other_children).toBe(6180)
    })
  })

  describe('Validation des structures de données', () => {
    test('Breakdown détaillé fourni', () => {
      const input: ChildcareTaxCreditInput = {
        family_net_income: 40000,
        children: [
          {
            age: 5,
            has_disability: false,
            childcare_expenses: 8000
          },
          {
            age: 12,
            has_disability: true,
            childcare_expenses: 12000
          }
        ]
      }

      const result = calculator.calculateChildcareTaxCredit(input)
      
      expect(result.breakdown).toHaveLength(2)
      
      // Premier enfant (5 ans)
      expect(result.breakdown[0].child_age).toBe(5)
      expect(result.breakdown[0].has_disability).toBe(false)
      expect(result.breakdown[0].expenses).toBe(8000)
      expect(result.breakdown[0].max_eligible).toBe(11935)
      expect(result.breakdown[0].eligible_expenses).toBe(8000)
      
      // Deuxième enfant (12 ans, handicapé)
      expect(result.breakdown[1].child_age).toBe(12)
      expect(result.breakdown[1].has_disability).toBe(true)
      expect(result.breakdown[1].expenses).toBe(12000)
      expect(result.breakdown[1].max_eligible).toBe(16335)
      expect(result.breakdown[1].eligible_expenses).toBe(12000)
    })
  })
})