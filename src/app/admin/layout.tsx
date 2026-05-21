import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';
import { Logo } from '@/components/Logo';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  const nav = [
    { href: '/admin', label: 'Залишки' },
    { href: '/admin/cutting/new', label: 'Додати крій' },
    { href: '/admin/in-progress', label: 'В роботі' },
    { href: '/admin/history', label: 'Історія' },
    { href: '/admin/models', label: 'Моделі' },
    { href: '/admin/seamstresses', label: 'Швеї' },
    { href: '/admin/payments', label: 'Виплати' },
    { href: '/admin/fabrics', label: 'Тканини' },
    { href: '/admin/expenses', label: 'Витрати' },
    { href: '/admin/analytics', label: 'Аналітика' },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div className="font-bold text-lg">Швейний цех</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">{session.name}</span>
            <LogoutButton />
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 whitespace-nowrap"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
