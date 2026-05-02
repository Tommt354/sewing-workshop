import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatUAH, formatWeekRange } from '@/lib/utils';

export default async function SeamstressPaymentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) return null;

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      workItems: { include: { batch: { include: { model: true } } } },
    },
  });
  if (!payment || payment.seamstressId !== session.userId) return notFound();

  const totalQty = payment.workItems.reduce((s, w) => s + w.qty, 0);

  return (
    <div className="space-y-4">
      <Link href="/seamstress/earnings" className="text-sm text-slate-500">
        ← Назад
      </Link>

      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="text-sm opacity-90">Виплата за тиждень</div>
        <div className="text-lg font-medium mt-1">
          {formatWeekRange(payment.weekStart, payment.weekEnd)}
        </div>
        <div className="text-4xl font-bold mt-3">{formatUAH(payment.amount)}</div>
        <div className="text-sm opacity-90 mt-2">{totalQty} одиниць відшито</div>
        <div className="text-xs opacity-75 mt-1">
          Виплачено: {new Date(payment.paidAt).toLocaleDateString('uk-UA')}
        </div>
      </div>

      {payment.workItems.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 font-bold border-b">Що було відшито</div>
          {payment.workItems.map((w) => (
            <div
              key={w.id}
              className="px-4 py-3 border-b last:border-b-0 flex gap-3 items-center"
            >
              {w.batch.model.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.batch.model.photoUrl}
                  alt=""
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-slate-100" />
              )}
              <div className="flex-1">
                <div className="font-medium">{w.batch.model.name}</div>
                <div className="text-xs text-slate-500">
                  {w.size} · {w.qty} шт
                </div>
              </div>
              <div className="font-medium">{formatUAH(w.amount || 0)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
