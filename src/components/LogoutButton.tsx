'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
      className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
    >
      Вийти
    </button>
  );
}
