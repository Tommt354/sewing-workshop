'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSeamstressPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function generatePin() {
    setForm({ ...form, pin: String(Math.floor(1000 + Math.random() * 9000)) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/seamstresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Помилка');
      setLoading(false);
      return;
    }
    alert(
      `Швея створена!\n\nТелефон: ${form.phone}\nPIN: ${form.pin}\n\nПередайте швеї ці дані.`
    );
    router.push('/admin/seamstresses');
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Нова швея</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border p-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Ім'я</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder="Марія Іванівна"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Телефон</span>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder="+380501234567"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">PIN-код (4 цифри)</span>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
              className="flex-1 border rounded-lg px-3 py-2 text-center text-lg tracking-widest"
              placeholder="1234"
            />
            <button
              type="button"
              onClick={generatePin}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50"
            >
              Згенерувати
            </button>
          </div>
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Створення...' : 'Створити'}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-5 py-2.5 rounded-lg">
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}
