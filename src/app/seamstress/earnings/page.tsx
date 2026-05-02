import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatUAH, formatWeekRange } from '@/lib/utils';

export default async function EarningsPage() {
  const session = await getSession();
  if (!session) return null;

  // Поточний баланс — нараховано, не виплачено
  const pending = await prisma.workItem.aggregate({
    where: { seamstressId: session.userId, status: 'ACCEPTED' },
    _sum: { amount: true, qty: true },
  });
  const pendingAmount = Number(pending._sum.amount || 0);
  const pendingQty = Number(pending._sum.qty || 0);

  // Історія виплат
  const payments = await prisma.payment.findMany({
    where: { seamstressId: session.userId },
    orderBy: { paidAt: 'desc' },
    take: 30,
  });

  // Поточні роботи (ще не виплачені)
  const currentWorks = await prisma.workItem.findMany({
    where: {
      seamstressId: session.userId,
      status: 'ACCEPTED',
    },
    include: { batch: { include: { model: true } } },
    orderBy: { acceptedAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <Link href="/seamstress" className="text-sm text-slate-500">
        ← Назад
      </Link>

      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="text-sm opacity-90">До виплати</div>
        <div className="text-4xl font-bold mt-1">{formatUAH(pendingAmount)}</div>
        {pendingQty > 0 && (
          <div className="text-sm opacity-90 mt-1">{pendingQty} одиниць</div>
        )}
      </div>

      {/* Що відшила в поточному періоді — обнулиться після виплати */}
      {currentWorks.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 font-bold border-b">Що відшила</div>
          {currentWorks.map((w) => (
            <div
              key={w.id}
              className="px-4 py-3 border-b last:border-b-0 flex justify-between text-sm"
            >
              <div>
                <div className="font-medium">{w.batch.model.name}</div>
                <div className="text-xs text-slate-500">
                  {w.size} · {w.qty} шт ·{' '}
                  {w.acceptedAt && new Date(w.acceptedAt).toLocaleDateString('uk-UA')}
                </div>
              </div>
              <div className="font-medium">{formatUAH(w.amount || 0)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Історія виплат */}
      {payments.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 font-bold border-b">Історія виплат</div>
          {payments.map((p) => (
            <Link
              key={p.id}
              href={`/seamstress/earnings/payment/${p.id}`}
              className="px-4 py-3 border-b last:border-b-0 flex justify-between items-center hover:bg-slate-50 active:scale-[0.99] transition"
            >
              <div>
                <div className="font-medium">
                  {formatWeekRange(p.weekStart, p.weekEnd)}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(p.paidAt).toLocaleDateString('uk-UA')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-bold">{formatUAH(p.amount)}</div>
                <div className="text-slate-300">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
