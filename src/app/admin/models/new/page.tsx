'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_COLORS = ['Чорний', 'Білий', 'Графіт'];

export default function NewModelPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    article: '',
    name: '',
    photoUrl: '',
    sizesText: 'S, M, L, XL',
    note: '',
    sewingPrice: '',
    cuttingPrice: '',
    fabricPerUnitM: '',
  });
  const [colors, setColors] = useState<string[]>([...DEFAULT_COLORS]);
  const [newColor, setNewColor] = useState('');
  const [services, setServices] = useState<{ name: string; price: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function addColor() {
    const c = newColor.trim();
    if (!c) return;
    if (colors.includes(c)) {
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
      setError('Фото більше 5 МБ — зменшіть розмір');
      return;
    }
    setUploadingPhoto(true);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, photoUrl: reader.result as string });
      setUploadingPhoto(false);
    };
    reader.onerror = () => {
      setError('Не вдалося завантажити фото');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  }

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

        <Field label="Фото">
          <div className="space-y-2">
            {form.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photoUrl}
                alt="Превʼю"
                className="w-32 h-32 rounded-lg object-cover border"
              />
            )}
            <div className="flex gap-2 items-center">
              <label className="cursor-pointer border px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
                {uploadingPhoto
                  ? 'Завантаження...'
                  : form.photoUrl
                  ? 'Замінити фото'
                  : 'Завантажити фото'}
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

        <Field label="Розміри (через кому)" required>
          <input
            type="text"
            value={form.sizesText}
            onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
            placeholder="S, M, L, XL"
            required
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
              + Додати
            </button>
          </div>
        </div>

        <Field label="Примітка для швей (необовʼязково)">
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Особливості пошиття, нюанси..."
            className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
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
