import { Person, Transaction, PersonBalance, OverallSummary } from '../types';

/**
 * Calculates a person's net balance strictly from their transaction history.
 * Rule: Balance is NEVER stored permanently as source of truth.
 * Balance = Sum(RECEIVABLE / They owe me) - Sum(PAYABLE / I owe them)
 * CRITICAL RULE: Settlement payments received from someone who owes you must NEVER
 * be added into "I owe them".
 */
export function calculatePersonBalance(
  person: Person,
  allTransactions: Transaction[]
): PersonBalance {
  const personTransactions = allTransactions.filter((t) => t.person_id === person.id);

  let rawReceivable = 0;
  let rawPayable = 0;
  let totalGiven = 0;
  let totalReceived = 0;
  let totalBorrowed = 0;
  let totalPaid = 0;
  let lastDate: string | undefined = undefined;

  // Sort descending by date to find latest activity
  const sorted = [...personTransactions].sort((a, b) => {
    const dateTimeA = `${a.date} ${a.time || '00:00'}`;
    const dateTimeB = `${b.date} ${b.time || '00:00'}`;
    return dateTimeB.localeCompare(dateTimeA);
  });

  if (sorted.length > 0) {
    lastDate = sorted[0].date;
  }

  for (const t of personTransactions) {
    const amt = Number(t.amount) || 0;
    const isSettlement =
      t.category === 'Settlement' ||
      t.subType === 'SETTLEMENT' ||
      t.subType === 'PAYMENT_RECEIVED' ||
      t.subType === 'PAYMENT_PAID' ||
      t.description.toLowerCase().includes('settle') ||
      t.description.toLowerCase().includes('payment');

    if (t.type === 'RECEIVABLE') {
      rawReceivable += amt;
      if (isSettlement) {
        totalPaid += amt;
      } else {
        totalGiven += amt;
      }
    } else if (t.type === 'PAYABLE') {
      rawPayable += amt;
      if (isSettlement) {
        totalReceived += amt;
      } else {
        totalBorrowed += amt;
      }
    }
  }

  const netBalance = rawReceivable - rawPayable;
  let status: PersonBalance['status'] = 'SETTLED';

  if (netBalance > 0.001) {
    status = 'THEY_OWE_ME';
  } else if (netBalance < -0.001) {
    status = 'I_OWE_THEM';
  } else {
    status = 'SETTLED';
  }

  // Never add settlement payments into what I owe them!
  // If netBalance > 0, they owe me netBalance, and I owe them 0.
  // If netBalance < 0, I owe them |netBalance|, and they owe me 0.
  // If netBalance == 0, nobody owes anyone anything.
  const receivableTotal = netBalance > 0.001 ? netBalance : 0;
  const payableTotal = netBalance < -0.001 ? Math.abs(netBalance) : 0;

  return {
    person,
    receivableTotal,
    payableTotal,
    totalGiven,
    totalReceived,
    totalBorrowed,
    totalPaid,
    netBalance,
    status,
    transactionCount: personTransactions.length,
    lastActivityDate: lastDate || person.updated_at.split('T')[0],
  };
}

export interface TransactionDisplayInfo {
  isSettlement: boolean;
  isReceivable: boolean;
  directionLabel: string;
  badgeLabel: string;
  sign: string;
  colorClass: string;
  textColorClass: string;
}

/**
 * Returns accurate user-facing labels for a transaction.
 * Ensures settlement payments received from someone NEVER display as "I owe them".
 */
