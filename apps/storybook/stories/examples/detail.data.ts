// The data of the Detail recipe: a ticket in Relay Desk, a helpdesk. Everything is fictional and
// fixed (no clock, no random), so a story reads the same on every run.

import type { AuditChange } from '../../../../packages/react/src';

/** "Now" for every relative time and countdown of the screen: Thursday 29 October 2026, 10:00 UTC. */
export const NOW = new Date('2026-10-29T10:00:00Z');

export type Person = { name: string; email: string };

export type Message = {
  id: string;
  author: string;
  role: 'Customer' | 'Support';
  /** ISO 8601, UTC. */
  at: string;
  text: string;
  /** A snippet the customer pasted under the text. */
  code?: string;
  /** A note only the team sees. */
  internal?: boolean;
};

/** An opening message and the replies under it: the thread nests one level. */
export type Exchange = { message: Message; replies: Message[] };

export type HistoryEntry = {
  id: string;
  actor: string;
  action: string;
  at: string;
  changes: AuditChange[];
};

export type RelatedTicket = {
  id: string;
  title: string;
  status: 'Open' | 'Resolved' | 'Closed';
};

export type Ticket = {
  id: string;
  subject: string;
  summary: string;
  /** Badge text and color: the business status of the ticket, not a health status. */
  status: { label: string; intent: 'brand' | 'warning' | 'danger' | 'success' };
  priority: { label: 'Urgent' | 'High' | 'Normal'; intent: 'danger' | 'warning' | 'neutral' };
  channel: string;
  createdAt: string;
  requester: Person;
  /** `null`: nobody has taken it yet. */
  assignee: string | null;
  sla: { label: string; due: string };
  tags: string[];
  /** Position in the list the ticket was opened from, for the pager. */
  position: { index: number; total: number };
  /** The custom fields of the Details tab. */
  fields: { label: string; value: string; mono?: boolean }[];
  exchanges: Exchange[];
  history: HistoryEntry[];
  related: RelatedTicket[];
  /** What the aside says when there is no related ticket. */
  noRelated: string;
};

const priya: Person = { name: 'Priya Raman', email: 'priya.raman@brightloop.example' };

/** Ticket #4821, the regular content. */
export const ticket: Ticket = {
  id: '4821',
  subject: 'Refund not received for order 10392',
  summary: 'The refund for a returned order has not reached the customer’s card after 11 days.',
  status: { label: 'Waiting on us', intent: 'warning' },
  priority: { label: 'High', intent: 'warning' },
  channel: 'Email',
  createdAt: '2026-10-23T09:14:00Z',
  requester: priya,
  assignee: 'Marcus Obi',
  sla: { label: 'Next reply due', due: '2026-10-29T11:42:00Z' },
  tags: ['refund', 'payments', 'return'],
  position: { index: 12, total: 248 },
  fields: [
    { label: 'Order', value: '10392', mono: true },
    { label: 'Order total', value: '€148.00' },
    { label: 'Payment method', value: 'Card ending 4417' },
    { label: 'Refund reference', value: 'RF-55102', mono: true },
    { label: 'Carrier', value: 'Parcelway Express' },
    { label: 'Warehouse', value: 'Rotterdam' },
  ],
  exchanges: [
    {
      message: {
        id: 'm1',
        author: 'Priya Raman',
        role: 'Customer',
        at: '2026-10-23T09:14:00Z',
        text: 'I returned order 10392 on Oct 12 and was told the refund would arrive within 5 business days. It is Oct 23 and nothing has shown up on my card ending 4417. Can you check what happened?',
      },
      replies: [
        {
          id: 'm2',
          author: 'Marcus Obi',
          role: 'Support',
          at: '2026-10-23T11:30:00Z',
          text: 'Thanks, Priya. Your parcel was scanned in at our warehouse on Oct 15 and the refund was issued on Oct 18. I am asking our payments team to trace it and will write back within a day.',
        },
        {
          id: 'm3',
          author: 'Priya Raman',
          role: 'Customer',
          at: '2026-10-28T16:05:00Z',
          text: 'Five more days and my bank still shows nothing. Could you send me the refund reference to give them?',
        },
        {
          id: 'm4',
          author: 'Marcus Obi',
          role: 'Support',
          at: '2026-10-29T08:41:00Z',
          internal: true,
          text: 'Refund RF-55102 has been pending at the processor since Oct 18. Payments is re-issuing it; ping #pay-ops if it has not settled by 15:00.',
        },
      ],
    },
  ],
  history: [
    {
      id: 'h3',
      actor: 'Marcus Obi',
      action: 'changed the priority',
      at: '2026-10-29T08:44:00Z',
      changes: [{ field: 'priority', label: 'Priority', before: 'Normal', after: 'High' }],
    },
    {
      id: 'h2',
      actor: 'Marcus Obi',
      action: 'took the ticket',
      at: '2026-10-23T09:20:00Z',
      changes: [
        { field: 'assignee', label: 'Assignee', before: null, after: 'Marcus Obi' },
        { field: 'status', label: 'Status', before: 'New', after: 'Open' },
      ],
    },
    {
      id: 'h1',
      actor: 'Priya Raman',
      action: 'opened the ticket by email',
      at: '2026-10-23T09:14:00Z',
      changes: [],
    },
  ],
  related: [
    { id: '4790', title: 'Refund pending after return', status: 'Resolved' },
    { id: '4655', title: 'Wrong item delivered', status: 'Closed' },
    { id: '4533', title: 'Card charged twice for one order', status: 'Closed' },
  ],
  noRelated: 'No other ticket from Priya Raman.',
};

