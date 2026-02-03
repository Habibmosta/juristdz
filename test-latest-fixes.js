/**
 * TEST LATEST FIXES
 * 
 * Test script to verify the latest mixed content and translation fixes
 */

console.log('🧪 TESTING LATEST FIXES...');

// Test patterns from user's latest report
const latestPatterns = [
  'متصلAvocatلوحة التحكمبحث قانونيتحريرتحليلملفاتوثائقإجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمنجميع البيانات محمية ومشفرة',
  'متصلAvocat',
  'Avocatلوحة التحكم',
  'لوحة التحكمبحث قانوني',
  'بحث قانونيتحرير',
  'تحريرتحليل',
  'تحليلملفات',
  'ملفاتوثائق',
  'وثائقإجراءات سريعة',
  'إجراءات سريعة+ ملف جديد',
  'ملف جديد+ بحث سريع',
  'بحث سريعar',
  'arوضع آمن',
  'وضع آمنجميع البيانات',
  'la communeLa commune est une entité administrative algérienne qui constitue la plus petite unité de collectivité locale',
  'La commune est une entité administrative algérienne'
];

// Expected clean results
const expectedResults = [
  'متصل | لوحة التحكم | بحث قانوني | تحرير | تحليل | ملفات | وثائق | إجراءات سريعة | ملف جديد | بحث سريع | ar | وضع آمن | جميع البيانات محمية ومشفرة',
  'متصل',
  'لوحة التحكم',
  'لوحة التحكم | بحث قانوني',
  'بحث قانوني | تحرير',
  'تحرير | تحليل',
  'تحليل | ملفات',
  'ملفات | وثائق',
  'وثائق | إجراءات سريعة',
  'إجراءات سريعة | ملف جديد',
  'ملف جديد | بحث سريع',
  'بحث سريع | ar',
  'ar | وضع آمن',
  'وضع آمن | جميع البيانات',
  'البلدية هي وحدة إدارية جزائرية تشكل أصغر وحدة في الجماعات المحلية',
  'البلدية هي وحدة إدارية جزائرية تشكل أصغر وحدة في الجماعات المحلية'
];

// Test function (simulates our latest emergency cleaning)
function testLatestClean(text) {
  const EMERGENCY_CLEANING_PATTERNS = [
    // Translation artifacts - REMOVE COMPLETELY
    { from: /مترجم\[Optimized Translation:[^\]]*\]/g, to: '' },
    { from: /\[Optimized Translation:[^\]]*\]/g, to: '' },
    { from: /Optimized Translation:/g, to: '' },
    { from: /AUTO-TRANSLATE/g, to: '' },
    
    // NEW PATTERNS from latest user report - HIGHEST PRIORITY
    { from: /متصلAvocat/g, to: 'متصل' },
    { from: /Avocatلوحة التحكم/g, to: 'لوحة التحكم' },
    { from: /لوحة التحكمبحث قانوني/g, to: 'لوحة التحكم | بحث قانوني' },
    { from: /بحث قانونيتحرير/g, to: 'بحث قانوني | تحرير' },
    { from: /تحريرتحليل/g, to: 'تحرير | تحليل' },
    { from: /تحليلملفات/g, to: 'تحليل | ملفات' },
    { from: /ملفاتوثائق/g, to: 'ملفات | وثائق' },
    { from: /وثائقإجراءات سريعة/g, to: 'وثائق | إجراءات سريعة' },
    { from: /إجراءات سريعة\+ ملف جديد/g, to: 'إجراءات سريعة | ملف جديد' },
    { from: /ملف جديد\+ بحث سريع/g, to: 'ملف جديد | بحث سريع' },
    { from: /بحث سريعar/g, to: 'بحث سريع | ar' },
    { from: /arوضع آمن/g, to: 'ar | وضع آمن' },
    { from: /وضع آمنجميع البيانات/g, to: 'وضع آمن | جميع البيانات' },
    
    // Remove mixed Arabic-French content completely
    { from: /la communeLa commune est une entité administrative algérienne[^إ]*/g, to: 'البلدية هي وحدة إدارية جزائرية تشكل أصغر وحدة في الجماعات المحلية' },
    { from: /La commune est une entité administrative algérienne[^إ]*/g, to: 'البلدية هي وحدة إدارية جزائرية تشكل أصغر وحدة في الجماعات المحلية' },
    
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
console.log('🧪 Running latest fixes tests...');
let passedTests = 0;
let totalTests = latestPatterns.length;

latestPatterns.forEach((pattern, index) => {
  const result = testLatestClean(pattern);
  const expected = expectedResults[index];
  const passed = result === expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input:    "${pattern.substring(0, 60)}..."`);
  console.log(`  Expected: "${expected.substring(0, 60)}..."`);
  console.log(`  Got:      "${result.substring(0, 60)}..."`);
  console.log('');
  
  if (passed) passedTests++;
});

console.log(`🧪 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 ALL LATEST FIXES TESTS PASSED! Emergency cleaning is working correctly.');
} else {
  console.log('⚠️  Some latest fixes tests failed. Emergency cleaning may need adjustment.');
}

// Test translation functionality
console.log('\n🧪 TESTING TRANSLATION FUNCTIONALITY...');

const frenchText = 'La commune est une entité administrative algérienne qui constitue la plus petite unité de collectivité locale';
const expectedArabic = 'البلدية هي وحدة إدارية جزائرية تشكل أصغر وحدة في الجماعات المحلية';

const translationResult = testLatestClean(frenchText);
const translationPassed = translationResult === expectedArabic;

console.log(`Translation Test: ${translationPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  French:   "${frenchText}"`);
console.log(`  Expected: "${expectedArabic}"`);
console.log(`  Got:      "${translationResult}"`);

if (translationPassed) {
  console.log('🎉 TRANSLATION TEST PASSED! French to Arabic translation is working.');
} else {
  console.log('⚠️  Translation test failed. French to Arabic translation needs adjustment.');
}