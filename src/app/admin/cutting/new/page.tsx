'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Model = {
  id: string;
  article: string;
  name: string;
  sizes: string[];
  photoUrl: string | null;
};

export default function NewCuttingPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Model | null>(null);
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/models/list')
      .then((r) => r.json())
      .then((d) => setModels(d.models || []));
  }, []);

  function pickModel(m: Model) {
    setSelected(m);
    const init: Record<string, string> = {};
    m.sizes.forEach((s) => (init[s] = ''));
    setQtys(init);
  }

  async function submit() {
    if (!selected) return;
    setError('');
    const sizes = Object.entries(qtys)
      .map(([size, q]) => ({ size, qty: parseInt(q, 10) || 0 }))
      .filter((x) => x.qty > 0);
    if (sizes.length === 0) {
      setError('Введіть хоча б одну кількість');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/admin/cutting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: selected.id, sizes, note }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Помилка');
      setLoading(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  const filtered = models.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.article.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Додати крій</h1>
        <Link href="/admin/models/new" className="text-sm text-brand-600">
          + Нова модель
        </Link>
      </div>

      {!selected ? (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук моделі..."
            className="w-full border rounded-lg px-4 py-2"
          />
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {models.length === 0
                ? 'Спочатку створіть модель'
                : 'Нічого не знайдено'}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickModel(m)}
                  className="text-left border rounded-lg p-3 hover:border-brand-500 hover:bg-brand-50 transition flex gap-3"
                >
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photoUrl}
                      alt=""
                      className="w-14 h-14 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-slate-100 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.article}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {m.sizes.join(', ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center gap-3">
            {selected.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photoUrl}
                alt=""
                className="w-16 h-16 rounded object-cover"
              />
            )}
            <div>
              <div className="font-bold text-lg">{selected.name}</div>
              <div className="text-sm text-slate-500">{selected.article}</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-auto text-sm text-slate-500"
            >
              Змінити
            </button>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Кількості по розмірах</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selected.sizes.map((s) => (
                <label key={s} className="block">
                  <span className="text-sm text-slate-600">{s}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={qtys[s] || ''}
                    onChange={(e) => setQtys({ ...qtys, [s]: e.target.value })}
                    placeholder="0"
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-lg text-center"
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Примітка (необов'язково)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={loading}
              className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Зберегти партію'}
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="border px-5 py-2.5 rounded-lg"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
