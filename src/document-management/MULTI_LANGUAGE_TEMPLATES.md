# Multi-Language Template Support

## Overview

The Document Management System now supports comprehensive multi-language template functionality with French and Arabic language support, including proper text direction, formatting rules, and localization features.

## Features Implemented

### 1. Language-Specific Formatting

#### French Formatting
- **Typography Rules**: Proper French punctuation spacing with non-breaking spaces before `!`, `?`, `:`, `;`
- **Quotation Marks**: French guillemets (`« »`) with proper spacing
- **Number Formatting**: French number format with space as thousand separator
- **Date Formatting**: French date format (e.g., "15 mars 2024")
- **Legal References**: Automatic formatting of legal articles and references

#### Arabic Formatting
- **Right-to-Left (RTL) Support**: Proper RTL text direction with Unicode markers
- **Arabic Numerals**: Conversion from Western (0-9) to Eastern Arabic numerals (٠-٩)
- **Date Formatting**: Arabic date format with Arabic month names
- **Typography Rules**: Proper Arabic punctuation and spacing
- **Mixed Content Handling**: Proper spacing between Arabic and Latin text
- **Legal References**: Arabic legal document formatting

### 2. Template Processing Enhancements

#### Multi-Language Processing Options
```typescript
interface TemplateProcessingOptions {
  language?: Language;
  useLanguageFormatting?: boolean;
  applyRTLSupport?: boolean;
  localizeNumbers?: boolean;
  localizeDates?: boolean;
}
```

#### Enhanced Template Metadata
```typescript
interface ProcessedDocument {
  content: string;
  metadata: {
    templateId: string;
    variables: TemplateVariables;
    processedAt: Date;
    language?: Language;
    direction?: 'ltr' | 'rtl';
    languageFormatting?: FormattedContent;
  };
}
```

### 3. Template Management Features

#### Language-Specific Operations
- **Create Language Template**: Enhanced template creation with language validation
- **Convert Template Language**: Convert templates between French and Arabic
- **Get Templates by Language**: Filter templates by language
- **Language Validation**: Validate template content for language requirements

#### Template Validation
- Content validation for language-specific requirements
- Variable label validation for Arabic templates
- Typography and formatting suggestions

### 4. Sample Templates

#### French Contract Template
- Complete service contract template in French
- Proper legal formatting and structure
- French variable labels and placeholders

#### Arabic Contract Template
- Complete service contract template in Arabic
- RTL text support and Arabic formatting
- Arabic variable labels and placeholders

#### French Legal Motion Template
- "Requête en Référé" template
- French legal document structure
- Court-specific formatting

#### Arabic Legal Motion Template
- "طلب استعجالي" template
- Arabic legal document structure
- Arabic court formatting

## Usage Examples

### 1. Processing French Template

```typescript
import { templateProcessingService } from './services/templateProcessingService';
import { Language } from '../types';

const variables = {
  clientName: 'Jean Dupont',
  totalAmount: 150000,
  contractDate: '2024-01-15'
};

const processed = await templateProcessingService.processTemplate(
  frenchTemplate,
  variables,
  {
    language: Language.FRENCH,
    useLanguageFormatting: true,
    localizeNumbers: true,
    localizeDates: true
  }
);

// Result includes proper French formatting
console.log(processed.metadata.direction); // 'ltr'
console.log(processed.metadata.language); // 'fr'
```

### 2. Processing Arabic Template

```typescript
const arabicVariables = {
  clientName: 'أحمد بن محمد',
  totalAmount: 150000,
  contractDate: '2024-01-15'
};

const processed = await templateProcessingService.processTemplate(
  arabicTemplate,
  arabicVariables,
  {
    language: Language.ARABIC,
    useLanguageFormatting: true,
    applyRTLSupport: true,
    localizeNumbers: true,
    localizeDates: true
  }
);

// Result includes RTL support and Arabic formatting
console.log(processed.metadata.direction); // 'rtl'
console.log(processed.content); // Contains Arabic numerals (٠-٩)
```

### 3. Creating Language-Specific Template

```typescript
import { templateManagementService } from './services/templateManagementService';

const templateDefinition = {
  name: 'عقد تقديم خدمات',
  description: 'نموذج عقد تقديم خدمات باللغة العربية',
  category: TemplateCategory.CONTRACT,
  language: Language.ARABIC,
  applicableRoles: [UserRole.AVOCAT],
  content: 'عقد تقديم خدمات\n\nبين {{clientName}} و {{providerName}}',
  variables: [
    {
      name: 'clientName',
      type: VariableType.TEXT,
      label: 'اسم العميل',
      required: true
    }
  ]
};

const result = await templateManagementService.createLanguageTemplate(
  templateDefinition,
  userId
);
```

