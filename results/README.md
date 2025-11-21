# Survey Results Reports

This directory contains generated reports from the Alhovuori community survey.

## Available Reports

### 1. Report (Question-by-Question)

Shows all responses organized by question topics without grouping by investment ability.

**Private Version** (with contact information):
- **File**: `report.md`
- **Location**: `/home/k0/work/community/alhovuori/results/report.md`
- **Content**: Complete participant list with contact details
- **Access**: Keep private, do not share publicly

**Public Version** (without contact information):
- **File**: `report.md`
- **Location**: `/home/k0/work/community/alhovuori/packages/survey/dist/report.md`
- **Web Access**: http://localhost:5174/report.html (when dev server is running)
- **Access**: Safe to share publicly

### 2. Investment Report (Grouped by Investment Ability)

Organizes responses into three groups: ready to invest, not sure yet, and not investing.

**Private Version** (with contact information):
- **File**: `investment-report.md`
- **Location**: `/home/k0/work/community/alhovuori/results/investment-report.md`
- **Content**: Full report including names and email addresses
- **Access**: Keep private, do not share publicly

**Public Version** (without contact information):
- **File**: `investment-report.md`
- **Location**: `/home/k0/work/community/alhovuori/packages/survey/dist/investment-report.md`
- **Web Access**: http://localhost:5174/investment-report.html (when dev server is running)
- **Access**: Safe to share publicly

## Generating Reports

To update reports with latest survey data:

```bash
# 1. First, export latest responses from Supabase
cd /home/k0/work/community/alhovuori
bun scripts/export-results.ts --output results/survey-results.json

# 2. Generate both private and public reports
cd results
bun generate-reports.ts
```

## Report Features

**Both reports include:**
- **Executive Summary**: 3-paragraph overview of key findings with concrete numbers
- **Tables with Alternating Colors**: All data formatted as tables for easy reading
- **Finnish Language**: All text and summaries in Finnish
- **Professional Formatting**: Clean, readable markdown structure

**Investment Report** focuses on:
- Summary by investment group (Ready to Invest, Not Sure Yet, Not Investing)
- Investment details and total potential capital
- Question summaries grouped by investment ability
- Contact information for investors (private version only)

**Data Report** focuses on:
- All questions organized by topic
- Complete participant list (private version only)
- Ungrouped statistics showing overall trends
- Comprehensive question-by-question breakdown

**Privacy**: Private versions include full contact tables. Public versions show all statistics and insights but no personal information.

## Current Statistics

- **Total Responses**: 18
- **Ready to Invest**: 6 people (145,000€)
- **Not Sure Yet**: 5 people
- **Not Investing**: 7 people

Last updated: 21.11.2025
