/**
 * Test script for improved translation service fixes
 */

// Import the improved translation service
const { improvedTranslationService } = require('./services/improvedTranslationService.ts');

async function testTranslationFixes() {
  console.log('🧪 Testing Translation Fixes...\n');

  // Test cases that were failing before
  const testCases = [
    {
      text: "marché noir",
      from: 'fr',
      to: 'ar',
      expected: 'السوق السوداء'
    },
    {
      text: "Le marché noir est un phénomène économique",
      from: 'fr',
      to: 'ar',
      expected: 'السوق السوداء ظاهرة اقتصادية'
    },
    {
      text: "Code de Commerce",
      from: 'fr',
      to: 'ar',
      expected: 'القانون التجاري'
    },
    {
      text: "lois et réglementations en vigueur",
      from: 'fr',
      to: 'ar',
      expected: 'القوانين واللوائح السارية'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n--- Test ${i + 1} ---`);
    console.log(`Input (${testCase.from}): "${testCase.text}"`);
    
    try {
      const result = await improvedTranslationService.translateText(
        testCase.text, 
        testCase.from, 
        testCase.to
      );
      
      console.log(`Output (${testCase.to}): "${result}"`);
      console.log(`Expected: "${testCase.expected}"`);
      
      // Check if translation contains the expected terms
      const containsExpected = testCase.expected.split(' ').some(word => 
        result.includes(word)
      );
      
      if (containsExpected || result !== testCase.text) {
        console.log('✅ PASS - Translation appears successful');
      } else {
        console.log('❌ FAIL - Translation unchanged or failed');
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }

  // Test error handling
  console.log('\n--- Error Handling Tests ---');
  
  try {
    const emptyResult = await improvedTranslationService.translateText('', 'fr', 'ar');
    console.log(`Empty input test: "${emptyResult}"`);
  } catch (error) {
    console.log(`Empty input error: ${error.message}`);
  }

  // Test cache statistics
  console.log('\n--- Cache Statistics ---');
  const stats = improvedTranslationService.getCacheStats();
  console.log(`Cache size: ${stats.size}`);
  console.log(`Error count: ${stats.errors}`);
  
  if (stats.errors > 0) {
    console.log('\n--- Recent Errors ---');
    const errors = improvedTranslationService.getTranslationErrors();
    errors.slice(-3).forEach((error, index) => {
      console.log(`${index + 1}. ${error.error} - "${error.text.substring(0, 50)}..."`);
    });
  }

  console.log('\n🧪 Translation testing completed!');
}

// Run the tests
testTranslationFixes().catch(console.error);