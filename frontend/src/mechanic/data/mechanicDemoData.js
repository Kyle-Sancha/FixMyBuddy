export const mechanicProfile = {
  id: 'PRO-0042',
  name: 'Miguel Santos',
  initials: 'MS',
  email: 'miguel.santos@example.com',
  mobile: '+63 917 555 0142',
  identityVerified: true,
  credentials: ['TESDA NC II'],
  online: true,
  serviceRadiusKm: 15,
  workingHours: 'Mon–Sat · 8 AM–6 PM',
  flatbedCapability: 'FMB-08',
};

export const mechanicServiceCapabilities = [
  'Battery',
  'Flat tire',
  'Overheating',
  'Fuel delivery',
  'Lockout',
  'Not starting',
  'Towing',
];

export const mechanicJobs = [
  {
    id: 'FMB-1042',
    type: 'repair',
    service: 'Battery',
    status: 'New offer',
    customer: {
      name: 'Alex Reyes',
      initials: 'AR',
      verified: true,
    },
    vehicle: {
      make: 'Toyota',
      model: 'Vios',
      year: 2021,
      color: 'Silver',
      plate: 'ABC 1234',
    },
    issue: 'Clicking, won’t start',
    location: {
      name: 'Mabolo Barangay Hall',
      address: 'Mabolo Road, Naga City',
      distanceKm: 2.4,
      etaMinutes: 12,
    },
    visitEstimate: 450,
    estimatedNet: 405,
    expiresInSeconds: 42,
    scheduledAt: null,
  },
  {
    id: 'FMB-1051',
    type: 'repair',
    service: 'Battery check',
    status: 'Scheduled',
    customer: {
      name: 'Alex Reyes',
      initials: 'AR',
      verified: true,
    },
    vehicle: {
      make: 'Toyota',
      model: 'Vios',
      year: 2021,
      color: 'Silver',
      plate: 'ABC 1234',
    },
    issue: 'Battery check',
    location: {
      name: 'Mabolo Barangay Hall',
      address: 'Mabolo Road, Naga City',
      distanceKm: 2.4,
      etaMinutes: null,
    },
    visitEstimate: 450,
    estimatedNet: 405,
    expiresInSeconds: null,
    scheduledAt: '2026-10-21T09:00:00+08:00',
  },
  {
    id: 'TOW-1043',
    type: 'towing',
    service: 'Towing',
    status: 'Handover',
    customer: {
      name: 'Alex Reyes',
      initials: 'AR',
      verified: true,
    },
    vehicle: {
      make: 'Toyota',
      model: 'Vios',
      year: 2021,
      color: 'Silver',
      plate: 'ABC 1234',
    },
    issue: 'Vehicle tow',
    location: {
      name: 'Naga AutoCare',
      address: 'Panganiban Drive, Naga City',
      distanceKm: 5,
      etaMinutes: null,
    },
    visitEstimate: 1500,
    estimatedNet: 1350,
    expiresInSeconds: null,
    scheduledAt: null,
  },
];

export const mechanicQuotes = {
  'FMB-1042': {
    version: 2,
    status: 'Customer approved',
    items: [
      { id: 'callout', label: 'Call-out & diagnosis', amount: 450 },
      { id: 'battery', label: '12V battery · 1 unit', amount: 3500 },
      { id: 'labor', label: 'Installation labor', amount: 450 },
      { id: 'terminal', label: 'Terminal · approved extra', amount: 200 },
    ],
    customerTotal: 4600,
    platformFeeRate: 0.1,
    estimatedNet: 4140,
    repairTime: '30–40 minutes',
    warranty: 'Battery: 12 months. Installation: 30 days.',
    reasonForExtraWork: 'Battery terminal is corroded and brittle.',
  },
};

export const mechanicJobProgress = {
  'FMB-1042': [
    { id: 'quote', label: 'Quote approved · 9:56 AM', status: 'done' },
    { id: 'battery', label: 'Battery installed', status: 'done' },
    { id: 'terminal', label: 'Terminal fitted · Extra approved', status: 'done' },
    { id: 'test', label: 'Final voltage and starting test', status: 'current' },
    { id: 'handover', label: 'Customer handover', status: 'upcoming' },
  ],
};

export const mechanicUpdates = [
  {
    id: 'payment-FMB-1042',
    type: 'payment',
    title: 'Payment received',
    time: '10:38 AM',
    jobId: 'FMB-1042',
    message: '₱4,600 collected. Net payout ₱4,140 is pending.',
  },
  {
    id: 'extra-FMB-1042',
    type: 'approval',
    title: 'Extra work approved',
    time: '10:08 AM',
    jobId: 'FMB-1042',
    message: 'Alex approved the ₱200 terminal extra. Revised total: ₱4,600.',
  },
  {
    id: 'schedule-FMB-1051',
    type: 'schedule',
    title: 'Scheduled job reminder',
    time: '21 Oct',
    jobId: 'FMB-1051',
    message: 'Alex · Battery check at 9:00 AM.',
  },
];

export const mechanicEarnings = {
  currency: 'PHP',
  grossCollectedToday: 4600,
  platformFeeRate: 0.1,
  netEarningsToday: 4140,
  completedJobsToday: 1,
  nextPayout: {
    date: '2026-10-20',
    status: 'Pending',
    destination: 'GCash · •••• 8821',
    amount: 4140,
  },
  history: [
    {
      jobId: 'FMB-1042',
      service: 'Battery',
      date: '2026-10-19',
      status: 'Completed',
      gross: 4600,
      net: 4140,
    },
    {
      jobId: 'TOW-1036',
      service: 'Towing',
      date: '2026-10-12',
      status: 'Completed',
      gross: 1500,
      net: 1350,
    },
    {
      jobId: 'FMB-1051',
      service: 'Battery check',
      date: '2026-10-21',
      status: 'Scheduled',
      gross: 450,
      net: 405,
    },
  ],
};