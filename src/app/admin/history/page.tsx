import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';

const STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  TAKEN: { text: 'в роботі', cls: 'bg-blue-100 text-blue-700' },
  COMPLETED: { text: 'на прийом', cls: 'bg-amber-100 text-amber-700' },
  ACCEPTED: { text: 'здано', cls: 'bg-green-100 text-green-700' },
  REJECTED: { text: 'брак', cls: 'bg-red-100 text-red-700' },
  PAID: { text: 'виплачено', cls: 'bg-slate-100 text-slate-600' },
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { seamstress?: string; status?: string };
}) {
  const seamstresses = await prisma.user.findMany({
    where: { role: 'SEAMSTRESS' },
    orderBy: { name: 'asc' },
  });

  const where: any = {};
  if (searchParams.seamstress) where.seamstressId = searchParams.seamstress;
  if (searchParams.status) where.status = searchParams.status;

  const items = await prisma.workItem.findMany({
    where,
    include: {
      seamstress: true,
      batch: { include: { model: true } },
    },
    orderBy: { takenAt: 'desc' },
    take: 300,
  });

  const totalQty = items.reduce((s, w) => s + w.qty, 0);
  const totalAmount = items.reduce((s, w) => s + Number(w.amount || 0), 0);

  // Хелпер для побудови URL фільтра
  function filterUrl(params: { seamstress?: string; status?: string }) {
    const sp = new URLSearchParams();
    const seam = params.seamstress ?? searchParams.seamstress;
    const stat = params.status ?? searchParams.status;
    if (seam) sp.set('seamstress', seam);
    if (stat) sp.set('status', stat);
    const q = sp.toString();
    return `/admin/history${q ? `?${q}` : ''}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Історія робіт</h1>

      {/* Фільтр по швеях */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div>
          <div className="text-xs text-slate-500 mb-2">Швея</div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterUrl({ seamstress: '' })}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                !searchParams.seamstress
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'hover:bg-slate-50'
              }`}
            >
              Усі
            </Link>
            {seamstresses.map((s) => (
              <Link
                key={s.id}
                href={filterUrl({ seamstress: s.id })}
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  searchParams.seamstress === s.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-2">Статус</div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterUrl({ status: '' })}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                !searchParams.status
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'hover:bg-slate-50'
              }`}
            >
              Усі
            </Link>
            {Object.entries(STATUS_LABELS).map(([key, v]) => (
              <Link
                key={key}
                href={filterUrl({ status: key })}
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  searchParams.status === key
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                {v.text}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Підсумок */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500">Записів</div>
          <div className="text-xl font-bold">{items.length} · {totalQty} шт</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500">Сума (нарах./виплач.)</div>
          <div className="text-xl font-bold">{formatUAH(totalAmount)}</div>
        </div>
      </div>

      {/* Таблиця */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Немає записів</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Швея</th>
                  <th className="text-left px-3 py-3">Модель</th>
                  <th className="text-left px-3 py-3">Колір</th>
                  <th className="text-center px-3 py-3">Розмір</th>
                  <th className="text-right px-3 py-3">К-ть</th>
                  <th className="text-center px-3 py-3">Статус</th>
                  <th className="text-right px-3 py-3">Взято</th>
                  <th className="text-right px-3 py-3">Здано</th>
                  <th className="text-right px-4 py-3">Сума</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => {
                  const st = STATUS_LABELS[w.status] || { text: w.status, cls: 'bg-slate-100' };
                  return (
                    <tr key={w.id} className="border-t">
                      <td className="px-4 py-2.5 font-medium">{w.seamstress.name}</td>
                      <td className="px-3 py-2.5">{w.batch.model.name}</td>
                      <td className="px-3 py-2.5">
                        {w.batch.color ? (
                          <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                            {w.batch.color}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">{w.size}</td>
                      <td className="px-3 py-2.5 text-right font-bold">{w.qty}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap">
                        {new Date(w.takenAt).toLocaleDateString('uk-UA', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap">
                        {w.acceptedAt
                          ? new Date(w.acceptedAt).toLocaleDateString('uk-UA', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {w.amount ? formatUAH(w.amount) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {items.length === 300 && (
        <div className="text-xs text-slate-400 text-center">
          Показано останні 300 записів. Звузьте фільтр щоб побачити старіші.
        </div>
      )}
    </div>
  );
}
