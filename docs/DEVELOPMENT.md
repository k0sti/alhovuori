# Development Guide

## Prerequisites

- **Bun** v1.3+ ([installation guide](https://bun.sh/docs/installation))
- **Git**
- **Node.js** v18+ (optional, Bun is preferred)
- **Supabase account** (for backend)

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/alhovuori/alhovuori.git
cd alhovuori
```

### 2. Install dependencies

```bash
bun install
```

This installs dependencies for all workspace packages.

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_API_KEY=your-anon-key
VITE_SUPABASE_PASSWD=your-db-password
VITE_BASE_PATH=/
```

**How to get Supabase credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy `Project URL` and `anon public` key

### 4. Initialize the database

```bash
bun run setup-db
```

This creates the `survey_responses` table in Supabase.

## Development Workflow

### Running the survey app

```bash
bun run dev
# or
bun run dev:survey
```

Opens at http://localhost:5173

**Features:**
- Hot Module Replacement (HMR)
- Auto-save to LocalStorage
- Live reload on code changes

### Building for production

```bash
bun run build
# or
bun run build:survey
```

Output: `packages/survey/dist/`

### Preview production build

```bash
bun run preview
```

Opens at http://localhost:4173

## Project Structure

### Working on the Survey App

Files are located in `packages/survey/`:

- `src/app.ts` - Main application logic
- `index.html` - HTML template
- `survey-config.json` - Form configuration
- `vite.config.ts` - Build settings

### Using Shared Code

Import from `@shared/*`:

```typescript
import { loadResponses, saveResponse } from '@shared/utils/supabase';
import { STORAGE_KEY } from '@shared/utils/storage';
import type { SurveyResponse } from '@shared/types/supabase';
```

Shared code is in `/shared/`:
- `utils/` - Utility functions
- `types/` - TypeScript interfaces

### Creating New Shared Utilities

1. Add file to `shared/utils/` or `shared/types/`
2. Export functions/types
3. Import using `@shared/*` alias
4. TypeScript will pick up types automatically

Example:

```typescript
// shared/utils/validation.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// packages/survey/src/app.ts
import { validateEmail } from '@shared/utils/validation';
```

## Available Commands

### Root-level commands

| Command | Description |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run dev` | Run survey app in dev mode |
| `bun run dev:survey` | Same as above |
| `bun run build` | Build survey app |
| `bun run build:survey` | Same as above |
| `bun run build:all` | Build all apps |
| `bun run preview` | Preview survey build |
| `bun run setup-db` | Initialize database |
| `bun run setup-db:reset` | Reset database (destructive!) |
| `bun run setup-db:check` | Check database status |
| `bun run view-results` | View all survey responses |
| `bun run view-results:latest` | View latest response |
| `bun run view-results:json` | Output as JSON |
| `bun run view-results:all` | View all (no limit) |

### Package-specific commands

Navigate to package directory first:

```bash
cd packages/survey
bun run dev     # Start dev server
bun run build   # Build app
bun run preview # Preview build
```

## Database Management

### View responses via CLI

```bash
# View all responses
bun run view-results

# View latest response
bun run view-results:latest

# Output as JSON
bun run view-results:json

# View all (no pagination)
bun run view-results:all
```

### Reset database

**Warning: This deletes all data!**

```bash
bun run setup-db:reset
```

### Check database status

```bash
bun run setup-db:check
```

## Troubleshooting

### "Workspace not found" error

Make sure all workspace packages have a `package.json`:
- `packages/survey/package.json` ✓
- `shared/package.json` ✓
- `scripts/package.json` ✓

Run `bun install` after adding package.json files.

### Import resolution errors

1. Check `tsconfig.json` has path aliases:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@shared/*": ["./shared/*"]
       }
     }
   }
   ```

2. Check `vite.config.ts` has aliases:
   ```typescript
   export default defineConfig({
     resolve: {
       alias: {
         '@shared': path.resolve(__dirname, '../../shared'),
       },
     },
   });
   ```

3. Restart dev server after config changes

### Build fails with module errors

- Run `bun install` to ensure dependencies are up to date
- Check that shared package has required dependencies
- Verify imports use `@shared/*` not relative paths

### LocalStorage not working

- Check browser console for errors
- Verify browser allows localStorage (incognito mode may block it)
- Clear localStorage: `localStorage.clear()` in console

### Supabase connection errors

- Verify `.env` file exists with correct credentials
- Check Supabase project is active
- Ensure `VITE_` prefix is used for client-side variables
- Restart dev server after changing `.env`

## Code Style

### TypeScript

- Use strict mode (enabled by default)
- Prefer `const` over `let`
- Use type annotations for function parameters
- Avoid `any` type when possible

### Imports

- Use path aliases: `@shared/*`
- Group imports: external, internal, types
- Sort imports alphabetically within groups

### Functions

- Keep functions small and focused
- Use descriptive names
- Add JSDoc comments for shared utilities
- Handle errors gracefully

### Files

- One component/utility per file
- Use `.ts` for logic, `.tsx` for React components
- Keep files under 300 lines when possible

## Testing

Currently no automated tests. Manual testing checklist:

**Survey App:**
- [ ] Form loads without errors
- [ ] All question types render correctly
- [ ] Validation works (required fields, email format)
- [ ] Auto-save to LocalStorage works
- [ ] Form submission saves to Supabase
- [ ] Results view displays data
- [ ] Analytics view renders charts
- [ ] Names view shows participants
- [ ] Welcome screen displays correctly
- [ ] Tab switching works
- [ ] Clear form button works

**Build:**
- [ ] `bun run build` succeeds
- [ ] No TypeScript errors
- [ ] Vite warnings are expected
- [ ] Output directory exists: `packages/survey/dist/`

## Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push branch: `git push origin feature/my-feature`
4. Open pull request on GitHub
5. After review, merge to main

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the codebase
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions
- Check [PROPOSAL.md](../PROPOSAL.md) for the migration plan
