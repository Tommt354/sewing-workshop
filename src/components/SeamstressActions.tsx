'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SeamstressActions({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/seamstresses/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);
    router.refresh();
  }

  async function resetPin() {
    const newPin = prompt('Новий PIN (4-6 цифр):');
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      if (newPin) alert('PIN має бути 4-6 цифр');
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/seamstresses/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    });
    setLoading(false);
    if (res.ok) {
      alert(`PIN змінено на: ${newPin}\nПередайте швеї.`);
    } else {
      alert('Помилка');
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={resetPin}
        disabled={loading}
        className="text-sm border px-3 py-1.5 rounded-lg hover:bg-slate-50"
      >
        Змінити PIN
      </button>
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-sm px-3 py-1.5 rounded-lg ${
          active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {active ? 'Деактивувати' : 'Активувати'}
      </button>
    </div>
  );
}
