// The data of the List recipe: the orders of "Folio & Co", a small online bookshop with one
// shop in Berlin. Fictional people only, fixed dates around 29 October 2026, nothing random, so a
// story renders the same on every run.

export const PAYMENTS = ['Paid', 'Pending', 'Failed', 'Refunded'] as const;
export const FULFILMENTS = ['Unfulfilled', 'Shipped', 'Delivered', 'Returned'] as const;
export const CHANNELS = ['Web shop', 'In store', 'Marketplace'] as const;
export const COUNTRIES = [
  'Germany',
  'France',
  'Netherlands',
  'Belgium',
  'Austria',
  'Spain',
] as const;
export const CARRIERS = ['Northline Express', 'ParcelHub Europe', 'Store pickup'] as const;

export type Payment = (typeof PAYMENTS)[number];
export type Fulfilment = (typeof FULFILMENTS)[number];

export type Order = {
  id: string;
  customer: string;
  email: string;
  /** Books in the order. */
  items: number;
  /** In euros. */
  total: number;
  payment: Payment;
  fulfilment: Fulfilment;
  channel: string;
  country: string;
  carrier: string;
  /** Empty when no code was used. */
  coupon: string;
  /** ISO date, no time. */
  date: string;
};

type Row = [
  id: number,
  customer: string,
  items: number,
  total: number,
  payment: Payment,
  fulfilment: Fulfilment,
  channel: (typeof CHANNELS)[number],
  country: (typeof COUNTRIES)[number],
  carrier: (typeof CARRIERS)[number],
  coupon: string,
  date: string,
];

