'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CompleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!confirm('Здати роботу адміну?')) return;
    setLoading(true);
    const res = await fetch(`/api/seamstress/works/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={complete}
      disabled={loading}
      className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
    >
      Здати
    </button>
  );
}
