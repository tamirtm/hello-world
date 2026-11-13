// Bet templates. Each one turns a couple of short inputs into a single
// statement that is either true (YES) or false (NO).

export type TemplateId = 'overunder' | 'yesno' | 'whowill' | 'firstto' | 'free';

export interface Template {
  id: TemplateId;
  label: string;
  fields: ReadonlyArray<{ key: 'a' | 'b'; label: string; placeholder: string; max: number }>;
  yesLabel: string;
  noLabel: string;
  compose: (a: string, b: string) => string;
}

const join = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(' ');

export const TEMPLATES: ReadonlyArray<Template> = [
  {
    id: 'overunder',
    label: 'Over / under',
    fields: [
      { key: 'a', label: 'What are we measuring?', placeholder: 'Food arrives in', max: 60 },
      { key: 'b', label: 'The line', placeholder: '15 minutes', max: 30 },
    ],
    yesLabel: 'Over',
    noLabel: 'Under',
    compose: (a, b) => (a.trim() && b.trim() ? join(a, 'over', b) : ''),
  },
  {
    id: 'yesno',
    label: 'Yes / no',
    fields: [{ key: 'a', label: 'What might happen?', placeholder: 'Sam shows up before 9', max: 90 }],
    yesLabel: 'Yes',
    noLabel: 'No',
    compose: (a) => a.trim(),
  },
  {
    id: 'whowill',
    label: 'Who will',
    fields: [
      { key: 'a', label: 'Who?', placeholder: 'Sam', max: 30 },
      { key: 'b', label: 'Will…', placeholder: 'order dessert', max: 60 },
    ],
    yesLabel: 'Yes',
    noLabel: 'No',
    compose: (a, b) => (a.trim() && b.trim() ? join(a, 'will', b) : ''),
  },
  {
    id: 'firstto',
    label: 'First to',
    fields: [
      { key: 'a', label: 'Who?', placeholder: 'Sam', max: 30 },
      { key: 'b', label: 'Is first to…', placeholder: 'finish their plate', max: 60 },
    ],
    yesLabel: 'Yes',
    noLabel: 'No',
    compose: (a, b) => (a.trim() && b.trim() ? join(a, 'is first to', b) : ''),
  },
  {
    id: 'free',
    label: 'Write my own',
    fields: [{ key: 'a', label: 'The bet, as something that is true or false', placeholder: 'It rains before midnight', max: 120 }],
    yesLabel: 'Yes',
    noLabel: 'No',
    compose: (a) => a.trim(),
  },
];