/** Ticket #4826, new: nobody has answered yet, so the thread asks for the first reply. */
export const newTicket: Ticket = {
  ...ticket,
  id: '4826',
  subject: 'Cannot export invoices to CSV',
  summary: 'The export button on the invoices page ends with an empty file.',
  status: { label: 'New', intent: 'brand' },
  priority: { label: 'Normal', intent: 'neutral' },
  channel: 'Web form',
  createdAt: '2026-10-29T09:02:00Z',
  requester: { name: 'Jonas Weber', email: 'jonas.weber@kestrelfoods.example' },
  assignee: null,
  sla: { label: 'First reply due', due: '2026-10-29T13:46:00Z' },
  tags: [],
  position: { index: 1, total: 249 },
  fields: [
    { label: 'Account', value: 'Kestrel Foods' },
    { label: 'Plan', value: 'Business' },
    { label: 'Browser', value: 'Firefox 132' },
  ],
  exchanges: [],
  history: [
    {
      id: 'h1',
      actor: 'Jonas Weber',
      action: 'opened the ticket from the web form',
      at: '2026-10-29T09:02:00Z',
      changes: [],
    },
  ],
  related: [],
  noRelated: 'No other ticket from Jonas Weber.',
};

const bartholomew: Person = {
  name: 'Bartholomew Fitzgerald-Montgomery',
  email: 'bartholomew.fitzgerald-montgomery@northwind-logistics-international.example.com',
};

const TAGS = [
  'refund',
  'payments',
  'return',
  'vip',
  'eu-west',
  'carrier-dispute',
  'rotterdam',
  'wrong-warehouse',
  'double-charge',
  'shipping',
  'express',
  'escalated',
  'pay-ops',
  'processor',
  'rf-55102',
  'chargeback-risk',
  'b2b',
  'north-america',
  'q4-peak',
  'sla-risk',
  'follow-up',
  'legal-hold',
  'finance',
  'warehouse',
  'customs',
  'duties',
  'invoice',
  'credit-note',
  'retry',
  'bank-trace',
  'swift',
  'sepa',
  'partial',
  'high-value',
  'enterprise',
  'key-account',
  'manual-review',
  'audit',
  'press-risk',
  'repeat-contact',
];

/** The text of the long message: an HTTP exchange the customer pastes in. */
export const pastedResponse = `POST /v2/refunds/RF-55102/settle  ->  422 Unprocessable Entity
{"error":"refund_window_exceeded","order":"10392","processor_ref":"pr_7Qz4k9Xw2LmN8dT0cVb3eYhJ5aUsKo1","retry_after":null}`;

const VOICES: { author: string; role: Message['role']; text: string }[] = [
  {
    author: 'Marcus Obi',
    role: 'Support',
    text: 'Reproduced on our side. Escalating to Payments.',
  },
  {
    author: bartholomew.name,
    role: 'Customer',
    text: 'Thank you. The reference is still pending at our bank.',
  },
  {
    author: 'Sofia Alvarez',
    role: 'Support',
    text: 'The refund was re-issued and settles within 2 business days.',
  },
];

/** 200 replies under one message, a little under an hour apart. */
const longReplies: Message[] = Array.from({ length: 200 }, (_, i) => {
  const voice = VOICES[i % VOICES.length];
  const at = new Date(Date.UTC(2026, 9, 21, 9, 10) + i * 47 * 60_000).toISOString();
  return { id: `r${i + 1}`, ...voice, at, text: `${voice.text} (update ${i + 1})` };
});

/** Ticket #4821 at its limits: a subject on three lines, 40 tags, long emails, 200 replies. */
export const extremeTicket: Ticket = {
  ...ticket,
  subject:
    'Refund not received for order 10392 after the parcel was scanned at the wrong warehouse and shipping was charged twice',
  status: { label: 'SLA breached', intent: 'danger' },
  priority: { label: 'Urgent', intent: 'danger' },
  requester: bartholomew,
  sla: { label: 'Next reply due', due: '2026-10-29T07:50:00Z' },
  tags: TAGS,
  exchanges: [
    {
      message: {
        id: 'x1',
        author: bartholomew.name,
        role: 'Customer',
        at: '2026-10-21T07:52:00Z',
        text: `Writing from ${bartholomew.email}. The refund for order 10392 was rejected by your processor. This is the response we get when retrying from our side:`,
        code: pastedResponse,
      },
      replies: longReplies,
    },
  ],
};
