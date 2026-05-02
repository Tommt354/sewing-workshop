import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatUAH, formatWeekRange } from '@/lib/utils';

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      seamstress: true,
      workItems: { include: { batch: { include: { model: true } } } },
    },
  });
  if (!payment) return notFound();

  const totalQty = payment.workItems.reduce((s, w) => s + w.qty, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/payments" className="text-sm text-slate-500">
        ← До виплат
      </Link>

      <div className="bg-white border rounded-xl p-5">
        <div className="text-sm text-slate-500">Виплата</div>
        <div className="text-2xl font-bold mt-1">{payment.seamstress.name}</div>
        <div className="text-slate-600">
          {formatWeekRange(payment.weekStart, payment.weekEnd)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Виплачено: {new Date(payment.paidAt).toLocaleString('uk-UA')}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500">Сума</div>
            <div className="text-2xl font-bold">{formatUAH(payment.amount)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Одиниць відшито</div>
            <div className="text-2xl font-bold">{totalQty} шт</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">Що увійшло у виплату</div>
        {payment.workItems.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Немає робіт</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Дата</th>
                <th className="text-left px-4 py-3">Модель</th>
                <th className="text-center px-4 py-3">Розмір</th>
                <th className="text-right px-4 py-3">К-ть</th>
                <th className="text-right px-4 py-3">Сума</th>
              </tr>
            </thead>
            <tbody>
              {payment.workItems.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 text-slate-600">
                    {w.acceptedAt && new Date(w.acceptedAt).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{w.batch.model.name}</div>
                    <div className="text-xs text-slate-400">{w.batch.model.article}</div>
                  </td>
                  <td className="px-4 py-3 text-center">{w.size}</td>
                  <td className="px-4 py-3 text-right">{w.qty}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatUAH(w.amount || 0)}
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
