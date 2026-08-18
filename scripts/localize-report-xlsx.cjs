const fs = require('fs/promises');
const path = require('path');
const { FileBlob, SpreadsheetFile } = require('@oai/artifact-tool');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'outputs/speech-landing/uniqore-speech-analysis-demo-report.xlsx');
const outputDir = path.join(root, 'outputs/us-localization-2026-08-18');
const output = path.join(outputDir, 'uniqore-speech-analysis-demo-report.xlsx');
const previewDir = path.join(outputDir, 'xlsx-preview');

const sheets = [
  {
    from: 'Сводка',
    to: 'Summary',
    range: 'A1:F14',
    widths: [180, 120, 290, 230, 150, 280],
    values: [
      ['Uniqore · Sales Conversation Review', null, null, null, null, null],
      [null, null, null, null, null, null],
      ['Current month · Jul 1–31, 2026 · reviewed Jul 31, 2026 at 6:42 PM', null, null, null, null, null],
      [null, null, null, null, null, null],
      ['Key finding', 'Value', 'What it means', 'Evidence', 'Status', 'Next action'],
      ['Team-wide gap', '21 of 40', 'Deals ended without an agreed follow-up date', 'HubSpot messages and call recordings', 'Needs attention', 'Make a dated next step the required outcome of every conversation'],
      ['Average score for eligible reps', 74.66666666666667, 'Fixed 0–100 rubric; code calculates the score', '4 reps with a sufficient sample', 'Monitor', 'Review the trend monthly'],
      ['Deals reviewed', 40, 'Every selected deal in the current period', '96 notes · 12 emails · 54 messages · 118 calls', 'Complete', 'Use the supporting deals in the next sales meeting'],
      ['Call recordings analyzed', 14, 'Audio was analyzed only when a recording and approval were available', '18 deals had recordings', 'Complete', 'Enable recording on missing channels where appropriate'],
      ['Winning example', 'Deal 1201', 'Maya moved the conversation from price to customer ROI', 'Call recording + written conversation', 'Team playbook', 'Share the language with the full team'],
      [null, null, null, null, null, null],
      ['Main takeaway: call volume is not the problem. The team often ends conversations without a specific, agreed-upon next step.', null, null, null, null, null],
      [null, null, null, null, null, null],
      ['Built in Uniqore · uniqore.ai', null, null, null, null, null],
    ],
  },
  {
    from: 'Менеджеры',
    to: 'Rep Coaching',
    range: 'A1:G10',
    widths: [130, 80, 105, 130, 245, 220, 295],
    values: [
      ['Rep scorecards and coaching plans', null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ['A score is assigned only when the closed-deal sample is large enough', null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ['Sales rep', 'Score', 'Closed deals', 'Recordings analyzed', 'Strength', 'Primary growth area', 'First action'],
      ['Maya', 84, 8, 5, 'Reframes price around customer ROI', 'Securing the next step', 'Set a follow-up date before ending every call'],
      ['Jordan', 77, 8, 4, 'Consistent discovery', 'Follow-through after a proposal', 'Schedule a check-in within 24 hours of sending a proposal'],
      ['Alex', 63, 8, 3, 'Explains the product clearly', 'First-response speed', 'Respond to new inbound leads within 30 minutes'],
      ['Sam', 51, 8, 2, 'Re-engages after a rejection', 'Pricing and next steps', 'After a price objection, quantify ROI and secure a follow-up date'],
      ['Taylor', null, 3, 0, 'Insufficient data', 'A larger sample is needed', 'Accumulate at least 4 closed deals before assigning a score'],
    ],
  },
  {
    from: 'План действий',
    to: 'Action Plan',
    range: 'A1:F12',
    widths: [100, 105, 280, 300, 130, 260],
    values: [
      ['Deal-level action plan', null, null, null, null, null],
      [null, null, null, null, null, null],
      ['Daily rep actions and a monthly coaching plan', null, null, null, null, null],
      [null, null, null, null, null, null],
      ['Horizon', 'Owner', 'Action', 'Why', 'Deals', 'How to verify'],
      ['Today', 'Sam', 'Reopen the conversation and quantify ROI at the customer’s volume', 'Deal 1288 ended at “too expensive” without a response', '1288', 'A dated follow-up appears in HubSpot'],
      ['Today', 'Sam', 'Secure a specific follow-up date', 'Two calls ended with “I’ll think about it” and no commitment', '1197 · 1233', 'An agreed date and owner are recorded'],
      ['Today', 'Alex', 'Respond to new inbound leads within 30 minutes', 'Median first-response time is above the team norm', '1307 · 1310', 'First response time is 30 minutes or less'],
      ['This week', 'Jordan', 'Add a check-in after every proposal', 'Deals are stalling after the proposal is sent', '1302 · 1309', 'A follow-up occurs within 24 hours'],
      ['This week', 'Team', 'Use Maya’s language when responding to a price objection', 'The same objection led to a win in deal 1201', '1201', 'The approach appears in at least 3 new conversations'],
      ['This month', 'Sam', 'Practice pricing and next steps on real calls', 'The two weakest criteria are 4/8 and 2/8', '1288 · 1197 · 1233', 'Both criteria improve in the next scorecard'],
      ['This month', 'Sales leader', 'Check whether dated next steps became a team habit', 'The gap appeared in 21 of 40 deals', 'Entire team', 'Deals without a date decline by at least one third'],
    ],
  },
  {
    from: 'Сделки-доказательства',
    to: 'Deal Evidence',
    range: 'A1:G13',
    widths: [85, 95, 100, 190, 285, 275, 250],
    values: [
      ['Supporting deals', null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ['Examples from customer conversations and call recordings in this demo review', null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ['Deal', 'Sales rep', 'Outcome', 'Source', 'Conversation / fact', 'Finding', 'Action'],
      [1201, 'Maya', 'Closed won', 'Call recording + written conversation', '“Let’s run the numbers at your volume. If the ROI is not there, we will know.”', 'The rep moved the conversation from price to customer ROI', 'Use as a team example'],
      [1288, 'Sam', 'Closed lost', 'Call recording', '“I understand. Think it over and let me know.”', 'The objection went unanswered and no follow-up date was set', 'Reframe the price objection and schedule the next contact'],
      [1197, 'Sam', 'Closed lost', 'Call recording', 'Conversation ended without a specific date', 'The prospect does not know what happens next', 'Set the date and owner'],
      [1233, 'Sam', 'Closed lost', 'Call recording', '“I’ll follow up with you later.”', 'The rep handed control back to the prospect', 'Offer two specific follow-up times'],
      [1302, 'Jordan', 'Open', 'Written conversation', 'Proposal sent; no follow-up for 3 days', 'The deal stalled after the proposal', 'Follow up today and confirm the next step'],
      [1309, 'Jordan', 'Open', 'HubSpot email + notes', 'The customer opened the proposal; no diagnostic question followed', 'Interest exists, but the conversation did not advance', 'Ask what is preventing a decision'],
      [1310, 'Alex', 'Stalled', 'HubSpot call · 12 seconds', 'The recording contains ringing, not a conversation', 'There is no conversation to score', 'Make another contact attempt'],
      [1284, 'Alex', 'Stalled', '42-minute recording', 'Recording exceeds the demo analysis limit', 'Finding is based on emails and HubSpot notes', 'Structure the next call into clear stages'],
    ],
  },
  {
    from: 'Покрытие данных',
    to: 'Data Coverage',
    range: 'A1:D13',
    widths: [220, 105, 140, 410],
    values: [
      ['What was analyzed', null, null, null],
      [null, null, null, null],
      ['Demo coverage: HubSpot customer emails, messages, notes, and available call recordings', null, null, null],
      [null, null, null, null],
      ['Source material', 'Found', 'Analyzed', 'Notes'],
      ['Deals', 40, 40, 'Every selected deal in the period'],
      ['HubSpot notes', 96, 96, 'Reviewed in full'],
      ['HubSpot emails', 12, 12, 'Reviewed in full'],
      ['Customer messages', 54, 54, 'Messages recorded in HubSpot'],
      ['Calls', 118, 118, 'Call existence, date, and duration included'],
      ['Call recordings', 18, 14, '4 recordings excluded under the stated demo limits'],
      [null, null, null, null],
      ['Important: call content is analyzed only when a recording exists and audio processing is separately approved. Without a recording, a call remains a HubSpot activity but is not used as evidence for a conversation finding.', null, null, null],
    ],
  },
];

(async () => {
  const input = await FileBlob.load(source);
  const workbook = await SpreadsheetFile.importXlsx(input);

  for (const spec of sheets) {
    const sheet = workbook.worksheets.getItem(spec.from);
    sheet.name = spec.to;
    const target = sheet.getRange(spec.range);
    target.values = spec.values;
    target.format.wrapText = true;
    for (let index = 0; index < spec.widths.length; index += 1) {
      sheet.getRangeByIndexes(0, index, spec.values.length, 1).format.columnWidthPx = spec.widths[index];
    }
    sheet.getRange(spec.range).format.autofitRows();
    sheet.freezePanes.freezeRows(5);
    if (spec.to === 'Rep Coaching') sheet.getRange('B6:B10').format.numberFormat = '0 " / 100"';
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  for (const spec of sheets) {
    const preview = await workbook.render({ sheetName: spec.to, autoCrop: 'all', scale: 1, format: 'png' });
    await fs.writeFile(path.join(previewDir, `${spec.to.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`), new Uint8Array(await preview.arrayBuffer()));
  }

  const inspect = await workbook.inspect({ kind: 'workbook,sheet,table', maxChars: 12000, tableMaxRows: 14, tableMaxCols: 8, tableMaxCellChars: 120 });
  await fs.writeFile(path.join(outputDir, 'inspection.ndjson'), inspect.ndjson);
  const exported = await SpreadsheetFile.exportXlsx(workbook);
  await exported.save(output);
  console.log(output);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
