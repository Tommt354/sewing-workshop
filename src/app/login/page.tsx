'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Помилка входу');
        setLoading(false);
        return;
      }
      router.push(data.role === 'ADMIN' ? '/admin' : '/seamstress');
      router.refresh();
    } catch (err) {
      setError('Помилка з`єднання');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-5"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Швейний цех</h1>
          <p className="text-sm text-slate-500 mt-1">Вхід в особистий кабінет</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Номер телефону</span>
          <input
            type="tel"
            inputMode="tel"
            placeholder="+380..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full text-lg border border-slate-300 rounded-xl px-4 py-3"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">PIN-код</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full text-2xl text-center tracking-widest border border-slate-300 rounded-xl px-4 py-3"
            required
          />
        </label>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-big bg-brand-600 text-white disabled:opacity-50"
        >
          {loading ? 'Вхід...' : 'Увійти'}
        </button>
      </form>
    </div>
  );
}
