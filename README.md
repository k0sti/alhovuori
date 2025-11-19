# Dynamic Questionnaire System

A flexible, JSON-configurable questionnaire system built with SurveyJS. Features conditional logic, user-added options, and real-time analytics.

## Features

- **Conditional Logic**: Questions appear/hide based on user answers
- **User-Added Options**: Users can add their own choices to multiple-choice questions
- **Interactive Results**: View all responses in a sortable, filterable table
- **Visual Analytics**: Charts and graphs showing response distribution
- **JSON Configuration**: Define entire forms in a JSON file
- **Supabase Storage**: Responses saved to cloud database for public access
- **Live Editing**: Modify form configuration and see changes instantly

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js

### Installation

```bash
# Install dependencies
bun install

# Set up database (first time only)
bun run setup-db

# Start development server
bun run dev
```

The application will open at `http://localhost:5173`

## Database Setup

This application uses Supabase to store survey responses. You need to set up the database table before first use.

### Automatic Setup (Recommended)

```bash
bun run setup-db
```

This will:
1. Check if the table exists
2. Show you the SQL to run in your Supabase dashboard
3. Provide step-by-step instructions

### Manual Setup

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run**

### Database Commands

```bash
bun run setup-db         # Check status and get setup instructions
bun run setup-db:check   # Just check if table exists
bun run setup-db:reset   # Clear all responses (keeps table structure)
```

### Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_API_KEY=your-anon-key
```

## Project Structure

```
vision/
├── index.html           # Main HTML page
├── survey-config.json   # Form configuration (edit this!)
├── src/
│   └── app.ts          # Application logic
├── package.json
└── README.md
```

## Customizing Your Form

Edit `survey-config.json` to customize your questionnaire. The configuration uses SurveyJS JSON format.

### Basic Question Types

```json
{
  "type": "radiogroup",
  "name": "question1",
  "title": "Choose one option",
  "choices": ["Option 1", "Option 2", "Option 3"]
}
```

Available question types:
- `radiogroup` - Single choice
- `checkbox` - Multiple choice
- `dropdown` - Dropdown menu
- `tagbox` - Multi-select tags (users can add custom items)
- `text` - Single line text
- `comment` - Multi-line text
- `rating` - Star/number rating
- `boolean` - Yes/No
- `matrix` - Grid of questions
- `ranking` - Drag-to-rank items

### Conditional Logic (Show/Hide Questions)

Use the `visibleIf` property to show questions based on previous answers:

```json
{
  "type": "comment",
  "name": "followUp",
  "visibleIf": "{question1} = 'Option 1'",
  "title": "Tell us more..."
}
```

**Conditional Operators:**
- `=` Equal
- `<>` Not equal
- `>`, `<`, `>=`, `<=` Comparisons
- `contains` String contains
- `empty`, `notempty` Check if answered
- `or`, `and` Combine conditions

**Examples:**
```json
"visibleIf": "{age} >= 18"
"visibleIf": "{customerType} = 'Yes' and {satisfaction} < 3"
"visibleIf": "{products} contains 'Product A'"
"visibleIf": "{email} notempty"
```

### User-Added Options

Allow users to add custom choices:

```json
{
  "type": "checkbox",
  "name": "interests",
  "title": "What are your interests?",
  "choices": ["Sports", "Music", "Art"],
  "showOtherItem": true,
  "showSelectAllItem": true
}
```

For fully dynamic user-added items, use `tagbox`:

```json
{
  "type": "tagbox",
  "name": "tags",
  "title": "Type to add items",
  "choices": ["Suggestion 1", "Suggestion 2"],
  "allowClear": true
}
```

### Pages and Progress Bar

Organize questions into pages:

```json
{
  "showProgressBar": "top",
  "progressBarType": "buttons",
  "pages": [
    {
      "name": "page1",
      "title": "Personal Info",
      "elements": [...]
    },
    {
      "name": "page2",
      "title": "Preferences",
      "elements": [...]
    }
  ]
}
```

### Required Questions

```json
{
  "type": "text",
  "name": "email",
  "title": "Email",
  "isRequired": true,
  "validators": [
    {
      "type": "email"
    }
  ]
}
```

Available validators:
- `email` - Email format
- `numeric` - Numbers only
- `regex` - Custom regex pattern
- `text` - Min/max length

### Custom Completion Messages

```json
{
  "completedHtml": "<h3>Thank you!</h3><p>Your response has been saved.</p>",
  "completedHtmlOnCondition": [
    {
      "expression": "{satisfaction} >= 4",
      "html": "<h3>Thanks for the great feedback!</h3>"
    }
  ]
}
```

## Application Tabs

### 1. Fill Form
Interactive form where users submit responses. Features:
- Real-time validation
- Conditional question display
- Progress tracking
- Custom completion message

### 2. View Results
Table view of all responses with:
- Sortable columns
- Filtering capabilities
- Export to CSV/Excel
- Clear all responses button

### 3. Analytics
Visual analytics with:
- Bar charts for multiple choice
- Pie charts for single choice
- Distribution graphs for ratings
- Word clouds for text responses
- Interactive filtering

### 4. View/Edit JSON
Live JSON editor to:
- View current form configuration
- Edit and test changes instantly
- Copy configuration for backup
- Learn JSON format by example

## Advanced Configuration

### Styling

The form uses SurveyJS default theme v2. To customize:

```typescript
// In src/app.ts
import { StylesManager } from "survey-core";

