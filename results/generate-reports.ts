#!/usr/bin/env bun
/**
 * Generate survey reports
 * Creates investment report (grouped) and data report (ungrouped)
 * Both in private (with contacts) and public (without contacts) versions
 *
 * Usage:
 *   bun run generate-reports.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

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
function summarizeTexts(texts: string[], maxLength: number = 200): string {
  if (texts.length === 0) return 'Ei vastauksia.';

  const validTexts = texts.filter(t => t && t.trim().length > 0);
  if (validTexts.length === 0) return 'Ei yksityiskohtaisia vastauksia.';

  const summary: string[] = [];
  validTexts.forEach((text, i) => {
    const preview = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    summary.push(`${i + 1}. ${preview}`);
  });

  return '\n' + summary.join('\n');
}

// Helper to count and display as table
function summarizeChoicesAsTable(responses: Response[], field: keyof Response['data']): string {
  const counts = new Map<string, number>();

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
      }
    });
  });

  if (counts.size === 0) return '\nEi vastauksia.\n';

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  let table = '\n| Valinta | Määrä |\n|---------|-------|\n';
  sorted.forEach(([choice, count]) => {
    table += `| ${choice} | ${count} |\n`;
  });

  return table;
}

// Calculate total investment
function calculateTotalInvestment(group: Response[]): number {
  return group.map(r => {
    const val = r.data.investment_amount?.value;
    if (!val || val === 'unclear' || val === 'no_investment') return 0;
    return parseInt(val.replace('k', '000'));
  }).reduce((sum, val) => sum + val, 0);
}

// Generate executive summary
function generateExecutiveSummary(includeContacts: boolean): string {
  const totalInvestment = calculateTotalInvestment(investing);
  const stronglyCommitted = responses.filter(r => r.data.involvement_level?.value === 'committed').length;

  return `# Alhovuori Yhteisöhanke - Yhteenveto

**Raportti luotu:** ${new Date().toLocaleDateString('fi-FI', { year: 'numeric', month: 'long', day: 'numeric' })}
**Vastauksia yhteensä:** ${responses.length}

---

## Tiivistelmä

Osallistujien motivaatio on monipuolista. Vahvimmin esillä ovat halu luoda **Borderland-tyylinen yhteisöllinen tila** sekä järjestää **tapahtumia ja festivaaleja**. Kiinnostus ulottuu myös permakulttuuriin, etätyötiloihin ja vapaaseen kyläyhteisöön. **${stronglyCommitted} henkilöä** on ilmoittanut olevansa vahvasti sitoutunut mukaan, ja loput ovat ainakin kiinnostuneita kehityksestä.

Yhteisö tuo mukanaan laajan osaamiskirjon - IT-osaamisesta rakentamiseen, permakulttuurista liiketoiminnan kehittämiseen. ${notInvesting.length} henkilöä, jotka eivät sijoita rahallisesti, ovat valmiita osallistumaan talkootöillä, rakentamisella ja muilla käytännön panoksilla.

---
`;
}

// Generate Investment Report (grouped by investment)
function generateInvestmentReport(includeContacts: boolean): string {
  const totalInvestment = calculateTotalInvestment(investing);
  let report = generateExecutiveSummary(includeContacts);

  report += `## Osallistuminen Sijoitusvalmiuden Mukaan

| Ryhmä | Määrä | Osuus |
|-------|-------|-------|
| **Valmiina sijoittamaan** | ${investing.length} | ${Math.round((investing.length / responses.length) * 100)}% |
| **Ei vielä varma** | ${notSure.length} | ${Math.round((notSure.length / responses.length) * 100)}% |
| **Ei sijoita rahallisesti** | ${notInvesting.length} | ${Math.round((notInvesting.length / responses.length) * 100)}% |

---

## 1. Valmiina Sijoittamaan (${investing.length} henkilöä)

`;

  if (includeContacts) {
    report += `### Yhteystiedot

| Nimi | Sähköposti | Sijoitusmäärä | Aikataulu |
|------|------------|---------------|-----------|
${investing.map(r => {
  const name = r.data.name?.value || 'N/A';
  const email = r.data.contact?.value || 'N/A';
  const amount = r.data.investment_amount?.displayValue || 'N/A';
  const timeline = r.data.payment_timeline?.displayValue || 'N/A';
  return `| ${name} | ${email} | ${amount} | ${timeline} |`;
}).join('\n')}

`;
  }

  report += `### Sijoitustiedot

**Tuotto-odotukset:**
${summarizeChoicesAsTable(investing, 'return_expectations')}

**Sijoitusten kokonaissumma:** ${totalInvestment.toLocaleString('fi-FI')}€

---

## 2. Ei Vielä Varma (${notSure.length} henkilöä)

`;

  if (includeContacts) {
    report += `### Yhteystiedot

| Nimi | Sähköposti |
|------|------------|
${notSure.map(r => {
  const name = r.data.name?.value || 'N/A';
  const email = r.data.contact?.value || 'N/A';
  return `| ${name} | ${email} |`;
}).join('\n')}

`;
  } else {
    report += `${notSure.length} henkilöä harkitsee sijoittamista mutta ei ole vielä sitoutunut.

`;
  }

  report += `---

## 3. Ei Sijoita Rahallisesti (${notInvesting.length} henkilöä)

Nämä osallistujat haluavat osallistua muilla tavoin kuin taloudellisesti.

**Osallistumisen tavat:**
${summarizeChoicesAsTable(notInvesting, 'contribution_types')}

---

## Toiminnan Visiot Ryhmittäin

### Toivotut Toiminnot

**Valmiina sijoittamaan:**
${summarizeChoicesAsTable(investing, 'activity_preferences')}

**Ei vielä varma:**
${summarizeChoicesAsTable(notSure, 'activity_preferences')}

### Ensimmäisen Vuoden Painopisteet

**Valmiina sijoittamaan:**
${summarizeTexts(investing.map(r => r.data.first_year_focus?.value || '').filter(Boolean))}

**Ei vielä varma:**
${summarizeTexts(notSure.map(r => r.data.first_year_focus?.value || '').filter(Boolean))}

---

## Keskeiset Havainnot

### Taloudellinen Potentiaali
- **${investing.length}** henkilöä valmiina sijoittamaan nyt
- **${notSure.length}** henkilöä harkitsee sijoitusta
- Sitoutuneen pääoman määrä: **${totalInvestment.toLocaleString('fi-FI')}€**

### Yhteisön Vahvuus
- Sitoutuneita osallistujia: **${responses.length}**
- Talkootyöhön valmiita: **${responses.filter(r => r.data.contribution_types?.value?.length > 0).length}**
- Vahvasti sitoutuneita: **${responses.filter(r => r.data.involvement_level?.value === 'committed').length}**

### Seuraavat Askeleet
1. **Ota yhteyttä sijoittajiin**: Jatka keskustelua ${investing.length} sijoitusvalmiin osallistujan kanssa
2. **Selvitä epävarmojen huolia**: Keskustele ${notSure.length} harkitsevan henkilön kanssa
3. **Aktivoi osaajat**: Hyödynnä ${notInvesting.length} ei-sijoittavan osallistujan osaamista
4. **Käsittele huolenaiheet**: Yhteisille huolille tulee vastata suunnitteluvaiheessa

---

*Raportti luotu ${responses.length} kyselyvastauksen pohjalta*
`;

  return report;
}

// Generate Data Report (ungrouped)
function generateDataReport(includeContacts: boolean): string {
  let report = generateExecutiveSummary(includeContacts);

  report += `## Yksityiskohtainen Yhteenveto Kysymyksittäin

Tämä raportti esittää kaikki vastaukset kysymyksittäin ilman ryhmittelyä.

---

### 1. Perustiedot

**Vastausten määrä:** ${responses.length}

`;

  if (includeContacts) {
    report += `**Osallistujat:**

| Nimi | Sähköposti | Vastausajankohta |
|------|------------|------------------|
${responses.map(r => {
  const name = r.data.name?.value || 'N/A';
  const email = r.data.contact?.value || 'N/A';
  const date = new Date(r.created_at).toLocaleDateString('fi-FI');
  return `| ${name} | ${email} | ${date} |`;
}).join('\n')}

`;
  }

  report += `---

### 2. Toiminnan Visiot

**Toivotut toiminnot Alhovuorelle:**
${summarizeChoicesAsTable(responses, 'activity_preferences')}

**Ensimmäisen vuoden painopisteet:**
${summarizeTexts(responses.map(r => r.data.first_year_focus?.value || '').filter(Boolean))}

**Mikä Alhovuoressa inspiroi:**
${summarizeTexts(responses.map(r => r.data.inspiration?.value || '').filter(Boolean))}

---

### 3. Osallistuminen ja Panos

**Aikasitoumus:**
${summarizeChoicesAsTable(responses, 'time_commitment')}

**Osallistumisen tavat:**
${summarizeChoicesAsTable(responses, 'contribution_types')}

**Tarjottu osaaminen:**
${summarizeTexts(responses.map(r => r.data.skills?.value || '').filter(Boolean))}

**Liiketoimintakiinnostus:**
${summarizeChoicesAsTable(responses, 'business_interest')}

**Liiketoimintaideoita:**
${summarizeTexts(responses.map(r => r.data.business_ideas?.value || '').filter(Boolean))}

---

### 4. Panostus ja Käyttö

**Sijoitushalukkuus:**
${summarizeChoicesAsTable(responses, 'investment_amount')}

**Tuotto-odotukset:**
${summarizeChoicesAsTable(responses.filter(r => r.data.return_expectations), 'return_expectations')}

**Sijoitusaikataulu:**
${summarizeChoicesAsTable(responses.filter(r => r.data.payment_timeline), 'payment_timeline')}

**Kiinnostus omaan tonttiin:**
${summarizeChoicesAsTable(responses, 'cabin_interest')}

**Toivotut yhteiset tilat:**
${summarizeChoicesAsTable(responses, 'space_needs')}

**Käyntitiheys:**
${summarizeChoicesAsTable(responses, 'visit_frequency')}

---

### 5. Kehittäminen ja Investoinnit

**Tärkeimmät kehitysprojektit:**
${summarizeChoicesAsTable(responses, 'priority_projects')}

**Pitkän aikavälin visio (10 vuotta):**
${summarizeTexts(responses.map(r => r.data.longterm_vision?.value || '').filter(Boolean))}

---

### 6. Yhteisöelämä

**Toiminnan avoimuus:**
${summarizeChoicesAsTable(responses, 'openness_level')}

**Konfliktien ratkaisu:**
${summarizeChoicesAsTable(responses, 'conflict_resolution')}

**Toivotut yhteisötapahtumat:**
${summarizeChoicesAsTable(responses, 'social_events')}

---

### 7. Huolenaiheet ja Riskit

**Pääasialliset huolenaiheet:**
${summarizeChoicesAsTable(responses, 'main_concerns')}

**Deal breakerit:**
${summarizeTexts(responses.map(r => r.data.deal_breakers?.value || '').filter(Boolean), 150)}

**Ehdottomat vaatimukset:**
${summarizeTexts(responses.map(r => r.data.must_haves?.value || '').filter(Boolean), 150)}

---

### 8. Sitoutumisen Taso

**Sitoutumistaso:**
${summarizeChoicesAsTable(responses, 'involvement_level')}

---

## Yhteenveto Numeroina

| Mittari | Arvo |
|---------|------|
| Vastauksia yhteensä | ${responses.length} |
| Sijoitusvalmiita | ${investing.length} (${Math.round((investing.length / responses.length) * 100)}%) |
| Harkitsevia | ${notSure.length} (${Math.round((notSure.length / responses.length) * 100)}%) |
| Osallistuvia muilla tavoin | ${notInvesting.length} (${Math.round((notInvesting.length / responses.length) * 100)}%) |
| Vahvasti sitoutuneita | ${responses.filter(r => r.data.involvement_level?.value === 'committed').length} |
| Potentiaali sijoituspääoma | ${calculateTotalInvestment(investing).toLocaleString('fi-FI')}€ |

---

*Raportti luotu ${responses.length} kyselyvastauksen pohjalta*
`;

  return report;
}

// Generate all report versions
console.log('📊 Generating reports...\n');

const investmentPrivate = generateInvestmentReport(true);
const investmentPublic = generateInvestmentReport(false);
const dataPrivate = generateDataReport(true);
const dataPublic = generateDataReport(false);

// Save private reports
writeFileSync('./report.md', dataPrivate, 'utf-8');
console.log('✅ Private report: results/report.md');

writeFileSync('./investment-report.md', investmentPrivate, 'utf-8');
console.log('✅ Private investment report: results/investment-report.md');

// Save public reports to web folder
const webPath = join(import.meta.dir, '..', 'packages', 'survey', 'dist');
writeFileSync(join(webPath, 'report.md'), dataPublic, 'utf-8');
console.log('✅ Public report: packages/survey/dist/report.md');

writeFileSync(join(webPath, 'investment-report.md'), investmentPublic, 'utf-8');
console.log('✅ Public investment report: packages/survey/dist/investment-report.md');

console.log('\n📊 Report Statistics:');
console.log(`   Total responses: ${responses.length}`);
console.log(`   Ready to invest: ${investing.length} (${calculateTotalInvestment(investing).toLocaleString('fi-FI')}€)`);
console.log(`   Not sure yet: ${notSure.length}`);
console.log(`   Not investing: ${notInvesting.length}`);
console.log('\n💡 Access public reports at:');
console.log('   http://localhost:5174/report.html (Report)');
console.log('   http://localhost:5174/investment-report.html (Investment report)');
