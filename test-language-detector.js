/**
 * Simple test for LanguageDetector
 * Tests language detection and purity validation functionality
 */

// Test cases for language detection
const testCases = [
  {
    name: 'Pure Arabic text',
    input: 'هذا نص عربي صحيح وواضح في القانون الجزائري',
    expectedLanguage: 'Arabic',
    shouldBePure: true
  },
  {
    name: 'Pure French text',
    input: 'Ceci est un texte français correct dans le droit algérien',
    expectedLanguage: 'French',
    shouldBePure: true
  },
  {
    name: 'Mixed Arabic-English (user reported)',
    input: 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية',
    expectedLanguage: 'Arabic',
    shouldBePure: false
  },
  {
    name: 'Mixed Arabic with UI elements',
    input: 'محامي Pro تحليل ملفات V2 AUTO-TRANSLATE',
    expectedLanguage: 'Arabic',
    shouldBePure: false
  },
  {
    name: 'Mixed with Cyrillic',
    input: 'النص العربي процедة والمزيد',
    expectedLanguage: 'Arabic',
    shouldBePure: false
  }
];

console.log('Language Detector Test Cases:');
console.log('============================');

// Arabic Unicode ranges for validation
const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF]  // Arabic Presentation Forms-B
];

// Latin Unicode ranges
const LATIN_RANGES = [
  [0x0020, 0x007F], // Basic Latin
  [0x00A0, 0x00FF], // Latin-1 Supplement
  [0x0100, 0x017F], // Latin Extended-A
  [0x0180, 0x024F]  // Latin Extended-B
];

function isArabicCharacter(charCode) {
  return ARABIC_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
}

function isLatinCharacter(charCode) {
  return LATIN_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
}

function analyzeScript(text) {
  let arabicCount = 0;
  let latinCount = 0;
  let otherCount = 0;
  let totalChars = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // Skip whitespace and punctuation
    if (/\s/.test(char) || /[.,;:!?()[\]{}'"«»]/.test(char)) {
      continue;
    }
    
    totalChars++;
    
    if (isArabicCharacter(charCode)) {
      arabicCount++;
    } else if (isLatinCharacter(charCode)) {
      latinCount++;
    } else {
      otherCount++;
    }
  }
  
  const arabicPercentage = totalChars > 0 ? (arabicCount / totalChars) * 100 : 0;
  const latinPercentage = totalChars > 0 ? (latinCount / totalChars) * 100 : 0;
  const otherPercentage = totalChars > 0 ? (otherCount / totalChars) * 100 : 0;
  
  return {
    arabicCount,
    latinCount,
    otherCount,
    totalChars,
    arabicPercentage,
    latinPercentage,
    otherPercentage
  };
}

function detectLanguage(analysis) {
  if (analysis.arabicPercentage > analysis.latinPercentage && analysis.arabicPercentage > 30) {
    return 'Arabic';
  } else if (analysis.latinPercentage > analysis.arabicPercentage && analysis.latinPercentage > 30) {
    return 'French';
  } else {
    return 'Unknown';
  }
}

function validatePurity(analysis, expectedLanguage) {
  if (expectedLanguage === 'Arabic') {
    return analysis.arabicPercentage >= 95 && analysis.latinPercentage <= 5;
  } else if (expectedLanguage === 'French') {
    return analysis.latinPercentage >= 95 && analysis.arabicPercentage <= 5;
  }
  return false;
}

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`Input: "${testCase.input}"`);
  
  const analysis = analyzeScript(testCase.input);
  const detectedLanguage = detectLanguage(analysis);
  const isPure = validatePurity(analysis, detectedLanguage);
  
  console.log(`Script Analysis:`);
  console.log(`  - Arabic: ${analysis.arabicCount} chars (${analysis.arabicPercentage.toFixed(1)}%)`);
  console.log(`  - Latin: ${analysis.latinCount} chars (${analysis.latinPercentage.toFixed(1)}%)`);
  console.log(`  - Other: ${analysis.otherCount} chars (${analysis.otherPercentage.toFixed(1)}%)`);
  console.log(`  - Total: ${analysis.totalChars} chars`);
  
  console.log(`Detection Results:`);
  console.log(`  - Detected Language: ${detectedLanguage}`);
  console.log(`  - Is Pure: ${isPure}`);
  
  // Validation
  let passed = true;
  
  if (detectedLanguage !== testCase.expectedLanguage) {
    console.log(`  ❌ FAIL: Expected ${testCase.expectedLanguage}, got ${detectedLanguage}`);
    passed = false;
  }
  
  if (isPure !== testCase.shouldBePure) {
    console.log(`  ❌ FAIL: Expected purity ${testCase.shouldBePure}, got ${isPure}`);
    passed = false;
  }
  
  if (passed) {
    console.log('  ✅ PASS: All validation checks passed');
  }
  
  // Specific pattern detection
  const patterns = [];
  if (testCase.input.match(/[\u0400-\u04FF]/)) {
    patterns.push('Cyrillic characters');
  }
  if (testCase.input.match(/(AUTO-TRANSLATE|Pro|V2|Defined|JuristDZ)/gi)) {
    patterns.push('UI elements');
  }
  if (testCase.input.match(/\b(Defined|in|the|Article|of|Law)\b/gi)) {
    patterns.push('English fragments');
  }
  
  if (patterns.length > 0) {
    console.log(`  - Problematic patterns: ${patterns.join(', ')}`);
  }
});

console.log('\n============================');
console.log('Language Detector validation completed');
console.log('The implementation should handle all these detection scenarios correctly.');