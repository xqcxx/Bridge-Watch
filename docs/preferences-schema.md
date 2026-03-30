# User Preferences Schema

This document defines the storage model and API payload structure for user preferences.

## Goals

- Key-value preference storage grouped by category.
- Defaults + user overrides with inheritance.
- Versioned user preference state.
- Import/export compatibility with schema migrations.
- Fast read path via Redis cache.

## Database Tables

### preference_defaults

Default values for each preference key and schema version.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| category | string | notifications, display, alerts |
| pref_key | string | Preference key within category |
| value | jsonb | Default value |
| schema_version | int | Preference schema version |
| created_at | timestamp | Auto timestamp |
| updated_at | timestamp | Auto timestamp |

Constraints:
- Unique: `(category, pref_key, schema_version)`

### user_preference_state

Version tracking per user.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | string | Primary key |
| version | int | Incremented on every write/import/reset |
| schema_version | int | Current preference schema version for user |
| created_at | timestamp | Auto timestamp |
| updated_at | timestamp | Auto timestamp |

### user_preferences

User-specific overrides (diff against defaults).

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | string | FK -> user_preference_state.user_id |
| category | string | notifications, display, alerts |
| pref_key | string | Key within category |
| value | jsonb | Override value |
| created_at | timestamp | Auto timestamp |
| updated_at | timestamp | Auto timestamp |

Constraints:
- Unique: `(user_id, category, pref_key)`

### preference_migration_history

Audit log for preference payload migrations.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | string nullable | User associated with import/migration |
| from_schema_version | int | Source version |
| to_schema_version | int | Target version |
| migration_name | string | Logical migration id |
| metadata | jsonb nullable | Optional context |
| created_at | timestamp | Auto timestamp |

## Categories and Keys (schema v2)

### notifications

- `emailEnabled`: boolean
- `pushEnabled`: boolean
- `digestFrequency`: enum(`never`, `daily`, `weekly`)

### display

- `theme`: enum(`light`, `dark`, `system`)
- `compactMode`: boolean
- `timezone`: string
- `currency`: ISO-4217 uppercase code

### alerts

- `defaultSeverity`: enum(`low`, `medium`, `high`, `critical`)
- `channels`: array enum(`in_app`, `email`, `webhook`)
- `mutedAssets`: array of asset codes

## Effective Preference Resolution

Read resolution order:
1. Defaults from `preference_defaults` for current schema version.
2. User overrides from `user_preferences`.
3. Result is cached in Redis (`preferences:{userId}`) for low-latency reads.

## API Shape

`GET /api/v1/preferences/:userId` returns:

```json
{
  "preferences": {
    "userId": "user_123",
    "version": 4,
    "schemaVersion": 2,
    "lastUpdatedAt": "2026-03-28T12:00:00.000Z",
    "categories": {
      "notifications": {
        "emailEnabled": true,
        "pushEnabled": false,
        "digestFrequency": "daily"
      },
      "display": {
        "theme": "dark",
        "compactMode": true,
        "timezone": "UTC",
        "currency": "USD"
      },
      "alerts": {
        "defaultSeverity": "high",
        "channels": ["in_app", "email"],
        "mutedAssets": ["USDC"]
      }
    }
  }
}
```

## Import/Export Compatibility

- Exports include `schemaVersion` and `version` metadata.
- Imports accept older schema payloads and are migrated to current schema version.
- Migration operations are recorded in `preference_migration_history`.
