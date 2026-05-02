'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AcceptControls({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    const res = await fetch(`/api/admin/works/${id}/accept`, { method: 'POST' });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  async function reject() {
    const note = prompt('Причина повернення на переробку:');
    if (note === null) return;
    setLoading(true);
    const res = await fetch(`/api/admin/works/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={accept}
        disabled={loading}
        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
      >
        Прийняти
      </button>
      <button
        onClick={reject}
        disabled={loading}
        className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg disabled:opacity-50"
      >
        Брак
      </button>
    </div>
  );
}
