# Data Validation Pipeline Documentation

This document describes the comprehensive data validation pipeline implemented for Stellar Bridge Watch to ensure data quality and consistency before storage and processing.

## Overview

The validation pipeline provides a robust, extensible framework for validating data integrity, enforcing business rules, and maintaining data quality across all system operations.

## Features

- **Schema Validation**: Type-safe validation using Zod schemas
- **Data Type Validation**: Automatic type checking and conversion
- **Range Validation**: Numeric and date range enforcement
- **Consistency Checks**: Cross-field and business rule validation
- **Duplicate Detection**: Identification of existing records
- **Data Normalization**: Automatic data cleaning and formatting
- **Batch Validation**: High-throughput bulk validation
- **Custom Validation Rules**: Extensible rule engine
- **Admin Bypass**: Emergency override capability
- **Validation Metrics**: Real-time quality monitoring
- **Comprehensive Reporting**: Detailed validation reports

## Architecture

### Core Components

1. **Validation Service** (`validation.service.ts`)
   - Central validation logic
   - Schema-based validation
   - Custom rule engine
   - Batch processing

2. **Validation Middleware** (`validation.ts`)
   - Request pre-validation
   - Automatic validation on API calls
   - Normalized data injection

3. **Admin API** (`validationAdmin.ts`)
   - Validation management
   - Metrics and reporting
   - Rule configuration
   - Batch testing

4. **Custom Rules Engine** (`CustomValidationRules`)
   - Business-specific rules
   - Consistency checks
   - Data quality rules

## Supported Data Types

### Asset Validation

Validates asset information including:
- **Symbol**: Uppercase alphanumeric (1-20 characters)
- **Name**: Asset display name (1-100 characters)
- **Issuer**: Stellar public key (56 characters, starts with G)
- **Asset Type**: native, credit_alphanum4, credit_alphanum12
- **Bridge Provider**: Optional bridge provider name
- **Source Chain**: Source blockchain network

**Consistency Rules**:
- Native assets cannot have an issuer
- Non-native assets must have an issuer
- Bridge provider requires source chain specification

### Bridge Validation

Validates bridge information including:
- **Name**: Bridge name (1-100 characters)
- **Source Chain**: Source blockchain name
- **Status**: healthy, degraded, down, unknown
- **Total Value Locked**: Non-negative decimal
- **Supply on Stellar**: Non-negative decimal
- **Supply on Source**: Non-negative decimal

**Consistency Rules**:
- Healthy bridges should have positive supply values
- TVL should be reasonable (< $1B)
- Supply values should be non-negative

### Price Record Validation

Validates price data including:
- **Timestamp**: Valid date/time
- **Symbol**: Asset symbol (1-20 characters)
- **Source**: Price source identifier
- **Price**: Positive decimal value
- **Volume 24h**: Non-negative decimal (optional)

**Consistency Rules**:
- Price must be positive (> 0)
- Warn about extreme prices (> $1M or < $0.000001)
- Warn about stale data (> 24 hours old)

### Health Score Validation

Validates health score data including:
- **Symbol**: Asset symbol (1-20 characters)
- **Overall Score**: 0-100 range
- **Component Scores**: 0-100 range each
  - Liquidity depth score
  - Price stability score
  - Bridge uptime score
  - Reserve backing score
  - Volume trend score

**Consistency Rules**:
- Overall score should be consistent with component averages
- All scores must be within 0-100 range

### Liquidity Snapshot Validation

Validates liquidity data including:
- **Symbol**: Asset symbol
- **DEX**: stellarx, phoenix, lumenswap, sdex, soroswap
- **Base/Quote Assets**: Trading pair assets
- **TVL USD**: Non-negative total value locked
- **Volume 24h USD**: Non-negative trading volume
- **Bid/Ask Depth**: Optional non-negative depths
- **Spread %**: Optional non-negative percentage

### Alert Rule Validation

Validates alert configuration including:
- **Owner Address**: Valid Stellar public key
- **Name**: Rule name (1-100 characters)
- **Asset Code**: Asset to monitor
- **Conditions**: JSON conditions object
- **Condition Op**: AND or OR
- **Priority**: low, medium, high, critical
- **Cooldown**: 0-86400 seconds
- **Webhook URL**: Optional valid HTTP/HTTPS URL

## Configuration

### Environment Variables

