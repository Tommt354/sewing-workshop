'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddFabricForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', meters: '', pricePerMeter: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/fabrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: '', meters: '', pricePerMeter: '' });
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        + Додати тканину
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-5 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          type="text"
          required
          placeholder="Назва (двунитка, футер...)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="number"
          step="0.1"
          required
          placeholder="Метрів"
          value={form.meters}
          onChange={(e) => setForm({ ...form, meters: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="number"
          step="0.01"
          required
          placeholder="Ціна за метр (₴)"
          value={form.pricePerMeter}
          onChange={(e) => setForm({ ...form, pricePerMeter: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Зберегти
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border px-4 py-2 rounded-lg text-sm"
        >
          Скасувати
        </button>
      </div>
    </form>
  );
}
