import { writeFile } from 'fs/promises';
import surveyResults from '../results/survey-results.json';

interface Response {
  id: string;
  created_at: string;
  data: {
    name?: { value: string };
    contact?: { value: string };
    investment_amount?: {
      value: string;
      label: string;
      displayValue: string;
    };
    cabin_interest?: {
      value: string;
      displayValue: string;
    };
    business_interest?: {
      value: string;
      displayValue: string;
    };
    skills?: {
      value: string[];
      displayValue: string;
    };
    time_commitment?: {
      value: string;
      displayValue: string;
    };
    contribution_types?: {
      value: string[];
      displayValue: string;
    };
  };
}

interface InvestorInfo {
  name: string;
  contact: string;
  investmentAmount: string;
  investmentValue: string;
  cabinInterest: string;
  businessInterest: string;
  skills: string;
  timeCommitment: string;
  contributionTypes: string;
  submittedAt: string;
}

// Filter participants who are willing to invest (not "no_investment")
const investors = (surveyResults.responses as Response[])
  .filter(response => {
    const investmentValue = response.data.investment_amount?.value;
    return investmentValue && investmentValue !== 'no_investment';
  })
  .map(response => {
    const data = response.data;
    return {
      name: data.name?.value || 'N/A',
      contact: data.contact?.value || 'N/A',
      investmentAmount: data.investment_amount?.displayValue || 'N/A',
      investmentValue: data.investment_amount?.value || 'N/A',
      cabinInterest: data.cabin_interest?.displayValue || 'N/A',
      businessInterest: data.business_interest?.displayValue || 'N/A',
      skills: data.skills?.displayValue || 'N/A',
      timeCommitment: data.time_commitment?.displayValue || 'N/A',
      contributionTypes: data.contribution_types?.displayValue || 'N/A',
      submittedAt: response.created_at,
    } as InvestorInfo;
  });

// Generate CSV
const csvHeaders = [
  'Name',
  'Contact',
  'Investment Amount',
  'Cabin Interest',
  'Business Interest',
  'Skills',
  'Time Commitment',
  'Contribution Types',
  'Submitted At'
];

const escapeCsvField = (field: string): string => {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

const csvRows = [
  csvHeaders.join(','),
  ...investors.map(investor => [
    escapeCsvField(investor.name),
    escapeCsvField(investor.contact),
    escapeCsvField(investor.investmentAmount),
    escapeCsvField(investor.cabinInterest),
    escapeCsvField(investor.businessInterest),
    escapeCsvField(investor.skills),
    escapeCsvField(investor.timeCommitment),
    escapeCsvField(investor.contributionTypes),
    escapeCsvField(investor.submittedAt),
  ].join(','))
];

const csvContent = csvRows.join('\n');

// Generate Markdown
const generateMarkdown = () => {
  let md = `# Alhovuori Project - Investment Survey Results\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `**Total Participants Willing to Invest:** ${investors.length}\n\n`;
  md += `---\n\n`;

  if (investors.length === 0) {
    md += `No participants have indicated willingness to invest at this time.\n`;
    return md;
  }

  // Summary statistics
  const investmentLevels = investors.reduce((acc, investor) => {
    const level = investor.investmentAmount;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  md += `## Investment Level Summary\n\n`;
  Object.entries(investmentLevels)
    .sort((a, b) => b[1] - a[1])
    .forEach(([level, count]) => {
      md += `- **${level}**: ${count} participant${count > 1 ? 's' : ''}\n`;
    });

  md += `\n---\n\n`;
  md += `## Detailed Participant Information\n\n`;

  investors.forEach((investor, index) => {
    md += `### ${index + 1}. ${investor.name}\n\n`;
    md += `| Field | Information |\n`;
    md += `|-------|-------------|\n`;
    md += `| **Contact** | ${investor.contact} |\n`;
    md += `| **Investment Amount** | ${investor.investmentAmount} |\n`;
    md += `| **Cabin Interest** | ${investor.cabinInterest} |\n`;
    md += `| **Business Interest** | ${investor.businessInterest} |\n`;
    md += `| **Skills** | ${investor.skills} |\n`;
    md += `| **Time Commitment** | ${investor.timeCommitment} |\n`;
    md += `| **Contribution Types** | ${investor.contributionTypes} |\n`;
    md += `| **Submitted** | ${new Date(investor.submittedAt).toLocaleString()} |\n`;
    md += `\n`;
  });

  return md;
};

const markdownContent = generateMarkdown();

// Write files
await writeFile('./results/investors.csv', csvContent, 'utf-8');
await writeFile('./results/investors.md', markdownContent, 'utf-8');

console.log(`✓ Extracted ${investors.length} potential investors`);
console.log(`✓ Generated: results/investors.csv`);
console.log(`✓ Generated: results/investors.md`);