```bash
# Validation Mode
VALIDATION_STRICT_MODE=false              # Fail requests on validation errors
VALIDATION_ADMIN_BYPASS=true              # Allow admin to bypass validation

# Batch Processing
VALIDATION_BATCH_SIZE=100                 # Default batch size
VALIDATION_MAX_BATCH_SIZE=1000            # Maximum batch size

# Validation Features
VALIDATION_DUPLICATE_CHECK=true           # Enable duplicate detection
VALIDATION_NORMALIZATION=true             # Enable data normalization
VALIDATION_CONSISTENCY_CHECKS=true        # Enable consistency checks

# Thresholds
VALIDATION_ERROR_THRESHOLD=0.1            # 10% error rate threshold
VALIDATION_WARNING_THRESHOLD=0.3          # 30% warning threshold
VALIDATION_DATA_QUALITY_THRESHOLD=70      # 70% quality score threshold
```

### Validation Modes

#### Strict Mode
- All validation errors block request processing
- Warnings are logged but don't block
- Recommended for production

#### Non-Strict Mode
- Validation errors are logged but request continues
- Useful for development and debugging
- Allows partial data acceptance

## Validation Results

### Success Result
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "normalizedData": { /* cleaned data */ },
  "metadata": {
    "dataType": "asset",
    "validationTime": 15,
    "rulesApplied": ["schema_validation", "normalization", "consistency_checks"],
    "bypassUsed": false,
    "normalizedFields": ["symbol"],
    "duplicateCheck": true,
    "consistencyChecks": ["asset_consistency"]
  }
}
```

### Error Result
```json
{
  "isValid": false,
  "errors": [
    {
      "field": "symbol",
      "code": "SCHEMA_VALIDATION",
      "message": "Symbol must contain only uppercase letters and numbers",
      "value": "usdc-lowercase",
      "expected": "^[A-Z0-9]+$",
      "severity": "error"
    }
  ],
  "warnings": [],
  "metadata": {
    "dataType": "asset",
    "validationTime": 12,
    "rulesApplied": ["schema_validation"],
    "bypassUsed": false
  }
}
```

### Warning Result
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "field": "price",
      "code": "STALE_PRICE_DATA",
      "message": "Price data is 30 hours old",
      "value": "2023-12-30T00:00:00Z",
      "recommendation": "Update price data for better accuracy"
    }
  ],
  "normalizedData": { /* cleaned data */ },
  "metadata": { /* ... */ }
}
}
```

## Data Normalization

### Asset Normalization
- Symbol: Uppercase and trimmed
- Name: Trimmed whitespace
- Issuer: Trimmed and validated
- Provider/Chain: Trimmed

### Bridge Normalization
- Name: Trimmed
- Status: Lowercase
- Numeric values: Converted to strings

### Price Record Normalization
- Symbol: Uppercase and trimmed
- Source: Lowercase and trimmed
- Price/Volume: Converted to strings

### Health Score Normalization
- Symbol: Uppercase and trimmed
- Scores: Rounded to integers

## Custom Validation Rules

### Adding Custom Rules

```typescript
validationService.addCustomRule("asset", {
  name: "custom_asset_rule",
  description: "Custom validation for assets",
  validator: (data, context) => {
    const errors = [];
    // Custom validation logic
    if (data.symbol === "XLM" && data.bridge_provider) {
      errors.push({
        field: "bridge_provider",
        code: "XLM_CANNOT_HAVE_BRIDGE",
        message: "Native XLM cannot have a bridge provider",
        severity: "error"
      });
    }
    return errors;
  },
  severity: "error",
  enabled: true
});
```

### Rule Management

```typescript
// Enable/disable rules
validationService.toggleRule("asset", "custom_asset_rule", false);

// Remove custom rules
validationService.removeCustomRule("asset", "custom_asset_rule");
```

## Batch Validation

### Batch Processing

```typescript
const items = [
  { symbol: "USDC", name: "USD Coin", /* ... */ },
  { symbol: "EURC", name: "Euro Coin", /* ... */ },
  // ... more items
];

const context = {
  dataType: "asset",
  operation: "batch",
  isAdmin: false,
  batchSize: 100
};

const result = await validationService.validateBatch(items, "asset", context);
```

