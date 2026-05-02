import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatUAH, formatPhone, formatWeekRange } from '@/lib/utils';
import { SeamstressActions } from '@/components/SeamstressActions';

export default async function SeamstressDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.role !== 'SEAMSTRESS') return notFound();

  const pending = await prisma.workItem.aggregate({
    where: { seamstressId: user.id, status: 'ACCEPTED' },
    _sum: { amount: true },
  });
  const pendingAmount = Number(pending._sum.amount || 0);

  const totalEarned = await prisma.workItem.aggregate({
    where: { seamstressId: user.id, status: { in: ['ACCEPTED', 'PAID'] } },
    _sum: { amount: true, qty: true },
  });

  const inWork = await prisma.workItem.count({
    where: { seamstressId: user.id, status: { in: ['TAKEN', 'COMPLETED', 'REJECTED'] } },
  });

  const payments = await prisma.payment.findMany({
    where: { seamstressId: user.id },
    orderBy: { paidAt: 'desc' },
    take: 20,
  });

  const recentWorks = await prisma.workItem.findMany({
    where: { seamstressId: user.id },
    include: { batch: { include: { model: true } } },
    orderBy: { takenAt: 'desc' },
    take: 30,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/seamstresses" className="text-sm text-slate-500">
        ← До швей
      </Link>

      <div className="bg-white border rounded-xl p-5 flex flex-wrap gap-4 items-center">
        <div className="flex-1">
          <div className="text-2xl font-bold">{user.name}</div>
          <div className="text-sm text-slate-500">{formatPhone(user.phone)}</div>
        </div>
        <SeamstressActions userId={user.id} active={user.active} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card label="До виплати" value={formatUAH(pendingAmount)} />
        <Card
          label="Всього відшила"
          value={`${totalEarned._sum.qty || 0} шт`}
          sub={formatUAH(totalEarned._sum.amount || 0)}
        />
        <Card label="Зараз в роботі" value={`${inWork} робіт`} />
      </div>

      {payments.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b font-bold">Історія виплат</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Тиждень</th>
                <th className="text-left px-4 py-3">Дата виплати</th>
                <th className="text-right px-4 py-3">Сума</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{formatWeekRange(p.weekStart, p.weekEnd)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(p.paidAt).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{formatUAH(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">Останні роботи</div>
        {recentWorks.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Поки немає робіт</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Дата</th>
                <th className="text-left px-4 py-3">Модель</th>
                <th className="text-right px-4 py-3">К-ть</th>
                <th className="text-center px-4 py-3">Статус</th>
                <th className="text-right px-4 py-3">Сума</th>
              </tr>
            </thead>
            <tbody>
              {recentWorks.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(w.takenAt).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3">
                    {w.batch.model.name} <span className="text-slate-400">({w.size})</span>
                  </td>
                  <td className="px-4 py-3 text-right">{w.qty}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {w.amount ? formatUAH(w.amount) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    TAKEN: { text: 'в роботі', cls: 'bg-blue-100 text-blue-700' },
    COMPLETED: { text: 'на прийом', cls: 'bg-amber-100 text-amber-700' },
    ACCEPTED: { text: 'прийнято', cls: 'bg-green-100 text-green-700' },
    REJECTED: { text: 'брак', cls: 'bg-red-100 text-red-700' },
    PAID: { text: 'виплачено', cls: 'bg-slate-100 text-slate-600' },
  };
  const m = map[status] || { text: status, cls: 'bg-slate-100' };
  return <span className={`text-xs px-2 py-0.5 rounded ${m.cls}`}>{m.text}</span>;
}
