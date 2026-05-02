'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatUAH } from '@/lib/utils';

export function PayWeekButton({
  seamstressId,
  weekStart,
  weekEnd,
  amount,
}: {
  seamstressId: string;
  weekStart: string;
  weekEnd: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function pay() {
    if (!confirm(`Виплатити ${formatUAH(amount)}?`)) return;
    setLoading(true);
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seamstressId, weekStart, weekEnd }),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json();
      alert(d.error || 'Помилка');
    }
    setLoading(false);
  }

  return (
    <button
      onClick={pay}
      disabled={loading}
      className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
    >
      {loading ? '...' : 'Виплатити'}
    </button>
  );
}