### Batch Result
```json
{
  "totalItems": 1000,
  "validItems": 950,
  "invalidItems": 50,
  "warnings": 30,
  "results": [ /* individual results */ ],
  "summary": {
    "processingTime": 1250,
    "averageValidationTime": 1.25,
    "mostCommonErrors": [
      { "code": "INVALID_SYMBOL", "count": 25 },
      { "code": "MISSING_ISSUER", "count": 20 }
    ],
    "dataQualityScore": 95,
    "recommendations": [
      "Review symbol format for 25 items",
      "Add missing issuer information"
    ]
  }
}
```

## Admin API Endpoints

### Authentication
All admin endpoints require an admin API key:
```http
X-API-Key: admin_1234567890abcdef
```

### Endpoints

#### Validate Single Item
```http
POST /api/v1/admin/validation/validate
Content-Type: application/json

{
  "data": {
    "symbol": "USDC",
    "name": "USD Coin",
    "asset_type": "credit_alphanum4",
    "is_active": true
  },
  "dataType": "asset",
  "operation": "create"
}
```

#### Validate Batch
```http
POST /api/v1/admin/validation/validate/batch
Content-Type: application/json

{
  "items": [
    { "symbol": "USDC", "name": "USD Coin", /* ... */ },
    { "symbol": "EURC", "name": "Euro Coin", /* ... */ }
  ],
  "dataType": "asset",
  "batchSize": 100
}
```

#### Get Validation Metrics
```http
GET /api/v1/admin/validation/metrics
```

#### Get Validation Configuration
```http
GET /api/v1/admin/validation/config
```

#### Reset Validation Metrics
```http
POST /api/v1/admin/validation/metrics/reset
```

#### Get Validation Report
```http
GET /api/v1/admin/validation/report?dataType=asset&timeRange=86400000
```

#### Export Validation Data
```http
GET /api/v1/admin/validation/export?format=json
```

#### Test Validation
```http
POST /api/v1/admin/validation/test
Content-Type: application/json

{
  "dataType": "asset",
  "sampleData": {
    "symbol": "TEST",
    "name": "Test Asset",
    "asset_type": "credit_alphanum4"
  }
}
```

## Integration Guide

### Using Validation Middleware

The validation middleware automatically validates requests:

```typescript
// POST /api/v1/assets - automatically validated
app.post('/api/v1/assets', async (req, res) => {
  // req.normalizedBody contains validated and normalized data
  const asset = req.normalizedBody;
  
  // req.validationResult contains validation details
  const validationResult = req.validationResult;
  
  // Save to database
  await saveAsset(asset);
  res.json({ success: true, data: asset });
});
```

### Manual Validation

```typescript
import { validationService } from './services/validation.service';

const result = await validationService.validate(
  assetData,
  'asset',
  {
    dataType: 'asset',
    operation: 'create',
    isAdmin: false
  }
);

if (!result.isValid) {
  console.error('Validation failed:', result.errors);
  return;
}

// Use normalized data
const cleanAsset = result.normalizedData;
```

### Custom Middleware

```typescript
import { createValidationMiddleware } from './api/middleware/validation';

// Create custom validation middleware
const assetValidation = createValidationMiddleware('asset', {
  skipMethods: ['GET', 'DELETE'],
  allowInvalid: false,
  useNormalizedData: true
});

app.post('/api/v1/assets', assetValidation, async (req, res) => {
  // Validation automatically performed
  const asset = req.normalizedBody;
  await saveAsset(asset);
  res.json({ success: true });
});
```

## Validation Metrics

### Available Metrics

- **totalValidations**: Total number of validations performed
- **validationErrors**: Total number of validation errors
- **validationWarnings**: Total number of validation warnings
- **averageValidationTime**: Average time per validation (ms)
- **dataQualityScore**: Overall data quality score (0-100)

### Monitoring

```typescript
// Get current metrics
const metrics = validationService.getMetrics();

// Reset metrics
validationService.resetMetrics();
```

### Prometheus Integration

```yaml
# metrics endpoint
GET /api/v1/admin/validation/metrics

# Example output
{
  "totalValidations": 10000,
  "validationErrors": 150,
  "validationWarnings": 450,
  "averageValidationTime": 2.5,
  "dataQualityScore": 94,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Data Quality Scoring

### Quality Score Calculation

```
Quality Score = (Valid Items / Total Items) * 100 - Warning Penalty

