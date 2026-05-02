import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatUAH, getWeekStart, getWeekEnd, formatWeekRange } from '@/lib/utils';
import { PayWeekButton } from '@/components/PayWeekButton';

export default async function PaymentsPage() {
  // Прийняті за поточний тиждень — групуємо по швеях
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  const accepted = await prisma.workItem.findMany({
    where: {
      status: 'ACCEPTED',
      acceptedAt: { gte: weekStart, lte: weekEnd },
    },
    include: { seamstress: true, batch: { include: { model: true } } },
  });

  type Group = {
    seamstressId: string;
    name: string;
    items: typeof accepted;
    total: number;
  };
  const groups = new Map<string, Group>();
  for (const w of accepted) {
    let g = groups.get(w.seamstressId);
    if (!g) {
      g = { seamstressId: w.seamstressId, name: w.seamstress.name, items: [], total: 0 };
      groups.set(w.seamstressId, g);
    }
    g.items.push(w);
    g.total += Number(w.amount || 0);
  }

  // Останні 20 виплат
  const recentPayments = await prisma.payment.findMany({
    include: { seamstress: true },
    orderBy: { paidAt: 'desc' },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Виплати</h1>
        <Link
          href="/admin/seamstresses"
          className="text-sm text-brand-600 border border-brand-600 px-4 py-2 rounded-lg hover:bg-brand-50"
        >
          Аналітика по швеях →
        </Link>
      </div>

      {/* Тижневі виплати */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">
          Тиждень {formatWeekRange(weekStart, weekEnd)}
        </div>
        {groups.size === 0 ? (
          <div className="p-6 text-center text-slate-500">
            Немає робіт за цей тиждень
          </div>
        ) : (
          <div className="divide-y">
            {Array.from(groups.values()).map((g) => (
              <div key={g.seamstressId} className="p-4 flex flex-wrap gap-3 items-center">
                <Link
                  href={`/admin/seamstresses/${g.seamstressId}`}
                  className="flex-1 hover:text-brand-600"
                >
                  <div className="font-bold">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.items.length} робіт</div>
                </Link>
                <div className="font-bold text-lg">{formatUAH(g.total)}</div>
                <PayWeekButton
                  seamstressId={g.seamstressId}
                  weekStart={weekStart.toISOString()}
                  weekEnd={weekEnd.toISOString()}
                  amount={g.total}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Останні виплати */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">Останні виплати</div>
        {recentPayments.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Поки виплат не було</div>
        ) : (
          <div className="divide-y">
            {recentPayments.map((p) => (
              <Link
                key={p.id}
                href={`/admin/payments/${p.id}`}
                className="p-4 flex flex-wrap gap-3 items-center hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="font-medium">{p.seamstress.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatWeekRange(p.weekStart, p.weekEnd)} ·{' '}
                    {new Date(p.paidAt).toLocaleDateString('uk-UA')}
                  </div>
                </div>
                <div className="font-bold">{formatUAH(p.amount)}</div>
                <div className="text-slate-300">→</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
