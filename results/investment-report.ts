#!/usr/bin/env bun
/**
 * Generate investment report grouped by ability to invest
 * Groups responses into: investing, not-sure, and not-investing
 * Provides contact info and question summaries
 */

const data = await Bun.file('./survey-results.json').json();

interface Response {
  id: string;
  created_at: string;
  data: {
    name?: { value: string; label: string };
    contact?: { value: string; label: string };
    investment_amount?: { value: string; displayValue: string };
    return_expectations?: { value: string; displayValue: string };
    payment_timeline?: { value: string; displayValue: string };
    business_interest?: { value: string; displayValue: string };
    business_ideas?: { value: string; label: string };
    activity_preferences?: { value: string[]; displayValue: string[] };
    time_commitment?: { value: string; displayValue: string };
    contribution_types?: { value: string[]; displayValue: string[] };
    skills?: { value: string; label: string };
    cabin_interest?: { value: string; displayValue: string };
    cabin_usage?: { value: string[]; displayValue: string[] };
    space_needs?: { value: string[]; displayValue: string[] };
    visit_frequency?: { value: string; displayValue: string };
    priority_projects?: { value: string[]; displayValue: string[] };
    renovation_participation?: { value: number };
    first_year_focus?: { value: string; label: string };
    inspiration?: { value: string; label: string };
    longterm_vision?: { value: string; label: string };
    openness_level?: { value: string; displayValue: string };
    governance_participation?: { value: number };
    conflict_resolution?: { value: string; displayValue: string };
    social_events?: { value: string[]; displayValue: string[] };
    main_concerns?: { value: string[]; displayValue: string[] };
    deal_breakers?: { value: string; label: string };
    must_haves?: { value: string; label: string };
    involvement_level?: { value: string; displayValue: string };
    free_wishes?: { value: string; label: string };
  };
}

const responses: Response[] = data.responses;

// Group responses by investment ability
const investing: Response[] = [];
const notSure: Response[] = [];
const notInvesting: Response[] = [];

responses.forEach(r => {
  const amount = r.data.investment_amount?.value;
  if (!amount || amount === 'no_investment') {
    notInvesting.push(r);
  } else if (amount === 'unclear') {
    notSure.push(r);
  } else {
    investing.push(r);
  }
});

// Helper to summarize text responses
function summarizeTexts(texts: string[]): string {
  if (texts.length === 0) return 'No responses.';

  const validTexts = texts.filter(t => t && t.trim().length > 0);
  if (validTexts.length === 0) return 'No detailed responses.';

  const summary: string[] = [];
  validTexts.forEach((text, i) => {
    // Truncate long texts for summary
    const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
    summary.push(`  ${i + 1}. ${preview}`);
  });

  return summary.join('\n');
}

// Helper to count and display checkbox/multiple choice responses
function summarizeChoices(responses: Response[], field: keyof Response['data']): string {
  const counts = new Map<string, number>();
  let total = 0;

  responses.forEach(r => {
    const fieldData = r.data[field] as any;
    if (!fieldData) return;

    const values = Array.isArray(fieldData.displayValue)
      ? fieldData.displayValue
      : Array.isArray(fieldData.value)
        ? fieldData.value
        : [fieldData.displayValue || fieldData.value];

    values.forEach((val: string) => {
      if (val) {
        counts.set(val, (counts.get(val) || 0) + 1);
        total++;
      }
    });
  });

  if (counts.size === 0) return 'No responses.';

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([choice, count]) => `  • ${choice}: ${count}`)
    .join('\n');
}