StylesManager.applyTheme("defaultV2");
```

### Adding Custom Question Types

SurveyJS supports custom question components. See [SurveyJS documentation](https://surveyjs.io/form-library/documentation/customize-question-types/create-custom-question-type).

### Backend Integration

To save responses to a server instead of localStorage:

```typescript
// In src/app.ts, modify saveResponse():
async function saveResponse(data: any): Promise<void> {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to save response');
  }
}
```

### PDF Export

To add PDF export functionality:

```typescript
import { SurveyPDF } from "survey-pdf";

function exportToPDF() {
  const surveyPDF = new SurveyPDF(surveyConfig);
  surveyPDF.data = currentSurvey.data;
  surveyPDF.save("survey-response.pdf");
}
```

## Building for Production

```bash
# Create production build
bun run build

# Preview production build
bun run preview
```

Build output will be in the `dist/` directory.

## Example Use Cases

### Customer Feedback Survey
Questions about satisfaction, products used, and improvement suggestions with conditional follow-ups.

### Event Registration
Conditional dietary preferences, accessibility needs based on attendance confirmation.

### Job Application
Show different questions based on position type, experience level, or location.

### Market Research
Dynamic product interest questions based on demographics and usage patterns.

### Health Questionnaire
Follow-up questions based on symptoms or conditions reported.

## Tips and Best Practices

1. **Start Simple**: Begin with basic questions, add conditional logic incrementally
2. **Test Conditions**: Use the JSON editor to test different conditional scenarios
3. **Mobile-Friendly**: SurveyJS is responsive by default
4. **Question Naming**: Use descriptive names (e.g., `customerType` not `q1`)
5. **Page Length**: Keep pages to 3-5 questions for better UX
6. **Validation**: Add validators to ensure data quality
7. **Progress Indication**: Use progress bar for multi-page forms
8. **Clear Labels**: Write clear, concise question titles

## Resources

- [SurveyJS Documentation](https://surveyjs.io/form-library/documentation/overview)
- [JSON Schema Examples](https://surveyjs.io/form-library/examples/overview)
- [Conditional Logic Guide](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic)
- [Question Types Reference](https://surveyjs.io/form-library/documentation/api-reference/question)

## Troubleshooting

### Conditional logic not working
- Check question `name` values match exactly (case-sensitive)
- Use `{questionName}` format in conditions
- Test with simple conditions first

### Analytics not showing
- Ensure responses exist (check "View Results" tab)
- Some question types don't generate visualizations (e.g., open text)

### JSON editor changes not applying
- Validate JSON syntax (use online JSON validator)
- Click "Apply Changes" button
- Check browser console for errors

## License

This project uses SurveyJS library. See [SurveyJS License](https://surveyjs.io/licensing) for details.

## Next Steps

1. Customize `survey-config.json` for your use case
2. Test conditional logic thoroughly
3. Style the interface to match your brand
4. Add backend integration if needed
5. Deploy to production (Netlify, Vercel, etc.)

Happy surveying!
