import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatUAH } from '@/lib/utils';

export default async function SeamstressHome() {
  const session = await getSession();
  if (!session) return null;

  // Скільки до виплати (статус ACCEPTED, ще не PAID)
  const pending = await prisma.workItem.aggregate({
    where: { seamstressId: session.userId, status: 'ACCEPTED' },
    _sum: { amount: true },
  });
  const pendingAmount = Number(pending._sum.amount || 0);

  // Скільки в роботі
  const inProgress = await prisma.workItem.count({
    where: { seamstressId: session.userId, status: { in: ['TAKEN', 'COMPLETED'] } },
  });

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="text-sm opacity-90">До виплати</div>
        <div className="text-4xl font-bold mt-1">{formatUAH(pendingAmount)}</div>
        {inProgress > 0 && (
          <div className="text-sm opacity-90 mt-2">В роботі: {inProgress} шт</div>
        )}
      </div>

      <Link href="/seamstress/take" className="block">
        <div className="btn-big bg-green-600 text-white text-center">
          🧵 Взяти крій
        </div>
      </Link>

      <Link href="/seamstress/works" className="block">
        <div className="btn-big bg-white border-2 border-brand-500 text-brand-700 text-center">
          📋 Мої роботи
        </div>
      </Link>

      <Link href="/seamstress/earnings" className="block">
        <div className="btn-big bg-white border-2 border-slate-300 text-slate-700 text-center">
          💰 Мій заробіток
        </div>
      </Link>
    </div>
  );
}
