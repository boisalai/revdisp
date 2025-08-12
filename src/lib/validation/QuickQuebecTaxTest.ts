/**
 * Quick validation test for Quebec Income Tax Calculator
 * Tests basic scenarios against expected results
 */

import { QcTaxCalculator } from '../calculators/QcTaxCalculator'
import { Person, Household, HouseholdType } from '../models'
import Decimal from 'decimal.js'

interface TestScenario {
  name: string
  grossIncome: number
  age: number
  isRetired: boolean
  contributions?: {
    rrq?: number
    ei?: number
    rqap?: number
  }
  expected: {
    taxableIncome: number
    taxBeforeCredits: number
    basicCredit: number
    netTax: number
  }
}

const testScenarios: TestScenario[] = [
  {
    name: "Single person, $50,000 income, age 35",
    grossIncome: 50000,
    age: 35,
    isRetired: false,
    contributions: {
      rrq: 2832.60,  // QPP max 2024
      ei: 1002.45,   // EI max 2024  
      rqap: 453.90   // RQAP max 2024
    },
    expected: {
      taxableIncome: 45711,   // After deductions
      taxBeforeCredits: 6400, // 45711 * 0.14
      basicCredit: 2528,      // 18056 * 0.14
      netTax: 3607            // After all credits including living alone
    }
  },
  {
    name: "Single person, $25,000 income, age 25",
    grossIncome: 25000,
    age: 25,
    isRetired: false,
    contributions: {
      rrq: 1416.30,
      ei: 501.25,
      rqap: 226.95
    },
    expected: {
      taxableIncome: 22856,
      taxBeforeCredits: 3200,   // 22856 * 0.14  
      basicCredit: 2528,
      netTax: 407               // 3200 - 2528 - 265 (living alone credit)
    }
  },
  {
    name: "Retiree, $30,000 pension income, age 70", 
    grossIncome: 30000,
    age: 70,
    isRetired: true,
    expected: {
      taxableIncome: 30000,
      taxBeforeCredits: 4200,   // 30000 * 0.14
      basicCredit: 2528,        // Basic credit  
      netTax: 510               // 4200 - 2528 - 475 (age 65+) - 265 (living alone) - pension credit
    }
  }
]

export async function runQuickQuebecTaxTest() {
  console.log('🧪 Quick Quebec Tax Test...\n')
  
  const calculator = new QcTaxCalculator(2024)
  await calculator.initialize()
  
  let passed = 0
  let failed = 0
  
  for (const scenario of testScenarios) {
    console.log(`📋 Test: ${scenario.name}`)
    
    try {
      const person = new Person({
        age: scenario.age,
        grossWorkIncome: scenario.isRetired ? 0 : scenario.grossIncome,
        grossRetirementIncome: scenario.isRetired ? scenario.grossIncome : 0,
        isRetired: scenario.isRetired
      })
      
      const household = new Household({
        householdType: HouseholdType.SINGLE,
        primaryPerson: {
          age: scenario.age,
          grossWorkIncome: scenario.isRetired ? 0 : scenario.grossIncome,
          grossRetirementIncome: scenario.isRetired ? scenario.grossIncome : 0,
          isRetired: scenario.isRetired
        },
        numChildren: 0
      })
      
      const contributions = scenario.contributions ? {
        rrq: new Decimal(scenario.contributions.rrq || 0),
        ei: new Decimal(scenario.contributions.ei || 0),
        rqap: new Decimal(scenario.contributions.rqap || 0)
      } : undefined
      
      const result = calculator.calculateHousehold(household, contributions)
      const primary = result.primary
      
      // Debug output first
      console.log(`   💡 Gross Income: $${primary.gross_income.toFixed(2)}`)
      console.log(`   💡 Taxable Income: $${primary.taxable_income.toFixed(2)} (expected $${scenario.expected.taxableIncome})`)
      console.log(`   💡 Tax Before Credits: $${primary.tax_before_credits.toFixed(2)} (expected $${scenario.expected.taxBeforeCredits})`)
      console.log(`   💡 Basic Credit: $${primary.credits.basic.toFixed(2)} (expected $${scenario.expected.basicCredit})`)
      console.log(`   💡 Age 65+ Credit: $${primary.credits.age_65.toFixed(2)}`)
      console.log(`   💡 Living Alone Credit: $${primary.credits.living_alone.toFixed(2)}`)
      console.log(`   💡 Total Credits: $${primary.credits.total.toFixed(2)}`)
      console.log(`   💡 Net Tax: $${primary.net_tax.toFixed(2)} (expected $${scenario.expected.netTax})`)
      
      // Validate results
      const taxableIncomeMatch = Math.abs(primary.taxable_income.toNumber() - scenario.expected.taxableIncome) < 10
      const netTaxMatch = Math.abs(primary.net_tax.toNumber() - scenario.expected.netTax) < 50
      
      if (taxableIncomeMatch && netTaxMatch) {
        console.log(`   ✅ PASSED`)
        passed++
      } else {
        console.log(`   ❌ FAILED - Net tax difference: $${Math.abs(primary.net_tax.toNumber() - scenario.expected.netTax).toFixed(2)}`)
        failed++
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      failed++
    }
    
    console.log('')
  }
  
  console.log('=== QUICK TEST RESULTS ===')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`)
  
  return { passed, failed }
}

// Run if called directly
if (require.main === module) {
  runQuickQuebecTaxTest().catch(console.error)
}