# Phone Number Validation System

## Overview

The phone number validation system ensures accurate and properly formatted phone numbers are saved in the Event Invitation Card Management System. It supports both Tanzanian and international phone numbers with real-time validation and formatting.

## Features

### ✅ Supported Formats

#### Tanzanian Numbers
- **Format**: `0XXX XXX XXX` or `XXX XXX XXX` (without +255)
- **Valid prefixes**: 6, 7, 8 (mobile numbers)
- **Examples**:
  - `0712345678` (recommended)
  - `712345678`
  - `0612345678`
  - `612345678`
  - `0812345678`
  - `812345678`

**Note**: Do NOT add the `+255` prefix when entering Tanzanian numbers, especially in Excel files, as Excel treats `+` as a mathematical operator and will try to sum the numbers.

#### International Numbers
- **Format**: `+[Country Code] [Number]`
- **Examples**:
  - `+1 555 123 4567` (US/Canada)
  - `+44 20 7946 0958` (UK)
  - `+254 712 345 678` (Kenya)
  - `+91 98765 43210` (India)

### 🔍 Validation Features

1. **Real-time validation** with visual feedback
2. **Provider detection** for Tanzanian numbers (Airtel, Tigo, Vodacom)
3. **Automatic formatting** on blur
4. **Duplicate prevention** within events (for guests) and globally (for customers)
5. **Normalization** to standard format for storage

## Backend Implementation

### PhoneNumberService (Laravel)

Located at: `kadirafiki-api/app/Services/PhoneNumberService.php`

#### Key Methods

```php
// Validate and normalize a phone number
PhoneNumberService::validateAndNormalize(string $phoneNumber): array

// Format phone number for display
PhoneNumberService::formatForDisplay(string $phoneNumber): string

// Get Laravel validation rules
PhoneNumberService::getValidationRules(): array
```

#### Usage in Controllers

```php
// In GuestController
$phoneValidation = PhoneNumberService::validateAndNormalize($validated['phone_number']);
if (!$phoneValidation['is_valid']) {
    return response()->json([
        'message' => 'Invalid phone number format',
        'errors' => ['phone_number' => [$phoneValidation['error']]]
    ], 422);
}

// Use normalized phone number
$validated['phone_number'] = $phoneValidation['normalized'];

// In CustomerController
$phoneValidation = PhoneNumberService::validateAndNormalize($validated['phone_number']);
if (!$phoneValidation['is_valid']) {
    return response()->json([
        'message' => 'Invalid phone number format',
        'errors' => ['phone_number' => [$phoneValidation['error']]]
    ], 422);
}

// Use normalized phone number
$validated['phone_number'] = $phoneValidation['normalized'];
```

## Frontend Implementation

### PhoneNumberValidator (TypeScript)

Located at: `kadirafiki-admin/src/utils/phoneValidation.ts`

#### Key Methods

```typescript
// Validate and normalize a phone number
PhoneNumberValidator.validateAndNormalize(phoneNumber: string): PhoneValidationResult

// Format phone number for display
PhoneNumberValidator.formatForDisplay(phoneNumber: string): string

// Get validation message
PhoneNumberValidator.getValidationMessage(phoneNumber: string): string
```

### PhoneInput Component

Located at: `kadirafiki-admin/src/components/form/input/PhoneInput.tsx`

#### Features
- Real-time validation with visual indicators
- Provider badges for Tanzanian numbers
- Automatic formatting on blur
- Error messages and help text
- Dark mode support

#### Usage

```tsx
import PhoneInput from '../components/form/input/PhoneInput';

<PhoneInput
  value={phoneNumber}
  onChange={setPhoneNumber}
  onValidationChange={(isValid, validation) => setPhoneValidation(validation)}
  placeholder="e.g., +255 123 456 789 or 0712345678"
  required
  label="Phone Number *"
/>
```

## Validation Rules

### Tanzanian Numbers
1. Must start with 6, 7, or 8 (mobile prefixes)
2. Must be exactly 9 digits (excluding country code)
3. Country code (+255) is automatically added if missing
4. Spaces and formatting are automatically handled

### International Numbers
1. Must start with `+`
2. Must have valid country code (1-3 digits)
3. Total length between 7-15 digits
4. Must be a recognized country code

### Provider Detection (Tanzania)
- **Airtel**: 61, 62, 63, 64, 65, 66, 67, 68, 69
- **Tigo**: 71, 72, 73, 74, 75, 76, 77, 78, 79
- **Vodacom**: 81, 82, 83, 84, 85, 86, 87, 88, 89

## Error Messages

### Common Validation Errors
- `"Phone number is required"` - Empty phone number
- `"Invalid Tanzanian mobile number format"` - Wrong format for Tanzania
- `"Invalid international phone number format"` - Wrong format for international
- `"Phone number already exists in this event"` - Duplicate within event (guests)
- `"Phone number already exists"` - Duplicate globally (customers)
- `"Duplicate phone number in uploaded data"` - Duplicate in Excel upload

## Integration Points

### 1. Add Guest Modal
- Uses `PhoneInput` component
- Validates before submission
- Shows provider information
- Checks for duplicates within event

### 2. Edit Guest Modal
- Pre-fills with existing phone number
- Validates changes before saving
- Excludes current guest from duplicate check

### 3. Excel Upload (Guests)
- Validates all phone numbers in uploaded file
- Shows validation results in preview modal
- Prevents upload if invalid numbers found
- Checks for duplicates within event and upload data

### 4. Guests Table
- Displays formatted phone numbers
- Uses `PhoneNumberValidator.formatForDisplay()`

### 5. Create Customer Modal
- Uses `PhoneInput` component
- Validates before submission
- Shows provider information
- Checks for global duplicates

### 6. Edit Customer Modal
- Pre-fills with existing phone number
- Validates changes before saving
- Excludes current customer from duplicate check

### 7. Customers Table
- Displays formatted phone numbers
- Uses `PhoneNumberValidator.formatForDisplay()`

## Testing

Run the test file to verify validation:
```bash
# In the frontend directory
node src/utils/phoneValidation.test.ts
```

## Best Practices

1. **Always validate on both frontend and backend**
2. **Use the PhoneInput component for consistent UX**
3. **Store normalized phone numbers in database**
4. **Display formatted numbers to users**
5. **Check for duplicates appropriately**:
   - Within events for guests
   - Globally for customers
6. **Provide clear error messages**

## Future Enhancements

1. **SMS verification** - Send verification codes
2. **WhatsApp Business API integration**
3. **More country codes** - Expand international support
4. **Number portability detection** - Handle number transfers
5. **Carrier lookup** - More detailed provider information

## Troubleshooting

### Common Issues

1. **Phone number not validating**
   - Check if format matches supported patterns
   - Ensure no special characters except +, spaces, and digits

2. **Provider not detected**
   - Verify the number starts with valid Tanzanian prefix
   - Check if the prefix is in the provider mapping

3. **International numbers not working**
   - Ensure country code is in the supported list
   - Check if number starts with `+`

4. **Formatting issues**
   - Numbers are normalized for storage
   - Display formatting is applied separately
   - Check both `normalized` and `formatForDisplay` methods

5. **Duplicate validation errors**
   - For guests: Check within the specific event
   - For customers: Check globally across all customers
   - Ensure proper exclusion of current record during updates 