/**
 * Test du scénario 2000$/an en 2025
 */

import Decimal from 'decimal.js';
import { SocialAssistanceCalculator } from './src/lib/calculators/SocialAssistanceCalculator';

async function test2025Scenario() {
  console.log('🧪 Test scénario 2025 - Personne seule, 2000$/an\n');
  
  const calculator = new SocialAssistanceCalculator(2025);
  await calculator.initialize();
  
  // Test avec le scénario demandé: 2000$/an
  const testInput = {
    year: 2025 as const,
    household_type: 'single' as const,
    living_with_parents: false,
    work_income: 2000, // 2000$/an
    partner_work_income: 0,
    employment_constraint: 'none' as const,
    partner_employment_constraint: 'none' as const,
    first_time_applicant: false,
    liquid_assets: 0,
    children_count: 0
  };
  
  const result = calculator.calculateSocialAssistance(testInput);
  
  console.log('📊 Résultats du calcul (ANNUEL):');
  console.log(`✅ Programme applicable: ${result.program}`);
  console.log(`✅ Prestation de base: ${result.base_benefit}$ (annuel)`);
  console.log(`✅ Ajustement: ${(result as any).adjustment_benefit || 0}$ (annuel)`);
  console.log(`✅ Prestation totale: ${result.gross_benefit}$ (annuel)`);
  console.log(`✅ Revenus de travail: ${result.total_work_income}$ (annuel)`);
  console.log(`✅ Revenus exclus: ${result.work_income_exemption}$ (annuel)`);
  console.log(`✅ Réduction: ${result.income_reduction}$ (annuel)`);
  console.log(`✅ Supplément 25%: ${result.work_income_supplement}$ (annuel)`);
  console.log(`✅ Prestation nette: ${result.net_benefit}$ (annuel)`);
  
  console.log('\n📊 Détails mensuels:');
  const monthlyBase = result.base_benefit / 12;
  const monthlyAdjustment = ((result as any).adjustment_benefit || 0) / 12;
  const monthlyGross = result.gross_benefit / 12;
  const monthlyWorkIncome = result.total_work_income / 12;
  const monthlyExemption = result.work_income_exemption / 12;
  const monthlyReduction = result.income_reduction / 12;
  const monthlySupplement = result.work_income_supplement / 12;
  const monthlyNet = result.net_benefit / 12;
  
  console.log(`🔸 Prestation de base: ${monthlyBase.toFixed(2)}$/mois (784$ attendu)`);
  console.log(`🔸 Ajustement: ${monthlyAdjustment.toFixed(2)}$/mois (45$ attendu)`);
  console.log(`🔸 Prestation totale: ${monthlyGross.toFixed(2)}$/mois (829$ attendu)`);
  console.log(`🔸 Revenus de travail: ${monthlyWorkIncome.toFixed(2)}$/mois (166,67$ attendu)`);
  console.log(`🔸 Revenus exclus: ${monthlyExemption.toFixed(2)}$/mois (200$ attendu)`);
  console.log(`🔸 Réduction: ${monthlyReduction.toFixed(2)}$/mois (0$ attendu car revenus < exemption)`);
  console.log(`🔸 Supplément 25%: ${monthlySupplement.toFixed(2)}$/mois`);
  console.log(`🔸 Prestation nette: ${monthlyNet.toFixed(2)}$/mois (829$ attendu)`);
  console.log(`🔸 Prestation annuelle: ${result.net_benefit}$ (9948$ attendu)`);
  
  // Comparaison avec les attentes
  const expectedMonthlyNet = 829; // 784 + 45 = 829$ car revenus < exemption
  const expectedAnnualNet = expectedMonthlyNet * 12; // 9948$
  
  console.log('\n🎯 Validation:');
  console.log(`${Math.abs(monthlyNet - expectedMonthlyNet) < 1 ? '✅' : '❌'} Prestation mensuelle: ${monthlyNet.toFixed(2)}$ (attendu: ${expectedMonthlyNet}$)`);
  console.log(`${Math.abs(result.net_benefit - expectedAnnualNet) < 12 ? '✅' : '❌'} Prestation annuelle: ${result.net_benefit}$ (attendu: ${expectedAnnualNet}$)`);
  
  return result;
}

test2025Scenario().catch(console.error);