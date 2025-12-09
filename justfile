# Alhovuori Community Survey - Task Runner
# Usage: just <command>

# Default recipe (show help)
default:
    @just --list

# Export survey results (filtered by email, newest only)
export-results output="survey-results.json":
    @echo "Exporting survey results..."
    bun run scripts/export-results.ts --output {{output}}

# Generate investment reports (both private and public versions)
generate-report:
    @echo "Fetching latest survey results..."
    @bun run scripts/export-results.ts --output results/survey-results.json
    @echo "Generating investment reports..."
    cd results && bun run generate-reports.ts
    @echo "✅ Reports generated successfully!"
    @echo "   Private: results/investment-report.md"
    @echo "   Public:  packages/survey/dist/investment-report.md"

# Setup database
setup-db:
    bun run scripts/setup-db.ts

# Check database status
check-db:
    bun run scripts/setup-db.ts --check

# Reset database (clear all data)
reset-db:
    bun run scripts/setup-db.ts --reset

# Run the survey app in development mode
dev:
    cd packages/survey && bun run dev

# Install dependencies
install:
    bun install

# Print all email addresses from survey responses
emails:
    @bun run scripts/print-emails.ts
