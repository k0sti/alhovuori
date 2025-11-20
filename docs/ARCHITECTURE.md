# Architecture

## Overview

This project is structured as a monorepo containing multiple web applications and shared code. The monorepo structure allows for:

- Clear separation of concerns between different applications
- Shared utilities and types to reduce duplication
- Independent deployment pipelines
- Easy addition of new applications

## Directory Structure

```
alhovuori/
├── packages/                  # Application packages
│   └── survey/                # Survey form application
│       ├── src/               # Application source code
│       ├── index.html         # HTML entry point
│       ├── survey-config.json # Form configuration
│       ├── package.json       # App dependencies
│       ├── tsconfig.json      # TypeScript config
│       └── vite.config.ts     # Build configuration
│
├── shared/                    # Shared code across apps
│   ├── utils/                 # Utility functions
│   │   ├── supabase.ts       # Supabase client & API
│   │   └── storage.ts        # LocalStorage helpers
│   ├── types/                 # Shared TypeScript types
│   │   └── supabase.ts       # Database type definitions
│   └── package.json           # Shared dependencies
│
├── scripts/                   # Root-level scripts
│   ├── setup-db.ts           # Database initialization
│   ├── view-results.ts       # CLI results viewer
│   └── package.json          # Script dependencies
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # This file
│   ├── DEVELOPMENT.md        # Development guide
│   └── DEPLOYMENT.md         # Deployment instructions
│
├── .github/workflows/        # CI/CD pipelines
│   └── deploy-survey.yaml   # Survey app deployment
│
├── package.json              # Root workspace config
├── tsconfig.json             # Root TypeScript config
├── bun.lock                  # Lock file
└── .env                      # Environment variables
```

## Packages

### Survey (`packages/survey`)

A dynamic questionnaire system built with SurveyJS. Features include:

- **Multi-page form** with conditional logic
- **Auto-save** to LocalStorage
- **Cloud storage** via Supabase
- **Results viewer** with filtering and sorting
- **Analytics dashboard** with visualizations
- **Names list** of participants
- **Welcome screen** with project information

**Technology Stack:**
- SurveyJS (form engine)
- Vite (build tool)
- TypeScript
- Supabase (backend)
- Tabulator Tables (data display)

## Shared Code

### Utils (`shared/utils`)

Reusable utility functions:

- **`supabase.ts`**: Supabase client creation, data loading/saving
- **`storage.ts`**: LocalStorage operations with error handling

### Types (`shared/types`)

Shared TypeScript interfaces:

- **`supabase.ts`**: Database table schemas and types

## Scripts

Root-level scripts for database management:

- **`setup-db.ts`**: Initialize Supabase tables
- **`view-results.ts`**: View survey responses via CLI

## Build System

- **Package Manager**: Bun (faster than npm/yarn)
- **Bundler**: Vite (fast builds, HMR)
- **TypeScript**: Strict mode enabled
- **Workspaces**: Bun workspaces for monorepo

## Data Flow

### Survey Submission

```
User fills form → Auto-save to LocalStorage → Submit → Save to Supabase → Clear LocalStorage → Show success
```

### Analytics View

```
Load from Supabase → Filter PII → Render charts → Display insights
```

### Results View

```
Load from Supabase → Create table → Enable sorting/filtering → Allow CSV export
```

## Environment Variables

Required environment variables (stored in `.env`):

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_API_KEY`: Supabase anonymous API key
- `VITE_SUPABASE_PASSWD`: Supabase database password (for scripts)
- `VITE_BASE_PATH`: Base path for deployment (e.g., `/alhovuori/`)

## Path Aliases

The monorepo uses TypeScript path aliases for clean imports:

- `@shared/*`: Points to `/shared/*`
- `@alhovuori/shared/*`: Alternative alias for shared code

Example usage:
```typescript
import { loadResponses } from '@shared/utils/supabase';
import { STORAGE_KEY } from '@shared/utils/storage';
```

## Adding New Applications

To add a new application to the monorepo:

1. Create directory: `packages/new-app/`
2. Add `package.json` with `@alhovuori/new-app` name
3. Configure `tsconfig.json` extending root config
4. Add build configuration (e.g., `vite.config.ts`)
5. Create deployment workflow in `.github/workflows/`
6. Import shared code using `@shared/*` aliases
7. Update root `package.json` scripts

## Best Practices

- **Shared code first**: Extract reusable logic to `shared/`
- **Type safety**: Use TypeScript interfaces from `shared/types`
- **Environment variables**: Prefix with `VITE_` for client-side access
- **Clean imports**: Use path aliases instead of relative paths
- **Independent builds**: Each app should build independently
- **Documentation**: Update docs when adding features

## Design Principles

1. **Separation of Concerns**: Each package has a single responsibility
2. **Code Reuse**: Shared utilities prevent duplication
3. **Type Safety**: Strict TypeScript configuration
4. **Developer Experience**: Fast builds, clear structure
5. **Scalability**: Easy to add new apps
6. **Maintainability**: Clear boundaries, good documentation
