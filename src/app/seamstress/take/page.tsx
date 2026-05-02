'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AvailableModel = {
  modelId: string;
  article: string;
  name: string;
  photoUrl: string | null;
  sizes: { size: string; remaining: number; batchId: string }[]; // згруповано по розмірах (FIFO)
};

export default function TakePage() {
  const router = useRouter();
  const [data, setData] = useState<AvailableModel[]>([]);
  const [step, setStep] = useState<'model' | 'size' | 'qty'>('model');
  const [chosen, setChosen] = useState<AvailableModel | null>(null);
  const [chosenSize, setChosenSize] = useState<{ size: string; remaining: number; batchId: string } | null>(null);
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/seamstress/available')
      .then((r) => r.json())
      .then((d) => setData(d.models || []));
  }, []);

  function pickModel(m: AvailableModel) {
    setChosen(m);
    setStep('size');
  }

  function pickSize(s: { size: string; remaining: number; batchId: string }) {
    setChosenSize(s);
    setQty('1');
    setStep('qty');
  }

  async function confirm() {
    if (!chosen || !chosenSize) return;
    const n = parseInt(qty, 10);
    if (!n || n < 1) {
      setError('Введіть кількість');
      return;
    }
    if (n > chosenSize.remaining) {
      setError(`Доступно лише ${chosenSize.remaining} шт`);
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/seamstress/take', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId: chosenSize.batchId, size: chosenSize.size, qty: n }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Помилка');
      setLoading(false);
      return;
    }
    router.push('/seamstress/works');
    router.refresh();
  }

  if (step === 'model') {
    return (
      <div className="space-y-3">
        <Link href="/seamstress" className="text-sm text-slate-500">← Назад</Link>
        <h1 className="text-xl font-bold">Виберіть модель</h1>
        {data.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-center text-slate-500">
            Поки немає крою в наявності
          </div>
        ) : (
          data.map((m) => (
            <button
              key={m.modelId}
              onClick={() => pickModel(m)}
              className="w-full bg-white border rounded-xl p-3 flex gap-3 items-center hover:bg-slate-50 active:scale-95 transition text-left"
            >
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt="" className="w-16 h-16 rounded object-cover" />
              ) : (
                <div className="w-16 h-16 rounded bg-slate-100" />
              )}
              <div className="flex-1">
                <div className="font-bold">{m.name}</div>
                <div className="text-xs text-slate-500">{m.article}</div>
                <div className="text-sm mt-1">
                  {m.sizes.map((s) => `${s.size}: ${s.remaining}`).join(' · ')}
                </div>
              </div>
              <div className="text-2xl text-slate-300">→</div>
            </button>
          ))
        )}
      </div>
    );
  }

  if (step === 'size' && chosen) {
    return (
      <div className="space-y-3">
        <button onClick={() => setStep('model')} className="text-sm text-slate-500">
          ← Назад
        </button>
        <div className="flex items-center gap-3">
          {chosen.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chosen.photoUrl} alt="" className="w-12 h-12 rounded object-cover" />
          )}
          <div>
            <h1 className="text-xl font-bold">{chosen.name}</h1>
            <div className="text-sm text-slate-500">{chosen.article}</div>
          </div>
        </div>
        <div className="text-sm text-slate-600">Виберіть розмір:</div>
        <div className="grid grid-cols-2 gap-3">
          {chosen.sizes.map((s) => (
            <button
              key={s.size + s.batchId}
              onClick={() => pickSize(s)}
              className="bg-white border-2 border-brand-500 text-brand-700 rounded-xl py-6 active:scale-95 transition"
            >
              <div className="text-3xl font-bold">{s.size}</div>
              <div className="text-sm mt-1">в наявності: {s.remaining}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'qty' && chosen && chosenSize) {
    const n = parseInt(qty, 10) || 0;
    return (
      <div className="space-y-4">
        <button onClick={() => setStep('size')} className="text-sm text-slate-500">
          ← Назад
        </button>
        <div className="bg-white border rounded-xl p-5 text-center">
          <div className="text-slate-500 text-sm">Беру</div>
          <div className="text-2xl font-bold mt-1">{chosen.name}</div>
          <div className="text-slate-600">розмір {chosenSize.size}</div>
          <div className="text-xs text-slate-400 mt-1">
            доступно: {chosenSize.remaining} шт
          </div>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="text-sm text-center mb-3">Скільки штук?</div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setQty(String(Math.max(1, n - 1)))}
              className="w-14 h-14 rounded-full bg-slate-200 text-2xl font-bold active:scale-95"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))}
              className="w-24 text-center text-4xl font-bold border-b-2 border-slate-300 outline-none"
            />
            <button
              onClick={() => setQty(String(Math.min(chosenSize.remaining, n + 1)))}
              className="w-14 h-14 rounded-full bg-slate-200 text-2xl font-bold active:scale-95"
            >
              +
            </button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 text-center">
            {error}
          </div>
        )}
        <button
          onClick={confirm}
          disabled={loading || n < 1}
          className="btn-big bg-green-600 text-white disabled:opacity-50"
        >
          {loading ? 'Зберігаю...' : `Взяти ${n} шт`}
        </button>
      </div>
    );
  }

  return null;
}
