/**
 * Test script for improved translation system
 * Tests the fixes for translation quality issues
 */

const testTranslation = async () => {
  console.log('🧪 Testing Improved Translation System...\n');

  // Test cases that were problematic before
  const testCases = [
    {
      name: 'Witnesses Legal Text (French to Arabic)',
      text: 'Les témoins sont les personnes qui participent à des événements juridiques ou des événements importants et peuvent témoigner de ce qui s\'est passé',
      from: 'fr',
      to: 'ar',
      expectedQuality: 'excellent'
    },
    {
      name: 'Cafala Legal Concept (French to Arabic)',
      text: 'La cafala est un concept juridique algérien qui fait référence à la tutelle ou la curatelle d\'un mineur ou d\'un majeur incapable',
      from: 'fr',
      to: 'ar',
      expectedQuality: 'excellent'
    },
    {
      name: 'Legal Procedure (French to Arabic)',
      text: 'La procédure pour instituer la cafala est la suivante : la demande est faite auprès du tribunal de première instance',
      from: 'fr',
      to: 'ar',
      expectedQuality: 'good'
    },
    {
      name: 'Mixed Content Test (should be cleaned)',
      text: 'La cafala est définie à l\'مادة 1er du قانون de la Famille comme "la tutelle"',
      from: 'fr',
      to: 'ar',
      expectedQuality: 'fair'
    }
  ];

  const baseURL = 'http://localhost:3000';
  
  // Simple auth token for testing
  const authToken = 'test-token';

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.text.substring(0, 80)}..."`);
    console.log(`   From: ${testCase.from} → To: ${testCase.to}`);

    try {
      const response = await fetch(`${baseURL}/api/improved-translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          text: testCase.text,
          from: testCase.from,
          to: testCase.to
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`   ✅ Success!`);
        console.log(`   Output: "${result.translatedText.substring(0, 80)}..."`);
        console.log(`   Quality: ${result.quality || 'unknown'} (expected: ${testCase.expectedQuality})`);
        console.log(`   Confidence: ${result.confidence || 'unknown'}`);
        
        // Check for common issues
        const issues = [];
        
        // Check for language mixing
        if (testCase.to === 'ar') {
          const frenchWords = /\b(le|la|les|de|du|des|et|ou|pour|avec|dans|sur|par|est|sont)\b/gi;
          if (frenchWords.test(result.translatedText)) {
            issues.push('Contains French words in Arabic translation');
          }
        }
        
        // Check for corrupted characters
        const corruptedChars = /[а-яё]/gi;
        if (corruptedChars.test(result.translatedText)) {
          issues.push('Contains corrupted Cyrillic characters');
        }
        
        // Check for encoding issues
        const encodingIssues = /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F\u2010-\u2027\u2030-\u205E\s]/;
        if (encodingIssues.test(result.translatedText)) {
          issues.push('Contains encoding issues');
        }
        
        if (issues.length > 0) {
          console.log(`   ⚠️  Issues found: ${issues.join(', ')}`);
        } else {
          console.log(`   ✨ No quality issues detected!`);
        }
        
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        console.log(`   Fallback: "${result.translatedText?.substring(0, 80)}..."`);
      }

    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }

  // Test validation endpoint
  console.log(`\n🔍 Testing Translation Validation...`);
  
  try {
    const validationResponse = await fetch(`${baseURL}/api/improved-translation/validate-translation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        originalText: 'Les témoins sont importants',
        translatedText: 'الشهود مهمون',
        fromLang: 'fr',
        toLang: 'ar'
      })
    });

    const validationResult = await validationResponse.json();
    
    if (validationResult.success) {
      console.log(`   ✅ Validation successful`);
      console.log(`   Valid: ${validationResult.isValid}`);
      console.log(`   Issues: ${validationResult.issues?.length || 0}`);
      console.log(`   Suggestions: ${validationResult.suggestions?.length || 0}`);
    } else {
      console.log(`   ❌ Validation failed: ${validationResult.error}`);
    }

  } catch (error) {
    console.log(`   💥 Validation error: ${error.message}`);
  }

  console.log(`\n🎯 Translation Quality Test Complete!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Tested ${testCases.length} translation scenarios`);
  console.log(`   - Checked for language mixing, corrupted characters, and encoding issues`);
  console.log(`   - Validated translation quality assessment`);
  console.log(`\n💡 Expected improvements:`);
  console.log(`   ✅ No more mixed French-Arabic text`);
  console.log(`   ✅ No corrupted Cyrillic characters`);
  console.log(`   ✅ Proper encoding handling`);
  console.log(`   ✅ Quality indicators for translations`);
  console.log(`   ✅ Error handling with fallback to original text`);
};

// Run the test
testTranslation().catch(console.error);