// Newest first. A refunded order is never still to ship, and a failed payment never shipped.
const ROWS: Row[] = [
  [
    20481,
    'Maya Lindqvist',
    3,
    84.5,
    'Pending',
    'Unfulfilled',
    'Web shop',
    'Germany',
    'Northline Express',
    '',
    '2026-10-29',
  ],
  [
    20480,
    'Daan Verhoeven',
    2,
    41.8,
    'Paid',
    'Unfulfilled',
    'Web shop',
    'Netherlands',
    'ParcelHub Europe',
    'AUTUMN10',
    '2026-10-29',
  ],
  [
    20479,
    'Camille Rousseau',
    6,
    158.2,
    'Paid',
    'Shipped',
    'Web shop',
    'France',
    'Northline Express',
    'READERS15',
    '2026-10-29',
  ],
  [
    20478,
    'Tobias Renner',
    5,
    132,
    'Failed',
    'Unfulfilled',
    'Web shop',
    'Austria',
    'ParcelHub Europe',
    '',
    '2026-10-29',
  ],
  [
    20477,
    'Ingrid Solberg',
    1,
    22.9,
    'Paid',
    'Delivered',
    'In store',
    'Germany',
    'Store pickup',
    '',
    '2026-10-28',
  ],
  [
    20476,
    'Mateo Fernández',
    4,
    97.6,
    'Paid',
    'Shipped',
    'Marketplace',
    'Spain',
    'ParcelHub Europe',
    '',
    '2026-10-28',
  ],
  [
    20475,
    'Léa Dubois',
    2,
    36.4,
    'Paid',
    'Unfulfilled',
    'Web shop',
    'France',
    'Northline Express',
    '',
    '2026-10-28',
  ],
  [
    20474,
    'Amara Okafor',
    1,
    27.9,
    'Pending',
    'Unfulfilled',
    'Web shop',
    'Belgium',
    'ParcelHub Europe',
    '',
    '2026-10-28',
  ],
  [
    20473,
    'Jonas Weber',
    7,
    189.3,
    'Paid',
    'Delivered',
    'Web shop',
    'Germany',
    'Northline Express',
    '',
    '2026-10-27',
  ],
  [
    20472,
    'Nadia Haddad',
    3,
    71,
    'Paid',
    'Delivered',
    'Marketplace',
    'Belgium',
    'ParcelHub Europe',
    '',
    '2026-10-27',
  ],
  [
    20471,
    'Pieter Jansen',
    2,
    45.2,
    'Refunded',
    'Returned',
    'Web shop',
    'Netherlands',
    'Northline Express',
    '',
    '2026-10-27',
  ],
  [
    20470,
    'Sara Lindgren',
    9,
    244.1,
    'Paid',
    'Shipped',
    'Web shop',
    'Germany',
    'ParcelHub Europe',
    'AUTUMN10',
    '2026-10-27',
  ],
  [
    20469,
    'Julien Marchetti',
    8,
    215.4,
    'Pending',
    'Shipped',
    'Web shop',
    'France',
    'Northline Express',
    '',
    '2026-10-26',
  ],
  [
    20468,
    'Hanna Kowalczyk',
    1,
    18.5,
    'Paid',
    'Delivered',
    'In store',
    'Germany',
    'Store pickup',
    '',
    '2026-10-26',
  ],
  [
    20467,
    'Rafael Moreno',
    3,
    69.9,
    'Paid',
    'Delivered',
    'Marketplace',
    'Spain',
    'ParcelHub Europe',
    '',
    '2026-10-26',
  ],
  [
    20466,
    'Eline Maes',
    2,
    52.3,
    'Paid',
    'Unfulfilled',
    'Web shop',
    'Belgium',
    'Northline Express',
    'READERS15',
    '2026-10-25',
  ],
  [
    20465,
    'Lukas Gruber',
    4,
    104.8,
    'Paid',
    'Delivered',
    'Web shop',
    'Austria',
    'ParcelHub Europe',
    '',
    '2026-10-25',
  ],
  [
    20464,
    'Zoé Lambert',
    1,
    14.95,
    'Refunded',
    'Returned',
    'Web shop',
    'France',
    'Northline Express',
    '',
    '2026-10-25',
  ],
  [
    20463,
    'Priya Raghavan',
    2,
    61.2,
    'Failed',
    'Unfulfilled',
    'Web shop',
    'Germany',
    'ParcelHub Europe',
    '',
    '2026-10-24',
  ],
  [
    20462,
    'Bram de Wit',
    5,
    128.7,
    'Paid',
    'Delivered',
    'Web shop',
    'Netherlands',
    'Northline Express',
    '',
    '2026-10-24',
  ],
  [
    20461,
    'Katarina Nováková',
    3,
    77.4,
    'Paid',
    'Delivered',
    'Marketplace',
    'Austria',
    'ParcelHub Europe',
    '',
    '2026-10-24',
  ],
  [
    20460,
    'Oliver Hartmann',
    6,
    163.5,
    'Paid',
    'Delivered',
    'In store',
    'Germany',
    'Store pickup',
    '',
    '2026-10-23',
  ],
  [
    20459,
    'Inès Benali',
    2,
    38.6,
    'Paid',
    'Delivered',
    'Web shop',
    'France',
    'Northline Express',
    'AUTUMN10',
    '2026-10-23',
  ],
  [
    20458,
    'Marta Ibáñez',
    4,
    92.1,
    'Paid',
    'Delivered',
    'Web shop',
    'Spain',
    'ParcelHub Europe',
    '',
    '2026-10-23',
  ],
  [
    20457,
    'Elliot Brandt',
    2,
    48,
    'Pending',
    'Unfulfilled',
    'Web shop',
    'Germany',
    'Northline Express',
    '',
    '2026-10-22',
  ],
  [
    20456,
    'Femke Bakker',
    1,
    24.9,
    'Paid',
    'Delivered',
    'Web shop',
    'Netherlands',
    'ParcelHub Europe',
    '',
    '2026-10-22',
  ],
  [
    20455,
    'Anton Eriksen',
    10,
    276.8,
    'Paid',
    'Delivered',
    'Web shop',
    'Germany',
    'Northline Express',
    'READERS15',
    '2026-10-22',
  ],
  [
    20454,
    'Chiara Bellini',
    3,
    66.3,
    'Paid',
    'Delivered',
    'Marketplace',
    'Germany',
    'ParcelHub Europe',
    '',
    '2026-10-21',
  ],
  [
    20453,
    'Viktor Pavlenko',
    2,
    43.7,
    'Refunded',
    'Returned',
    'Web shop',
    'Austria',
    'Northline Express',
    '',
    '2026-10-21',
  ],
  [
    20452,
    'Mélanie Gauthier',
    5,
    119.4,
    'Paid',
    'Delivered',
    'Web shop',
    'Belgium',
    'ParcelHub Europe',
    '',
    '2026-10-21',
  ],
  [
    20451,
    'Sofia Delgado',
    11,
    309.75,
    'Pending',
    'Shipped',
    'Web shop',
    'Spain',
    'Northline Express',
    '',
    '2026-10-20',
  ],
  [
    20450,
    'Gustav Lindberg',
    1,
    19.9,
    'Paid',
    'Delivered',
    'In store',
    'Germany',
    'Store pickup',
    '',
    '2026-10-20',
  ],
  [
    20449,
    'Rosa Marchand',
    3,
    58.2,
    'Paid',
    'Delivered',
    'Web shop',
    'France',
    'ParcelHub Europe',
    '',
    '2026-10-20',
  ],
  [
    20448,
    'Henrik Aalto',
    1,
    19.95,
    'Failed',
    'Unfulfilled',
    'Web shop',
    'Germany',
    'Northline Express',
    '',
    '2026-10-19',
  ],
  [
    20447,
    'Noor Haddad',
    4,
    96.3,
    'Paid',
    'Shipped',
    'Web shop',
    'Belgium',
    'ParcelHub Europe',
    '',
    '2026-10-19',
  ],
  [
    20446,
    'Clara Whitfield',
    3,
    74.8,
    'Paid',
    'Delivered',
    'Web shop',
    'Germany',
    'Northline Express',
    '',
    '2026-10-19',
  ],
];

