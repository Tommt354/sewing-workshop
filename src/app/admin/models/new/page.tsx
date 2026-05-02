'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewModelPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    article: '',
    name: '',
    photoUrl: '',
    sizesText: 'S, M, L, XL',
    sewingPrice: '',
    cuttingPrice: '',
    fabricPerUnitM: '',
  });
  const [services, setServices] = useState<{ name: string; price: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addService() {
    setServices([...services, { name: '', price: '' }]);
  }

  function updateService(i: number, k: 'name' | 'price', v: string) {
    setServices(services.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  }

  function removeService(i: number) {
    setServices(services.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const sizes = form.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (sizes.length === 0) {
      setError('Вкажіть хоча б один розмір');
      setLoading(false);
      return;
    }
    const res = await fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        sizes,
        services: services.filter((s) => s.name && s.price),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Помилка');
      setLoading(false);
      return;
    }
    router.push('/admin/models');
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Нова модель</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Артикул" required>
            <input
              type="text"
              value={form.article}
              onChange={(e) => setForm({ ...form, article: e.target.value })}
              placeholder="HD-001"
              required
            />
          </Field>
          <Field label="Назва" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Худі базове"
              required
            />
          </Field>
        </div>

        <Field label="Фото (URL)">
          <input
            type="url"
            value={form.photoUrl}
            onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            placeholder="https://..."
          />
          <span className="text-xs text-slate-500 mt-1 block">
            Або залиште пусто. Завантаження файлів додамо пізніше.
          </span>
        </Field>

        <Field label="Розміри (через кому)" required>
          <input
            type="text"
            value={form.sizesText}
            onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
            placeholder="S, M, L, XL"
            required
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Ціна відшиву (₴)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.sewingPrice}
              onChange={(e) => setForm({ ...form, sewingPrice: e.target.value })}
              required
            />
          </Field>
          <Field label="Ціна крою (₴)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cuttingPrice}
              onChange={(e) => setForm({ ...form, cuttingPrice: e.target.value })}
              required
            />
          </Field>
          <Field label="Тканини (м/од.)" required>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.fabricPerUnitM}
              onChange={(e) => setForm({ ...form, fabricPerUnitM: e.target.value })}
              required
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Дод. послуги (в собівартість)</label>
            <button
              type="button"
              onClick={addService}
              className="text-sm text-brand-600"
            >
              + Додати
            </button>
          </div>
          {services.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={s.name}
                onChange={(e) => updateService(i, 'name', e.target.value)}
                placeholder="Напр. фурнітура"
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <input
                type="number"
                step="0.01"
                value={s.price}
                onChange={(e) => updateService(i, 'price', e.target.value)}
                placeholder="₴"
                className="w-24 border rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={() => removeService(i)}
                className="text-red-500 px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Збереження...' : 'Зберегти'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-5 py-2.5 rounded-lg"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1 [&>input]:w-full [&>input]:border [&>input]:rounded-lg [&>input]:px-3 [&>input]:py-2">
        {children}
      </div>
    </label>
  );
}
