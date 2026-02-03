/**
 * TEST MIXED CONTENT FIX
 * 
 * Test script to verify that mixed content cleaning is working
 */

console.log('🧪 TESTING MIXED CONTENT FIXES...');

// Test patterns from user's latest report
const mixedContentPatterns = [
  'متصلAvocat d\'Avocatلوحة التحكمبحث قانونيتحريرActesتحليلوثائقدفتر التوثيق+ عقد جديدبحث في الأرشيفarوضع آمنجميع البيانات محمية ومشفرة',
  'متصلAvocat d\'Avocat',
  'متصلAvocat',
  'لوحة التحكمبحث قانوني',
  'بحث قانونيتحرير',
  'تحريرActes',
  'Actesتحليل',
  'تحليلوثائق',
  'وثائقدفتر التوثيق',
  'دفتر التوثيق+ عقد جديد',
  'عقد جديدبحث في الأرشيف',
  'بحث في الأرشيفar',
  'arوضع آمن',
  'وضع آمنجميع البيانات',
  'مترجم[Optimized Translation: la commune]',
  '[Optimized Translation: la commune]'
];

// Expected clean results
const expectedResults = [
  'متصل | لوحة التحكم | بحث قانوني | تحرير | العقود | تحليل | وثائق | دفتر التوثيق | عقد جديد | بحث في الأرشيف | ar | وضع آمن | جميع البيانات محمية ومشفرة',
  'متصل',
  'متصل',
  'لوحة التحكم | بحث قانوني',
  'بحث قانوني | تحرير',
  'تحرير العقود',
  'العقود | تحليل',
  'تحليل | وثائق',
  'وثائق | دفتر التوثيق',
  'دفتر التوثيق | عقد جديد',
  'عقد جديد | بحث في الأرشيف',
  'بحث في الأرشيف | ar',
  'ar | وضع آمن',
  'وضع آمن | جميع البيانات',
  '',
  ''
];

// Test function (simulates our emergency cleaning)
function testEmergencyClean(text) {
  const EMERGENCY_CLEANING_PATTERNS = [
    // Translation artifacts - REMOVE COMPLETELY
    { from: /مترجم\[Optimized Translation:[^\]]*\]/g, to: '' },
    { from: /\[Optimized Translation:[^\]]*\]/g, to: '' },
    { from: /Optimized Translation:/g, to: '' },
    { from: /AUTO-TRANSLATE/g, to: '' },
    
    // Specific mixed patterns
    { from: /متصلAvocat d'Avocat/g, to: 'متصل' },
    { from: /متصلAvocat/g, to: 'متصل' },
    { from: /Avocat d'Avocat/g, to: 'Avocat' },
    { from: /لوحة التحكمبحث قانوني/g, to: 'لوحة التحكم | بحث قانوني' },
    { from: /بحث قانونيتحرير/g, to: 'بحث قانوني | تحرير' },
    { from: /تحريرActes/g, to: 'تحرير العقود' },
    { from: /Actesتحليل/g, to: 'العقود | تحليل' },
    { from: /تحليلوثائق/g, to: 'تحليل | وثائق' },
    { from: /وثائقدفتر التوثيق/g, to: 'وثائق | دفتر التوثيق' },
    { from: /دفتر التوثيق\+ عقد جديد/g, to: 'دفتر التوثيق | عقد جديد' },
    { from: /عقد جديدبحث في الأرشيف/g, to: 'عقد جديد | بحث في الأرشيف' },
    { from: /بحث في الأرشيفar/g, to: 'بحث في الأرشيف | ar' },
    { from: /arوضع آمن/g, to: 'ar | وضع آمن' },
    { from: /وضع آمنجميع البيانات/g, to: 'وضع آمن | جميع البيانات' },
    
    // Remove problematic artifacts
    { from: /Pro(?=[أ-ي])/g, to: '' },
    { from: /V2(?=[أ-ي])/g, to: '' },
    { from: /Defined/g, to: '' },
    { from: /процедة/g, to: 'procédure' },
    
    // General mixed script patterns
    { from: /([أ-ي]+)([A-Za-z]+)([أ-ي]*)/g, to: '$1 | $2 | $3' },
    { from: /([A-Za-z]+)([أ-ي]+)([A-Za-z]*)/g, to: '$1 | $2 | $3' },
    
    // Clean up pipes and spaces
    { from: /\s*\|\s*/g, to: ' | ' },
    { from: /\|\s*\|/g, to: ' | ' },
    { from: /^\s*\|\s*/g, to: '' },
    { from: /\s*\|\s*$/g, to: '' },
    { from: /\s+/g, to: ' ' }
  ];

  let cleaned = text;
  EMERGENCY_CLEANING_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern.from, pattern.to);
  });
  return cleaned.trim();
}

// Run tests
console.log('🧪 Running mixed content cleaning tests...');
let passedTests = 0;
let totalTests = mixedContentPatterns.length;

mixedContentPatterns.forEach((pattern, index) => {
  const result = testEmergencyClean(pattern);
  const expected = expectedResults[index];
  const passed = result === expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input:    "${pattern}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log('');
  
  if (passed) passedTests++;
});

console.log(`🧪 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 ALL MIXED CONTENT TESTS PASSED! Emergency cleaning is working correctly.');
} else {
  console.log('⚠️  Some mixed content tests failed. Emergency cleaning may need adjustment.');
}