export function getTransactionDisplayInfo(
  tx: Transaction,
  personName: string = 'They'
): TransactionDisplayInfo {
  const isSettlement =
    tx.category === 'Settlement' ||
    tx.subType === 'SETTLEMENT' ||
    tx.subType === 'PAYMENT_RECEIVED' ||
    tx.subType === 'PAYMENT_PAID' ||
    tx.description.toLowerCase().includes('settle') ||
    tx.description.toLowerCase().includes('payment');

  if (isSettlement) {
    if (tx.type === 'PAYABLE') {
      // Payment received from debtor -> offsets their debt to me
      return {
        isSettlement: true,
        isReceivable: false,
        directionLabel: `Payment received from ${personName}`,
        badgeLabel: 'Settlement Received',
        sign: '−',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        textColorClass: 'text-emerald-700',
      };
    } else {
      // Payment paid to creditor -> offsets my debt to them
      return {
        isSettlement: true,
        isReceivable: true,
        directionLabel: `Payment paid to ${personName}`,
        badgeLabel: 'Settlement Paid',
        sign: '+',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        textColorClass: 'text-emerald-700',
      };
    }
  }

  // Regular non-settlement transaction
  if (tx.type === 'RECEIVABLE') {
    return {
      isSettlement: false,
      isReceivable: true,
      directionLabel: `${personName} owes me`,
      badgeLabel: 'They Owe Me',
      sign: '+',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textColorClass: 'text-emerald-700',
    };
  } else {
    return {
      isSettlement: false,
      isReceivable: false,
      directionLabel: `I owe ${personName}`,
      badgeLabel: 'I Owe Them',
      sign: '−',
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
      textColorClass: 'text-rose-700',
    };
  }
}

/**
 * Calculates overall dashboard summary across all people based on their individual net balances.
 * Section 10 logic:
 * People Owe Me = Sum of positive net balances
 * I Owe People = Sum of negative net balances (positive magnitude)
 * Net Balance = People Owe Me - I Owe People
 */
export function calculateOverallSummary(
  people: Person[],
  transactions: Transaction[]
): OverallSummary {
  let peopleOweMe = 0;
  let iOwePeople = 0;
  let settledCount = 0;
  let activeCount = 0;

  for (const p of people) {
    const balance = calculatePersonBalance(p, transactions);
    if (balance.netBalance > 0.001) {
      peopleOweMe += balance.netBalance;
      activeCount++;
    } else if (balance.netBalance < -0.001) {
      iOwePeople += Math.abs(balance.netBalance);
      activeCount++;
    } else {
      settledCount++;
    }
  }

  const netBalance = peopleOweMe - iOwePeople;

  let totalReceivableTransactions = 0;
  let totalPayableTransactions = 0;
  let totalSettlementTransactions = 0;

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    const isSettlement =
      t.category === 'Settlement' ||
      t.subType === 'SETTLEMENT' ||
      t.subType === 'PAYMENT_RECEIVED' ||
      t.subType === 'PAYMENT_PAID' ||
      t.description.toLowerCase().includes('settle');

    if (isSettlement) {
      totalSettlementTransactions += amt;
    } else if (t.type === 'RECEIVABLE') {
      totalReceivableTransactions += amt;
    } else {
      // Pure borrowing/payable - NEVER add settlement payments into I owe!
      totalPayableTransactions += amt;
    }
  }

  return {
    peopleOweMe,
    iOwePeople,
    netBalance,
    totalReceivableTransactions,
    totalPayableTransactions,
    totalSettlementTransactions,
    totalPeople: people.length,
    settledCount,
    activeCount,
  };
}

/**
 * Format currency with custom symbol, e.g. "Rs. 25,000"
 */
export function formatCurrency(
  amount: number,
  symbol: string = 'Rs.',
  options: { includeSign?: boolean; absolute?: boolean } = {}
): string {
  const absVal = Math.abs(amount);
  const formattedNumber = absVal.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  if (options.absolute) {
    return `${symbol} ${formattedNumber}`;
  }

  if (options.includeSign) {
    if (amount > 0.001) {
      return `+ ${symbol} ${formattedNumber}`;
    }
    if (amount < -0.001) {
      return `- ${symbol} ${formattedNumber}`;
    }
    return `${symbol} 0`;
  }

  return `${symbol} ${formattedNumber}`;
}

/**
 * Helper to display human-friendly dates (e.g. Today, Yesterday, or full date)
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const targetDate = new Date(year, month, day);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (targetDate.getTime() === today.getTime()) {
        return 'Today';
      }
      if (targetDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      }

      return targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: targetDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
