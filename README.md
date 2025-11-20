# Alhovuori Community Project

A monorepo containing web applications for the Alhovuori community project. Currently includes a dynamic questionnaire system built with SurveyJS.

## Project Structure

This is a monorepo with multiple packages:

```
alhovuori/
├── packages/          # Application packages
│   └── survey/        # Survey form application
├── shared/            # Shared utilities and types
├── scripts/           # Database management scripts
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3+ (recommended) or Node.js v18+
- [Supabase account](https://supabase.com) (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/alhovuori/alhovuori.git
cd alhovuori

# Install all dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Initialize database
bun run setup-db

# Start development server
bun run dev
```

The survey app will open at http://localhost:5173

## Available Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run dev` | Run survey app in dev mode |
| `bun run build` | Build survey app for production |
| `bun run preview` | Preview production build |
| `bun run setup-db` | Initialize database |
| `bun run view-results` | View survey responses via CLI |

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for more commands.

## Packages

### Survey (`packages/survey`)

A flexible, JSON-configurable questionnaire system with:

- **Conditional Logic**: Questions appear/hide based on answers
- **Auto-save**: Form progress saved to LocalStorage
- **Cloud Storage**: Responses stored in Supabase
- **Analytics Dashboard**: Visual charts and graphs
- **Results Viewer**: Sortable, filterable data table
- **Names List**: View survey participants
- **Welcome Screen**: Project information and description

**Technology:**
- SurveyJS - Form engine
- Vite - Build tool
- TypeScript - Type safety
- Supabase - Backend database
- Tabulator Tables - Data display

## Documentation

- [**DEVELOPMENT.md**](./docs/DEVELOPMENT.md) - Setup and development workflow
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - System architecture and structure
- [**DEPLOYMENT.md**](./docs/DEPLOYMENT.md) - Deployment instructions
- [**PROPOSAL.md**](./PROPOSAL.md) - Monorepo migration plan

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_API_KEY=your-anon-key
VITE_SUPABASE_PASSWD=your-db-password
VITE_BASE_PATH=/
```

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md#configure-environment-variables) for details.

## Development Workflow

### Working on the Survey App

```bash
# Navigate to package
cd packages/survey

# Start dev server
bun run dev

# Build for production
bun run build
```

### Using Shared Code

Import utilities and types from `@shared`:

```typescript
import { loadResponses, saveResponse } from '@shared/utils/supabase';
import { STORAGE_KEY } from '@shared/utils/storage';
import type { SurveyResponse } from '@shared/types/supabase';
```

### Database Management

```bash
# View all responses
bun run view-results

# View latest response
bun run view-results:latest

# Check database status
bun run setup-db:check

# Reset database (destructive!)
bun run setup-db:reset
```

## Building for Production

```bash
# Build survey app
bun run build

# Preview production build
bun run preview
```

Output: `packages/survey/dist/`

## Deployment

The project automatically deploys to GitHub Pages when changes are pushed to `main`.

**Deployment URL:** https://alhovuori.github.io/alhovuori/

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## Adding New Applications

To add a new application to the monorepo:

1. Create directory: `packages/new-app/`
2. Add `package.json` with `@alhovuori/new-app` name
3. Configure `tsconfig.json` extending root config
4. Import shared code using `@shared/*` aliases
5. Add deployment workflow

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md#adding-new-applications) for details.

## Features

### Survey App Features

- **Multi-page Forms**: Organize questions into pages
- **Conditional Logic**: Show/hide based on answers
- **Question Types**: Radio, checkbox, text, rating, matrix, and more
- **Validation**: Required fields, email validation, custom rules
- **Progress Bar**: Track completion
- **Auto-save**: Never lose form progress
- **Results Table**: Sort, filter, export data
- **Analytics**: Visual charts and insights
- **Mobile-friendly**: Responsive design

## Customization

### Survey Configuration

Edit `packages/survey/survey-config.json` to customize the form:

```json
{
  "pages": [
    {
      "elements": [
        {
          "type": "radiogroup",
          "name": "question1",
          "title": "Your question here",
          "choices": ["Option 1", "Option 2"],
          "isRequired": true
        }
      ]
    }
  ]
}
```

See [SurveyJS Documentation](https://surveyjs.io/form-library/documentation/overview) for more options.

## Troubleshooting

### Build Errors

- Run `bun install` to update dependencies
- Check TypeScript errors: Fix in your IDE
- Verify import paths use `@shared/*` not relative paths

### Database Connection

- Verify `.env` file has correct Supabase credentials
- Check Supabase project is active
- Restart dev server after changing `.env`

### Deployment Fails

- Check GitHub Actions logs (Actions tab)
- Verify GitHub Secrets are set correctly
- See [DEPLOYMENT.md](./docs/DEPLOYMENT.md#troubleshooting)

## Resources

- [SurveyJS Documentation](https://surveyjs.io/form-library/documentation/overview)
- [Bun Documentation](https://bun.sh/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/my-feature`
6. Open a pull request

## License

This project uses the SurveyJS library. See [SurveyJS License](https://surveyjs.io/licensing) for details.

## Support

- **Documentation**: See `docs/` directory
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions

---

Built with ❤️ for the Alhovuori community