### 4. Converting Template Language

```typescript
const result = await templateManagementService.convertTemplateLanguage(
  sourceTemplateId,
  Language.ARABIC,
  'عقد مترجم',
  userId,
  UserRole.AVOCAT
);

if (result.success && result.validationErrors) {
  console.log('Manual review required:', result.validationErrors);
}
```

## Language Formatting Service

### Core Features

#### Content Formatting
```typescript
import { languageFormattingService } from './utils/languageFormatting';

const options = {
  language: Language.ARABIC,
  preserveFormatting: true,
  useLocalizedNumbers: true,
  useLocalizedDates: true,
  applyTypographyRules: true
};

const result = languageFormattingService.formatContent(content, options);
```

#### Content Validation
```typescript
const validation = languageFormattingService.validateLanguageContent(
  content,
  Language.ARABIC
);

if (!validation.isValid) {
  console.log('Warnings:', validation.warnings);
  console.log('Suggestions:', validation.suggestions);
}
```

#### Language-Specific Placeholders
```typescript
const frenchPlaceholders = languageFormattingService.getLanguageSpecificPlaceholders(Language.FRENCH);
// { clientName: 'Nom du client', signature: 'Signature', ... }

const arabicPlaceholders = languageFormattingService.getLanguageSpecificPlaceholders(Language.ARABIC);
// { clientName: 'اسم العميل', signature: 'التوقيع', ... }
```

## Database Schema Updates

The existing template management schema supports multi-language templates:

```sql
-- Templates table already supports language field
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL CHECK (language IN ('fr', 'ar')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  -- ... other fields
);

-- Template categories with multi-language support
CREATE TABLE template_categories (
  id VARCHAR(50) PRIMARY KEY,
  name_fr VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description_fr TEXT,
  description_ar TEXT
);
```

## Testing

### Test Coverage

The implementation includes comprehensive tests covering:

1. **Language Formatting Tests**
   - French typography rules
   - Arabic RTL formatting
   - Number and date localization
   - Mixed content handling

2. **Template Processing Tests**
   - Multi-language template processing
   - Variable formatting by language
   - Output format generation

3. **Template Management Tests**
   - Language-specific template creation
   - Template conversion between languages
   - Language validation

4. **Integration Tests**
   - Complete workflow testing
   - Sample template validation
   - Cross-language consistency

### Running Tests

```bash
# Run multi-language template tests
node test-multi-language-templates.cjs

# Run full test suite (when Jest is properly configured)
npm test -- tests/document-management/multiLanguageTemplates.test.ts
```

## File Structure

```
src/document-management/
├── services/
│   ├── templateManagementService.ts     # Enhanced with multi-language support
│   └── templateProcessingService.ts     # Enhanced with language formatting
├── utils/
│   └── languageFormatting.ts           # New: Language formatting utilities
├── templates/
│   └── sampleTemplates.ts              # New: Sample French and Arabic templates
└── MULTI_LANGUAGE_TEMPLATES.md         # This documentation

tests/document-management/
└── multiLanguageTemplates.test.ts      # Comprehensive test suite
```

## Requirements Fulfilled

✅ **Requirement 3.5**: Multi-language template support
- ✅ French template handling with proper formatting
- ✅ Arabic template handling with RTL support
- ✅ Language-specific formatting rules
- ✅ Right-to-left text support for Arabic templates

## Future Enhancements

1. **Additional Languages**: Support for other languages (English, Berber)
2. **Advanced RTL**: Enhanced RTL support for complex layouts
3. **Translation Integration**: Automatic translation between languages
4. **Language Detection**: Automatic language detection for templates
5. **Localization**: Full UI localization for template management

## Best Practices

1. **Template Creation**
   - Always specify the correct language for templates
   - Use language-appropriate variable labels
   - Follow language-specific formatting conventions

2. **Content Validation**
   - Validate template content for language requirements
   - Check for proper text direction in Arabic templates
   - Ensure consistent variable naming across language versions

3. **Processing Options**
   - Enable language formatting for proper output
   - Use RTL support for Arabic templates
   - Apply localization for numbers and dates

4. **Testing**
   - Test templates in both languages
   - Verify proper formatting and direction
   - Validate variable substitution works correctly