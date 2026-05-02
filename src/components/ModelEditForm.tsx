'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Service = { id?: string; name: string; price: string | number };

type Props = {
  model: {
    id: string;
    article: string;
    name: string;
    photoUrl: string | null;
    sizes: string[];
    sewingPrice: number;
    cuttingPrice: number;
    fabricPerUnitM: number;
    services: { id: string; name: string; price: number }[];
  };
};

export function ModelEditForm({ model }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    article: model.article,
    name: model.name,
    photoUrl: model.photoUrl || '',
    sizesText: model.sizes.join(', '),
    sewingPrice: String(model.sewingPrice),
    cuttingPrice: String(model.cuttingPrice),
    fabricPerUnitM: String(model.fabricPerUnitM),
  });
  const [services, setServices] = useState<Service[]>(
    model.services.map((s) => ({ id: s.id, name: s.name, price: String(s.price) }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    setLoading(true);
    const sizes = form.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/admin/models/${model.id}`, {
      method: 'PUT',
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
    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-start gap-4">
          {model.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={model.photoUrl}
              alt={model.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-slate-100" />
          )}
          <div className="flex-1">
            <div className="text-2xl font-bold">{model.name}</div>
            <div className="text-sm text-slate-500">{model.article}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {model.sizes.map((s) => (
                <span key={s} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm border px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            Редагувати
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Артикул">
          <input
            type="text"
            value={form.article}
            onChange={(e) => setForm({ ...form, article: e.target.value })}
          />
        </Field>
        <Field label="Назва">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Фото (URL)">
        <input
          type="url"
          value={form.photoUrl}
          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
        />
      </Field>
      <Field label="Розміри (через кому)">
        <input
          type="text"
          value={form.sizesText}
          onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
        />
      </Field>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Ціна відшиву ₴">
          <input
            type="number"
            step="0.01"
            value={form.sewingPrice}
            onChange={(e) => setForm({ ...form, sewingPrice: e.target.value })}
          />
        </Field>
        <Field label="Ціна крою ₴">
          <input
            type="number"
            step="0.01"
            value={form.cuttingPrice}
            onChange={(e) => setForm({ ...form, cuttingPrice: e.target.value })}
          />
        </Field>
        <Field label="Тканини м/од.">
          <input
            type="number"
            step="0.001"
            value={form.fabricPerUnitM}
            onChange={(e) => setForm({ ...form, fabricPerUnitM: e.target.value })}
          />
        </Field>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Дод. послуги</span>
          <button
            onClick={() => setServices([...services, { name: '', price: '' }])}
            className="text-sm text-brand-600"
          >
            + Додати
          </button>
        </div>
        {services.map((s, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={s.name}
              onChange={(e) =>
                setServices(services.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
              }
              placeholder="Назва"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              step="0.01"
              value={s.price}
              onChange={(e) =>
                setServices(services.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x)))
              }
              placeholder="₴"
              className="w-24 border rounded-lg px-3 py-2"
            />
            <button
              onClick={() => setServices(services.filter((_, idx) => idx !== i))}
              className="text-red-500 px-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={loading}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Збереження...' : 'Зберегти'}
        </button>
        <button onClick={() => setEditing(false)} className="border px-5 py-2.5 rounded-lg">
          Скасувати
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1 [&>input]:w-full [&>input]:border [&>input]:rounded-lg [&>input]:px-3 [&>input]:py-2">
        {children}
      </div>
    </label>
  );
}
