# Survey Scripts

This directory contains utility scripts for managing the Alhovuori community survey.

## Export Results

Export survey results with filtering by email (keeps only newest response per email) and includes UI text labels for better LLM analysis.

### Usage

Using justfile (recommended):
```bash
# Export to default filename (survey-results.json)
just export-results

# Export to custom filename
just export-results output=my-results.json
```

Using bun directly:
```bash
# Export to default filename
bun run scripts/export-results.ts

# Export to custom filename
bun run scripts/export-results.ts --output my-results.json
```

Using npm script:
```bash
cd scripts
bun run export
```

### Output Format

The exported JSON file includes:

```json
{
  "metadata": {
    "exported_at": "2025-11-20T18:28:09.882Z",
    "total_responses": 12,
    "unique_emails": 11,
    "survey_title": "Alhovuori Yhteisöhanke - Kartoituskysely"
  },
  "responses": [
    {
      "id": 123,
      "created_at": "2025-11-20T10:00:00Z",
      "data": {
        "name": {
          "value": "John Doe",
          "label": "Nimi",
          "displayValue": "John Doe"
        },
        "involvement_level": {
          "value": "committed",
          "label": "Minkä tason sitoutumisella olet mukana tässä vaiheessa?",
          "displayValue": "✅ Vahvasti sitoutunut - haluan varmasti mukaan"
        },
        "activity_preferences": {
          "value": ["borderland", "camping"],
          "label": "Minkätyyppistä toimintaa toivoisit Alhovuorelle?",
          "displayValue": [
            "🔥 Borderland-tyylinen yhteiskäyttö burnereiden ja muiden vapaamielisten ihmisten yhteisönä",
            "🏕️ Kesäajan camping-palvelut"
          ]
        }
      }
    }
  ]
}
```

### Features

- **Deduplication**: Keeps only the newest response for each unique email address
- **UI Text Labels**: Includes human-readable labels and display values for all choices
- **LLM-Ready**: Structured format optimized for analysis by language models
- **Metadata**: Includes export timestamp and summary statistics

## Database Management

### Setup Database
```bash
just setup-db
# or
bun run scripts/setup-db.ts
```

### Check Database Status
```bash
just check-db
# or
bun run scripts/setup-db.ts --check
```

### Reset Database (Clear All Data)
```bash
just reset-db
# or
bun run scripts/setup-db.ts --reset
```

## Environment Variables

These scripts require the following environment variables in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_API_KEY=your-api-key
```