const emailOf = (name: string) => {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.');
  return `${slug}@mail.example`;
};

export const ORDERS: Order[] = ROWS.map(
  ([n, customer, items, total, payment, fulfilment, channel, country, carrier, coupon, date]) => ({
    id: `FC-${n}`,
    customer,
    email: emailOf(customer),
    items,
    total,
    payment,
    fulfilment,
    channel,
    country,
    carrier,
    coupon,
    date,
  })
);

// ── Extreme content ──────────────────────────────────────────────────────────

/** Orders in the shop's history: the table holds one page of them, the rest sits on a server. */
export const EXTREME_COUNT = 12_480;

/** What the status tabs would count across all of them (they add up to `EXTREME_COUNT`). */
export const EXTREME_TABS: Record<Fulfilment, number> = {
  Unfulfilled: 1204,
  Shipped: 2318,
  Delivered: 8710,
  Returned: 248,
};

/** A name and an email far longer than their columns. */
export const LONG_CUSTOMER = 'Alexandrina Konstantinopoulos-Vanderbilt';
const LONG_EMAIL =
  'alexandrina.konstantinopoulos-vanderbilt@procurement.westbrook-county-schools.example';

const INSTITUTIONS = [
  'Westbrook County Schools Procurement Office',
  'Northern Lakes Public Library Consortium',
  'Saint-Aubin Regional Education Authority',
  'Hartwell & Brandt Booksellers (Wholesale)',
  'Universität Lindenau, Zentrale Beschaffung',
  'Stichting Openbare Bibliotheken Zuid-Holland',
];

export const LONG_COUPON = 'AUTUMN-READS-2026-SCHOOLS-AND-LIBRARIES';

/** The first page of the 12,480 orders: bulk orders from institutions, in six-figure totals. */
export const EXTREME_ORDERS: Order[] = Array.from({ length: 25 }, (_, i) => {
  const customer = i === 0 ? LONG_CUSTOMER : INSTITUTIONS[i % INSTITUTIONS.length]!;
  const payment = PAYMENTS[i % 3]!;
  return {
    id: `FC-${12_480 - i}`,
    customer,
    email:
      i === 0
        ? LONG_EMAIL
        : `${customer
            .toLowerCase()
            .replace(/[^a-z]+/g, '.')
            .replace(/^\.|\.$/g, '')}@orders.example`,
    items: 480 + ((i * 137) % 1900),
    total: 100_000 + ((i * 48_271) % 880_000) + 0.5 * (i % 2),
    payment,
    // A paid order may still wait, a failed one never left.
    fulfilment: payment === 'Failed' ? 'Unfulfilled' : FULFILMENTS[(i + 1) % 3]!,
    channel: CHANNELS[i % CHANNELS.length]!,
    country: COUNTRIES[i % COUNTRIES.length]!,
    carrier: CARRIERS[i % 2]!,
    coupon: i % 3 === 0 ? LONG_COUPON : '',
    date: `2026-10-${String(29 - Math.floor(i / 3)).padStart(2, '0')}`,
  };
});