// Generate report
console.log(`# Alhovuori Investment Report

Generated: ${new Date().toLocaleDateString('fi-FI')}
Total Responses: ${responses.length}

---

## Summary by Investment Group

| Group | Count | Percentage |
|-------|-------|------------|
| **Ready to Invest** | ${investing.length} | ${Math.round((investing.length / responses.length) * 100)}% |
| **Not Sure Yet** | ${notSure.length} | ${Math.round((notSure.length / responses.length) * 100)}% |
| **Not Investing** | ${notInvesting.length} | ${Math.round((notInvesting.length / responses.length) * 100)}% |

---

## 1. Ready to Invest (${investing.length} people)

### Contact Information

| Name | Email | Investment Amount | Payment Timeline |
|------|-------|-------------------|------------------|
${investing.map(r => {
  const name = r.data.name?.value || 'N/A';
  const email = r.data.contact?.value || 'N/A';
  const amount = r.data.investment_amount?.displayValue || 'N/A';
  const timeline = r.data.payment_timeline?.displayValue || 'N/A';
  return `| ${name} | ${email} | ${amount} | ${timeline} |`;
}).join('\n')}

### Investment Details

**Return Expectations:**
${summarizeChoices(investing, 'return_expectations')}

**Total Potential Investment:**
${investing.map(r => {
  const val = r.data.investment_amount?.value;
  if (!val || val === 'unclear' || val === 'no_investment') return 0;
  return parseInt(val.replace('k', '000'));
}).reduce((sum, val) => sum + val, 0).toLocaleString('fi-FI')}€

---

## 2. Not Sure Yet (${notSure.length} people)

### Contact Information

| Name | Email |
|------|-------|
${notSure.map(r => {
  const name = r.data.name?.value || 'N/A';
  const email = r.data.contact?.value || 'N/A';
  return `| ${name} | ${email} |`;
}).join('\n')}

---

## 3. Not Investing (${notInvesting.length} people)

These participants want to contribute in other ways than financially.

**How they want to contribute:**
${summarizeChoices(notInvesting, 'contribution_types')}

---

## Question Summaries

### Activity Preferences (What type of activities for Alhovuori?)

**Ready to Invest group:**
${summarizeChoices(investing, 'activity_preferences')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'activity_preferences')}

### First Year Focus

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.first_year_focus?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.first_year_focus?.value || '').filter(Boolean))}

### What Inspires Them About Alhovuori

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.inspiration?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.inspiration?.value || '').filter(Boolean))}

### Time Commitment

**Ready to Invest group:**
${summarizeChoices(investing, 'time_commitment')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'time_commitment')}

### Skills Offered

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.skills?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.skills?.value || '').filter(Boolean))}

### Business Interest

**Ready to Invest group:**
${summarizeChoices(investing, 'business_interest')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'business_interest')}

### Business Ideas

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.business_ideas?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.business_ideas?.value || '').filter(Boolean))}

### Cabin/Plot Interest

**Ready to Invest group:**
${summarizeChoices(investing, 'cabin_interest')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'cabin_interest')}

### Desired Common Spaces

**Ready to Invest group:**
${summarizeChoices(investing, 'space_needs')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'space_needs')}

### Visit Frequency

**Ready to Invest group:**
${summarizeChoices(investing, 'visit_frequency')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'visit_frequency')}

### Priority Projects

**Ready to Invest group:**
${summarizeChoices(investing, 'priority_projects')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'priority_projects')}

### Long-term Vision (10 years)

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.longterm_vision?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.longterm_vision?.value || '').filter(Boolean))}

### Community Openness Preference

**Ready to Invest group:**
${summarizeChoices(investing, 'openness_level')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'openness_level')}

### Desired Social Events

**Ready to Invest group:**
${summarizeChoices(investing, 'social_events')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'social_events')}

### Main Concerns

**Ready to Invest group:**
${summarizeChoices(investing, 'main_concerns')}

**Not Sure Yet group:**
${summarizeChoices(notSure, 'main_concerns')}

### Deal Breakers

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.deal_breakers?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.deal_breakers?.value || '').filter(Boolean))}

### Must-Haves

**Ready to Invest group:**
${summarizeTexts(investing.map(r => r.data.must_haves?.value || '').filter(Boolean))}

**Not Sure Yet group:**
${summarizeTexts(notSure.map(r => r.data.must_haves?.value || '').filter(Boolean))}

### Involvement Level

**All groups:**
${summarizeChoices(responses, 'involvement_level')}

---

## Key Insights

### Financial Potential
- **${investing.length}** people ready to invest now
- **${notSure.length}** people considering investment
- Combined committed capital: **${investing.map(r => {
  const val = r.data.investment_amount?.value;
  if (!val || val === 'unclear' || val === 'no_investment') return 0;
  return parseInt(val.replace('k', '000'));
}).reduce((sum, val) => sum + val, 0).toLocaleString('fi-FI')}€**

### Community Strength
- Total engaged participants: **${responses.length}**
- People willing to contribute time/skills: **${responses.filter(r =>
  r.data.contribution_types?.value?.length > 0
).length}**
- Strong commitment level: **${responses.filter(r =>
  r.data.involvement_level?.value === 'committed'
).length}** strongly committed

### Next Steps
1. **Contact investors**: Reach out to the ${investing.length} ready-to-invest participants
2. **Clarify with undecided**: Follow up with ${notSure.length} people to address concerns
3. **Engage contributors**: Include ${notInvesting.length} non-investing participants in skill-based roles
4. **Address concerns**: Common concerns need attention in planning phase

---

*Report generated from ${responses.length} survey responses*
`);
