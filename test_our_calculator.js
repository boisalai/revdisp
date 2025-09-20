/**
 * Test de notre calculateur QC vs calcul manuel
 * Pour identifier les différences
 */

// Import nécessaire pour tester notre calculateur
import { CompactCalculatorState } from './src/types/calculator.js';
import { MainCalculator } from './src/lib/calculators/MainCalculator.js';
import { HouseholdType } from './src/lib/models/index.js';

async function testOurCalculator() {
  console.log('🧪 TEST DE NOTRE CALCULATEUR QUÉBEC');
  console.log('===================================');

  const state = {
    householdType: HouseholdType.SINGLE,
    primaryPerson: {
      age: 35,
      grossWorkIncome: 45000,
      grossRetirementIncome: 0,
      isRetired: false
    },
    spouse: null,
    numChildren: 0,
    selectedYear: 2024
  };

  try {
    const calculator = new MainCalculator();
    const result = await calculator.calculateAll(state);

    console.log('\n📊 RÉSULTATS DE NOTRE CALCULATEUR:');
    console.log('==================================');

    // Affichage des résultats QC
    if (result.quebec_tax) {
      console.log(`Impôt QC net: ${result.quebec_tax.toFixed(2)}$`);
    }

    if (result.qc_regime_fiscal) {
      console.log(`Régime fiscal QC: ${result.qc_regime_fiscal.toFixed(2)}$`);
    }

    // Affichage des cotisations
    if (result.rrq_contribution) {
      console.log(`RRQ: ${result.rrq_contribution.toFixed(2)}$`);
    }
    if (result.ei_contribution) {
      console.log(`AE: ${result.ei_contribution.toFixed(2)}$`);
    }
    if (result.rqap_contribution) {
      console.log(`RQAP: ${result.rqap_contribution.toFixed(2)}$`);
    }

    console.log('\n📋 TOUS LES RÉSULTATS:');
    console.log(Object.keys(result).map(key =>
      `${key}: ${result[key]?.toFixed ? result[key].toFixed(2) : result[key]}`
    ).join('\n'));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

testOurCalculator();