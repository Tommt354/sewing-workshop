import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatUAH, getWeekStart, getWeekEnd, formatWeekRange } from '@/lib/utils';

export default async function AdminDashboard() {
  // Залишки крою — головна таблиця
  const batches = await prisma.cuttingBatch.findMany({
    include: {
      model: true,
      sizes: { orderBy: { size: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Згорнемо в карту: model → size → remaining
  type Row = {
    modelId: string;
    article: string;
    name: string;
    photoUrl: string | null;
    sizeMap: Map<string, { remaining: number; initial: number }>;
    totalRemaining: number;
  };

  const rows = new Map<string, Row>();
  for (const b of batches) {
    let row = rows.get(b.modelId);
    if (!row) {
      row = {
        modelId: b.modelId,
        article: b.model.article,
        name: b.model.name,
        photoUrl: b.model.photoUrl,
        sizeMap: new Map(),
        totalRemaining: 0,
      };
      rows.set(b.modelId, row);
    }
    for (const s of b.sizes) {
      const cur = row.sizeMap.get(s.size) || { remaining: 0, initial: 0 };
      cur.remaining += s.remainingQty;
      cur.initial += s.initialQty;
      row.sizeMap.set(s.size, cur);
      row.totalRemaining += s.remainingQty;
    }
  }

  const stockRows = Array.from(rows.values()).sort((a, b) => b.totalRemaining - a.totalRemaining);
  const allSizes = Array.from(
    new Set(stockRows.flatMap((r) => Array.from(r.sizeMap.keys())))
  );

  // Тиждень — сума до виплати
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const acceptedThisWeek = await prisma.workItem.findMany({
    where: { status: 'ACCEPTED', acceptedAt: { gte: weekStart, lte: weekEnd } },
    include: { seamstress: true },
  });
  const toPay = acceptedThisWeek.reduce((sum, w) => sum + Number(w.amount || 0), 0);

  // Залишок тканин
  const fabrics = await prisma.fabric.findMany();
  const totalFabricM = fabrics.reduce((s, f) => s + Number(f.remainingM), 0);
  const totalFabricCost = fabrics.reduce(
    (s, f) => s + Number(f.remainingM) * Number(f.pricePerMeter),
    0
  );

  const lowStock = stockRows.filter((r) => r.totalRemaining > 0 && r.totalRemaining < 5);

  return (
    <div className="space-y-6">
      {/* Карточки зверху */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-sm text-slate-500">До виплати ({formatWeekRange(weekStart, weekEnd)})</div>
          <div className="text-2xl font-bold mt-1">{formatUAH(toPay)}</div>
          <Link href="/admin/payments" className="text-sm text-brand-600 mt-2 inline-block">
            Перейти до виплат →
          </Link>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-sm text-slate-500">Залишок тканин</div>
          <div className="text-2xl font-bold mt-1">{totalFabricM.toFixed(1)} м</div>
          <div className="text-sm text-slate-500 mt-1">{formatUAH(totalFabricCost)}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-sm text-slate-500">Закінчується крій</div>
          <div className="text-2xl font-bold mt-1">{lowStock.length} моделей</div>
          {lowStock.length > 0 && (
            <div className="text-xs text-amber-600 mt-1">
              {lowStock.map((r) => r.name).slice(0, 3).join(', ')}
              {lowStock.length > 3 && '...'}
            </div>
          )}
        </div>
      </div>

      {/* Головна таблиця залишків */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-5 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold">Залишки крою</h2>
          <Link
            href="/admin/cutting/new"
            className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Додати крій
          </Link>
        </div>

        {stockRows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Поки немає крою. Додайте першу партію.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">Модель</th>
                  <th className="text-left px-4 py-3">Артикул</th>
                  {allSizes.map((s) => (
                    <th key={s} className="text-center px-3 py-3">
                      {s}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3">Всього</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((r) => (
                  <tr key={r.modelId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {r.photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.photoUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.article}</td>
                    {allSizes.map((s) => {
                      const v = r.sizeMap.get(s);
                      return (
                        <td
                          key={s}
                          className={`text-center px-3 py-3 ${
                            v && v.remaining === 0
                              ? 'text-slate-300'
                              : v && v.remaining < 3
                              ? 'text-amber-600 font-bold'
                              : 'font-medium'
                          }`}
                        >
                          {v ? v.remaining : '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold">{r.totalRemaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
