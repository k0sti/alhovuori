#!/usr/bin/env bun

const data = await Bun.file('./survey-results.json').json();

interface Response {
  data: {
    name?: { value: string };
    skills?: { value: string };
    contact?: { value: string };
    inspiration?: { value: string };
    space_needs?: { value: string[]; displayValue: string[] };
    social_events?: { value: string[]; displayValue: string[] };
    time_commitment?: { value: string };
    main_concerns?: { value: string[]; displayValue: string[] };
    business_ideas?: { value: string };
    openness_level?: { value: string };
    longterm_vision?: { value: string };
    first_year_focus?: { value: string };
  };
}

const responses: Response[] = data.responses;
const total = data.metadata.total_responses;

// Analyze space needs
const spaceNeeds = new Map<string, number>();
responses.forEach((r: Response) => {
  r.data.space_needs?.value?.forEach((space: string) => {
    spaceNeeds.set(space, (spaceNeeds.get(space) || 0) + 1);
  });
});

// Analyze social events
const socialEvents = new Map<string, number>();
responses.forEach((r: Response) => {
  r.data.social_events?.value?.forEach((event: string) => {
    socialEvents.set(event, (socialEvents.get(event) || 0) + 1);
  });
});

// Analyze time commitment levels
const commitment = new Map<string, number>();
responses.forEach((r: Response) => {
  const level = r.data.time_commitment?.value;
  if (level) {
    commitment.set(level, (commitment.get(level) || 0) + 1);
  }
});

// Collect skills
const skills: string[] = [];
responses.forEach((r: Response) => {
  if (r.data.skills?.value) {
    skills.push(r.data.skills.value);
  }
});

// Count business ideas
const businessIdeas = responses.filter(r => r.data.business_ideas?.value?.trim()).length;

// Generate report
console.log(`# Alhovuori Yhteisöhanke - Yhteenveto

**${total} aktiivista vastausta** • ${new Date(data.metadata.exported_at).toLocaleDateString('fi-FI')}

## 🌟 Keskeiset havainnot

✨ **Vahva kiinnostus yhteisölliseen toimintaan** - Vastaajilla on selkeä visio yhteisöstä
🛠️ **Monipuolinen osaamispooli** - IT-osaamisesta käsitöihin ja ruoanlaittoon
🎯 **Konkreettisia liiketoimintaideoita** - ${businessIdeas} vastaajaa jakoi konkreettisia ideoita
🤝 **Sitoutuminen vaihtelevaa** - Joustava lähestymistapa mahdollistaa eri elämäntilanteet

## 🏡 Top 5 Tilatarpeet

${Array.from(spaceNeeds.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([space, count], i) => `${i + 1}. **${space}** - ${count}/${total} (${Math.round(count / total * 100)}%)`)
  .join('\n')}

## 🎉 Halutut Tapahtumat

${Array.from(socialEvents.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 4)
  .map(([event, count]) => `- **${event}** (${count}/${total})`)
  .join('\n')}

## 🎯 Osaamiskartta (esimerkkejä)

${skills.slice(0, 6).map(skill => {
  const preview = skill.split('\n')[0].substring(0, 80);
  return `• ${preview}${skill.length > 80 ? '...' : ''}`;
}).join('\n')}

## ⏰ Sitoutuminen

${Array.from(commitment.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([level, count]) => `- ${level}: **${count}** hlö`)
  .join('\n') || '- Tiedot täydentyvät'}

---

**Seuraavat askeleet:** Tulosten pohjalta voidaan priorisoida tilaratkaisut ja aloittaa yhteisen vision tarkentaminen.
`);
