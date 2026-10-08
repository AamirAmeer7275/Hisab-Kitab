import { Person, Transaction, AppSettings } from '../types';

const STORAGE_KEY_PEOPLE = 'hisab_kitab_people_v2';
const STORAGE_KEY_TRANSACTIONS = 'hisab_kitab_transactions_v2';
const STORAGE_KEY_SETTINGS = 'hisab_kitab_settings_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  currencyCode: 'PKR',
  currencySymbol: 'Rs.',
  dateFormat: 'YYYY-MM-DD',
  theme: 'light',
  pinLockEnabled: false,
  autoLockMinutes: 5,
};

// Pastel colors for avatar indicators
const AVATAR_COLORS = [
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-500 text-white',
];

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const SAMPLE_PEOPLE: Person[] = [
  {
    id: 'p-sufyan',
    name: 'Sufyan',
    phone: '+92 300 1234567',
    notes: 'Friend from university',
    avatarColor: 'bg-emerald-500 text-white',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-08T09:30:00Z',
  },
  {
    id: 'p-munawar',
    name: 'Munawar',
    phone: '+92 321 7654321',
    notes: 'Office colleague',
    avatarColor: 'bg-blue-500 text-white',
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-08T08:15:00Z',
  },
  {
    id: 'p-shan',
    name: 'Shan',
    phone: '+92 333 9876543',
    notes: 'Project freelancer partner',
    avatarColor: 'bg-purple-500 text-white',
    created_at: '2026-10-03T14:20:00Z',
    updated_at: '2026-10-07T18:00:00Z',
  },
  {
    id: 'p-khawar',
    name: 'Khawar',
    phone: '+92 345 5551234',
    notes: 'Flatmate - Apartment rent & bills',
    avatarColor: 'bg-rose-500 text-white',
    created_at: '2026-10-04T09:00:00Z',
    updated_at: '2026-10-06T12:00:00Z',
  },
  {
    id: 'p-umair',
    name: 'Umair',
    phone: '+92 312 4443322',
    notes: 'Gym buddy',
    avatarColor: 'bg-amber-500 text-white',
    created_at: '2026-10-05T15:00:00Z',
    updated_at: '2026-10-05T15:00:00Z',
  },
  {
    id: 'p-ahmad',
    name: 'Ahmad',
    phone: '+92 301 8889900',
    notes: 'School friend',
    avatarColor: 'bg-teal-500 text-white',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-10-04T16:00:00Z',
  },
  {
    id: 'p-mobeen',
    name: 'Mobeen',
    phone: '+92 311 2223344',
    notes: 'Cousin',
    avatarColor: 'bg-indigo-500 text-white',
    created_at: '2026-10-07T12:00:00Z',
    updated_at: '2026-10-07T12:00:00Z',
  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // Sufyan: +1,000 + 500 - 300 - 200 = +1,000 (Exactly Section 9 example)
  {
    id: 't-sufyan-1',
    person_id: 'p-sufyan',
    amount: 1000,
    type: 'RECEIVABLE',
    description: 'Dinner',
    category: 'Food',
    date: '2026-10-08',
    time: '20:30',
    note: 'Paid together at restaurant',
    created_at: '2026-10-08T09:00:00Z',
    updated_at: '2026-10-08T09:00:00Z',
  },
  {
    id: 't-sufyan-2',
    person_id: 'p-sufyan',
    amount: 500,
    type: 'RECEIVABLE',
    description: 'Shopping groceries',
    category: 'Shopping',
    date: '2026-10-07',
    time: '18:15',
    note: 'Shared supermart bill',
    created_at: '2026-10-07T18:15:00Z',
    updated_at: '2026-10-07T18:15:00Z',
  },
  {
    id: 't-sufyan-3',
    person_id: 'p-sufyan',
    amount: 300,
    type: 'PAYABLE',
    description: 'Cash payment',
    category: 'Cash',
    date: '2026-10-06',
    time: '14:00',
    note: 'Cash payment received from Sufyan',
    created_at: '2026-10-06T14:00:00Z',
    updated_at: '2026-10-06T14:00:00Z',
  },
  {
    id: 't-sufyan-4',
    person_id: 'p-sufyan',
    amount: 200,
    type: 'PAYABLE',
    description: 'Previous payment',
    category: 'Settlement',
    date: '2026-10-05',
    time: '11:00',
    note: 'Adjusted against fuel share',
    created_at: '2026-10-05T11:00:00Z',
    updated_at: '2026-10-05T11:00:00Z',
  },

  // Munawar: +2,500 (Owes me Rs. 2,500)
  {
    id: 't-munawar-1',
    person_id: 'p-munawar',
    amount: 2500,
    type: 'RECEIVABLE',
    description: 'Office lunch & fuel contribution',
    category: 'Food',
    date: '2026-10-08',
    time: '13:00',
    note: 'Will clear at month end salary',
    created_at: '2026-10-08T08:15:00Z',
    updated_at: '2026-10-08T08:15:00Z',
  },

  // Shan: +4,000 (Owes me Rs. 4,000)
  {
    id: 't-shan-1',
    person_id: 'p-shan',
    amount: 4000,
    type: 'RECEIVABLE',
    description: 'Hosting & domain payment',
    category: 'Internet',
    date: '2026-10-07',
    time: '16:45',
    note: 'Cloud server renewal share',
    created_at: '2026-10-07T16:45:00Z',
    updated_at: '2026-10-07T16:45:00Z',
  },

  // Khawar: -1,200 (I owe Khawar Rs. 1,200)
  {
    id: 't-khawar-1',
    person_id: 'p-khawar',
    amount: 1200,
    type: 'PAYABLE',
    description: 'Electricity bill share',
    category: 'Bills',
    date: '2026-10-06',
    time: '10:00',
    note: 'Khawar paid full monthly power bill',
    created_at: '2026-10-06T10:00:00Z',
    updated_at: '2026-10-06T10:00:00Z',
  },

  // Umair: -500 (I owe Umair Rs. 500)
  {
    id: 't-umair-1',
    person_id: 'p-umair',
    amount: 500,
    type: 'PAYABLE',
    description: 'Gym shake & protein bar',
    category: 'Food',
    date: '2026-10-05',
    time: '19:30',
    note: 'Umair bought supplies',
    created_at: '2026-10-05T19:30:00Z',
    updated_at: '2026-10-05T19:30:00Z',
  },

  // Ahmad: +1,500 - 1,500 = 0 (Settled)
  {
    id: 't-ahmad-1',
    person_id: 'p-ahmad',
    amount: 1500,
    type: 'RECEIVABLE',
    description: 'Internet bill share',
    category: 'Internet',
    date: '2026-10-01',
    time: '12:00',
    note: 'Fiber optic bill',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
  },
  {
    id: 't-ahmad-2',
    person_id: 'p-ahmad',
    amount: 1500,
    type: 'PAYABLE',
    description: 'Full settlement payment',
    category: 'Settlement',
    date: '2026-10-04',
    time: '16:00',
    note: 'Received via Bank transfer',
    created_at: '2026-10-04T16:00:00Z',
    updated_at: '2026-10-04T16:00:00Z',
  },
];

// Load People
export function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PEOPLE);
    if (!raw) {
      // First run: initialize with sample data
      localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(SAMPLE_PEOPLE));
      return SAMPLE_PEOPLE;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading people:', e);
    return SAMPLE_PEOPLE;
  }
}

