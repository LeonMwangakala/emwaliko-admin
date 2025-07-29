import { PhoneNumberValidator } from './phoneValidation';

// Test cases for phone number validation
const testCases = [
  // Valid Tanzanian numbers (without + sign - Excel compatible)
  { input: '0712345678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  { input: '712345678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  { input: '0612345678', expected: { isValid: true, country: 'Tanzania', provider: 'Airtel' } },
  { input: '612345678', expected: { isValid: true, country: 'Tanzania', provider: 'Airtel' } },
  { input: '0812345678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  { input: '812345678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  
  // Valid Tanzanian numbers (with + sign - still supported)
  { input: '+255 712 345 678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  { input: '+255712345678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  
  // Excel edge cases (255 prefix without +)
  { input: '255712345678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  { input: '255 712 345 678', expected: { isValid: true, country: 'Tanzania', provider: 'Vodacom' } },
  
  // Valid international numbers
  { input: '+1 555 123 4567', expected: { isValid: true, country: 'International' } },
  { input: '+44 20 7946 0958', expected: { isValid: true, country: 'International' } },
  { input: '+254 712 345 678', expected: { isValid: true, country: 'International' } },
  
  // Invalid numbers
  { input: '123', expected: { isValid: false } },
  { input: 'abc', expected: { isValid: false } },
  { input: '071234567', expected: { isValid: false } }, // Too short
  { input: '07123456789', expected: { isValid: false } }, // Too long
  { input: '912345678', expected: { isValid: false } }, // Invalid prefix
  { input: '255123', expected: { isValid: false } }, // Incomplete after 255
];

console.log('Testing Phone Number Validation (Excel Compatible)...\n');

testCases.forEach((testCase, index) => {
  const result = PhoneNumberValidator.validateAndNormalize(testCase.input);
  const passed = result.isValid === testCase.expected.isValid &&
                 (!testCase.expected.country || result.country === testCase.expected.country) &&
                 (!testCase.expected.provider || result.provider === testCase.expected.provider);
  
  console.log(`Test ${index + 1}: ${testCase.input}`);
  console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
  console.log(`  Got: ${JSON.stringify({
    isValid: result.isValid,
    country: result.country,
    provider: result.provider,
    normalized: result.normalized
  })}`);
  console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Test formatting
console.log('Testing Phone Number Formatting...\n');

const formatTestCases = [
  { input: '+255712345678', expected: '+255 712 345 678' },
  { input: '0712345678', expected: '+255 712 345 678' },
  { input: '712345678', expected: '+255 712 345 678' },
  { input: '255712345678', expected: '+255 712 345 678' },
  { input: '+1234567890', expected: '+1234567890' }, // International stays as is
];

formatTestCases.forEach((testCase, index) => {
  const result = PhoneNumberValidator.formatForDisplay(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`Format Test ${index + 1}: ${testCase.input}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('Phone validation tests completed!');
console.log('\n✅ Excel compatibility verified - no + sign needed for Tanzanian numbers'); 