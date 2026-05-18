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
    colors: string[];
    note: string | null;
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
    note: model.note || '',
    sewingPrice: String(model.sewingPrice),
    cuttingPrice: String(model.cuttingPrice),
    fabricPerUnitM: String(model.fabricPerUnitM),
  });
  const [colors, setColors] = useState<string[]>([...model.colors]);
  const [newColor, setNewColor] = useState('');
  const [services, setServices] = useState<Service[]>(
    model.services.map((s) => ({ id: s.id, name: s.name, price: String(s.price) }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addColor() {
    const c = newColor.trim();
    if (!c || colors.includes(c)) {
      setNewColor('');
      return;
    }
    setColors([...colors, c]);
    setNewColor('');
  }

  function removeColor(c: string) {
    setColors(colors.filter((x) => x !== c));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Фото більше 5 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

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
        colors,
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
            {model.colors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {model.colors.map((c) => (
                  <span
                    key={c}
                    className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {model.note && (
              <div className="mt-3 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded p-2">
                <span className="font-medium">Примітка:</span> {model.note}
              </div>
            )}
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

      <Field label="Фото">
        <div className="space-y-2">
          {form.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.photoUrl}
              alt=""
              className="w-32 h-32 rounded-lg object-cover border"
            />
          )}
          <div className="flex gap-2 items-center">
            <label className="cursor-pointer border px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
              {form.photoUrl ? 'Замінити' : 'Завантажити'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
            {form.photoUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, photoUrl: '' })}
                className="text-sm text-red-500"
              >
                Видалити
              </button>
            )}
          </div>
        </div>
      </Field>

      <Field label="Розміри (через кому)">
        <input
          type="text"
          value={form.sizesText}
          onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
        />
      </Field>

      <div>
        <label className="text-sm font-medium block mb-2">Кольори</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {colors.map((c) => (
            <span
              key={c}
              className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {c}
              <button
                type="button"
                onClick={() => removeColor(c)}
                className="text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addColor();
              }
            }}
            placeholder="Додати колір"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addColor}
            className="bg-slate-200 px-3 py-2 rounded-lg text-sm"
          >
            +
          </button>
        </div>
      </div>

      <Field label="Примітка для швей">
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Особливості пошиття..."
          className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
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
                setServices(
                  services.map((x, idx) =>
                    idx === i ? { ...x, name: e.target.value } : x
                  )
                )
              }
              placeholder="Назва"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              step="0.01"
              value={s.price}
              onChange={(e) =>
                setServices(
                  services.map((x, idx) =>
                    idx === i ? { ...x, price: e.target.value } : x
                  )
                )
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
