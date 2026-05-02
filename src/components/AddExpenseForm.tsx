'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddExpenseForm() {
  const router = useRouter();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [form, setForm] = useState({
    type: 'RENT' as 'RENT' | 'UTILITIES' | 'OTHER',
    amount: '',
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    note: '',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ ...form, amount: '', note: '' });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-5 space-y-3">
      <div className="grid sm:grid-cols-5 gap-3">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          className="border rounded-lg px-3 py-2"
        >
          <option value="RENT">Оренда</option>
          <option value="UTILITIES">Комуналка</option>
          <option value="OTHER">Інше</option>
        </select>
        <input
          type="number"
          step="0.01"
          required
          placeholder="Сума ₴"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="date"
          required
          value={form.periodStart}
          onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="date"
          required
          value={form.periodEnd}
          onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="text"
          placeholder="Примітка"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
      </div>
      <button
        disabled={loading}
        className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        Додати витрату
      </button>
    </form>
  );
}