// Save People
export function savePeople(people: Person[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
  } catch (e) {
    console.error('Error saving people:', e);
  }
}

// Load Transactions
export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!raw) {
      // First run: initialize with sample transactions
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(SAMPLE_TRANSACTIONS));
      return SAMPLE_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading transactions:', e);
    return SAMPLE_TRANSACTIONS;
  }
}

// Save Transactions
export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions:', e);
  }
}

// Load Settings
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

// Save Settings
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// Export JSON
export function exportDataJSON(): string {
  const data = {
    app: 'Hisab-Kitab Personal Ledger',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    people: loadPeople(),
    transactions: loadTransactions(),
  };
  return JSON.stringify(data, null, 2);
}

// Export CSV for Excel/Sheets
export function exportDataCSV(): string {
  const people = loadPeople();
  const transactions = loadTransactions();
  const peopleMap = new Map(people.map((p) => [p.id, p.name]));

  const headers = ['Transaction ID', 'Person Name', 'Type', 'Direction', 'Amount', 'Description', 'Category', 'Date', 'Time', 'Notes'];
  const rows = transactions.map((t) => [
    t.id,
    `"${(peopleMap.get(t.person_id) || 'Unknown').replace(/"/g, '""')}"`,
    t.type,
    t.type === 'RECEIVABLE' ? 'They owe me' : 'I owe them',
    t.amount,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.date,
    t.time || '',
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Import JSON
export interface ImportResult {
  success: boolean;
  message: string;
  peopleCount?: number;
  transactionsCount?: number;
}

export function importDataJSON(jsonStr: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.people) || !Array.isArray(parsed.transactions)) {
      return {
        success: false,
        message: 'Invalid backup file format. Must contain valid people and transactions data.',
      };
    }

    // Validate structure
    const validPeople: Person[] = parsed.people.filter(
      (p: any) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0
    );

    const validTransactions: Transaction[] = parsed.transactions.filter(
      (t: any) =>
        t &&
        typeof t.id === 'string' &&
        typeof t.person_id === 'string' &&
        typeof t.amount === 'number' &&
        (t.type === 'RECEIVABLE' || t.type === 'PAYABLE')
    );

    savePeople(validPeople);
    saveTransactions(validTransactions);

    if (parsed.settings) {
      saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
    }

    return {
      success: true,
      message: `Successfully restored ${validPeople.length} people and ${validTransactions.length} transactions.`,
      peopleCount: validPeople.length,
      transactionsCount: validTransactions.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to import: ${err.message || 'Corrupted JSON file'}`,
    };
  }
}

// Reset to Sample Data
export function resetToSampleData(): void {
  savePeople(SAMPLE_PEOPLE);
  saveTransactions(SAMPLE_TRANSACTIONS);
  saveSettings(DEFAULT_SETTINGS);
}

// Clear all data
export function clearAllData(): void {
  savePeople([]);
  saveTransactions([]);
}