Warning Penalty = (Total Warnings / Total Items) * 10 (max 20 points)
```

### Quality Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | Excellent | Continue normal operations |
| 70-89 | Good | Monitor for trends |
| 50-69 | Fair | Investigate issues |
| 0-49 | Poor | Immediate attention required |

## Error Codes

### Schema Validation Errors
- `SCHEMA_VALIDATION`: General schema validation failure
- `REQUIRED_FIELD`: Missing required field
- `INVALID_TYPE`: Incorrect data type
- `INVALID_FORMAT`: Format validation failure

### Consistency Errors
- `NATIVE_ASSET_WITH_ISSUER`: Native asset has issuer
- `NON_NATIVE_WITHOUT_ISSUER`: Non-native asset missing issuer
- `BRIDGE_PROVIDER_WITHOUT_SOURCE_CHAIN`: Bridge provider without chain
- `HEALTHY_BRIDGE_ZERO_SUPPLY`: Healthy bridge with zero supply

### Range Errors
- `VALUE_TOO_HIGH`: Value exceeds maximum
- `VALUE_TOO_LOW`: Value below minimum
- `INVALID_RANGE`: Value outside acceptable range

### Warning Codes
- `TVL_EXCESSIVE`: TVL seems unusually high
- `STALE_PRICE_DATA`: Price data is old
- `EXTREME_PRICE`: Price value is extreme
- `SCORE_INCONSISTENCY`: Score values are inconsistent

## Best Practices

### For Developers

1. **Use Normalized Data**: Always use `normalizedData` from validation results
2. **Handle Errors Gracefully**: Check validation results before processing
3. **Monitor Warnings**: Address warnings to improve data quality
4. **Test Validation**: Use admin test endpoint to validate data
5. **Custom Rules**: Add business-specific rules as needed

### For Operations

1. **Monitor Metrics**: Track validation metrics for trends
2. **Set Thresholds**: Configure appropriate quality thresholds
3. **Regular Reports**: Review validation reports periodically
4. **Data Cleanup**: Address recurring validation issues
5. **Performance**: Monitor validation performance impact

### For Data Entry

1. **Follow Formats**: Adhere to expected data formats
2. **Use Uppercase**: Asset symbols should be uppercase
3. **Validate First**: Test data before bulk import
4. **Check Warnings**: Review and address warnings
5. **Consistency**: Maintain consistent data across records

## Troubleshooting

### Common Issues

1. **Validation Errors on Valid Data**
   - Check data type configuration
   - Verify schema version
   - Check for encoding issues

2. **Performance Issues**
   - Reduce batch size
   - Disable unnecessary rules
   - Check for rule complexity

3. **False Positives**
   - Review custom rules
   - Adjust thresholds
   - Update validation logic

4. **Missing Validation**
   - Verify middleware registration
   - Check route configuration
   - Ensure proper data type mapping

### Debug Commands

```bash
# Test validation
curl -X POST http://localhost:3001/api/v1/admin/validation/test \
  -H "X-API-Key: admin_123" \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "asset",
    "sampleData": { "symbol": "TEST", "name": "Test" }
  }'

# Get metrics
curl http://localhost:3001/api/v1/admin/validation/metrics \
  -H "X-API-Key: admin_123"

# Check configuration
curl http://localhost:3001/api/v1/admin/validation/config \
  -H "X-API-Key: admin_123"
```

## Security Considerations

### Admin Access
- Admin API key required for admin endpoints
- Bypass capability limited to admin users
- All bypasses are logged for audit

### Data Protection
- Validation does not expose sensitive data
- Error messages are safe for client consumption
- Logs do not include full validation payloads

### Rate Limiting
- Validation endpoints are rate-limited
- Batch validation has size limits
- Admin endpoints have stricter limits

## Future Enhancements

Planned improvements for the validation pipeline:

1. **Machine Learning**: Anomaly detection for data patterns
2. **Real-time Validation**: Stream processing for live data
3. **Custom Schema Builder**: UI for creating validation schemas
4. **Validation Chains**: Multi-stage validation pipelines
5. **Internationalization**: Multi-language validation messages
6. **Advanced Rules**: Regex and conditional rule support
7. **Data Profiling**: Automatic schema discovery
8. **Validation Caching**: Performance optimization

## Support

For validation issues:

1. Check validation test endpoint
2. Review validation metrics
3. Check configuration settings
4. Review validation logs
5. Test with sample data

For additional support:
- Create an issue with validation results
- Include sample data and expected behavior
- Provide validation configuration
- Share error messages and logs
