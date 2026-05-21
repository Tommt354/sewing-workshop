import Link from 'next/link';
import { requireSeamstress } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';
import { Logo } from '@/components/Logo';

export default async function SeamstressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSeamstress();
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/seamstress" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-bold">Привіт, {session.name}!</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-5">{children}</main>
    </div>
  );
}
