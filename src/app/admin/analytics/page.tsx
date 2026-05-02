import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';

// Період за замовчуванням — поточний місяць
function getDefaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const { start: defStart, end: defEnd } = getDefaultPeriod();
  const from = searchParams.from ? new Date(searchParams.from) : defStart;
  const to = searchParams.to ? new Date(searchParams.to) : defEnd;
  to.setHours(23, 59, 59, 999);

  // Прийняті роботи за період
  const works = await prisma.workItem.findMany({
    where: {
      status: { in: ['ACCEPTED', 'PAID'] },
      acceptedAt: { gte: from, lte: to },
    },
    include: { batch: { include: { model: { include: { services: true } } } } },
  });

  // Витрати на період (оренда + комуналка)
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { periodStart: { gte: from, lte: to } },
        { periodEnd: { gte: from, lte: to } },
        { AND: [{ periodStart: { lte: from } }, { periodEnd: { gte: to } }] },
      ],
    },
  });
  const overheadTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Усього одиниць за період — для розподілу overhead-ів
  const totalUnits = works.reduce((s, w) => s + w.qty, 0);
  const overheadPerUnit = totalUnits > 0 ? overheadTotal / totalUnits : 0;

  // Середня ціна тканини (зважена)
  const fabrics = await prisma.fabric.findMany();
  const totalFabricM = fabrics.reduce((s, f) => s + Number(f.totalMeters), 0);
  const totalFabricCost = fabrics.reduce(
    (s, f) => s + Number(f.totalMeters) * Number(f.pricePerMeter),
    0
  );
  const avgFabricPricePerM = totalFabricM > 0 ? totalFabricCost / totalFabricM : 0;

  // Групуємо по моделях
  type Stat = {
    modelId: string;
    name: string;
    article: string;
    units: number;
    sewingCost: number;
    cuttingCost: number;
    fabricCost: number;
    servicesCost: number;
    overhead: number;
    totalCost: number;
    sellPriceUnknown: boolean; // не маємо ціни продажу — показуємо тільки собівартість
  };

  const stats = new Map<string, Stat>();
  for (const w of works) {
    const m = w.batch.model;
    let s = stats.get(m.id);
    if (!s) {
      s = {
        modelId: m.id,
        name: m.name,
        article: m.article,
        units: 0,
        sewingCost: 0,
        cuttingCost: 0,
        fabricCost: 0,
        servicesCost: 0,
        overhead: 0,
        totalCost: 0,
        sellPriceUnknown: true,
      };
      stats.set(m.id, s);
    }
    const servicesPerUnit = m.services.reduce((sum, x) => sum + Number(x.price), 0);
    s.units += w.qty;
    s.sewingCost += Number(m.sewingPrice) * w.qty;
    s.cuttingCost += Number(m.cuttingPrice) * w.qty;
    s.fabricCost += Number(m.fabricPerUnitM) * avgFabricPricePerM * w.qty;
    s.servicesCost += servicesPerUnit * w.qty;
    s.overhead += overheadPerUnit * w.qty;
    s.totalCost = s.sewingCost + s.cuttingCost + s.fabricCost + s.servicesCost + s.overhead;
  }

  const rows = Array.from(stats.values()).sort((a, b) => b.units - a.units);

  function fmtDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аналітика</h1>

      {/* Фільтр періоду */}
      <form className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <label className="block">
          <span className="text-xs text-slate-500">З</span>
          <input
            type="date"
            name="from"
            defaultValue={fmtDate(from)}
            className="block border rounded-lg px-3 py-2 mt-1"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">По</span>
          <input
            type="date"
            name="to"
            defaultValue={fmtDate(to)}
            className="block border rounded-lg px-3 py-2 mt-1"
          />
        </label>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">
          Застосувати
        </button>
      </form>

      {/* Підсумки */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card label="Відшито за період" value={`${totalUnits} шт`} />
        <Card label="Накладні (оренда+ком.)" value={formatUAH(overheadTotal)} />
        <Card
          label="Накладних на одиницю"
          value={formatUAH(overheadPerUnit)}
          sub={totalUnits === 0 ? '—' : ''}
        />
        <Card
          label="Сер. ціна тканини"
          value={`${formatUAH(avgFabricPricePerM)}/м`}
        />
      </div>

      {/* Рейтинг моделей */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">
          Прибутковість моделей за період
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Немає даних. Прийми роботи в розділі «Виплати», щоб побачити аналітику.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Модель</th>
                  <th className="text-right px-3 py-3">Шт</th>
                  <th className="text-right px-3 py-3">Відшив</th>
                  <th className="text-right px-3 py-3">Крій</th>
                  <th className="text-right px-3 py-3">Тканина</th>
                  <th className="text-right px-3 py-3">Дод.</th>
                  <th className="text-right px-3 py-3">Накладні</th>
                  <th className="text-right px-3 py-3 bg-slate-100">Собів. за шт</th>
                  <th className="text-right px-3 py-3 bg-slate-100">Всього</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const perUnit = r.units > 0 ? r.totalCost / r.units : 0;
                  return (
                    <tr key={r.modelId} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.article}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold">{r.units}</td>
                      <td className="px-3 py-3 text-right">{formatUAH(r.sewingCost)}</td>
                      <td className="px-3 py-3 text-right">{formatUAH(r.cuttingCost)}</td>
                      <td className="px-3 py-3 text-right">{formatUAH(r.fabricCost)}</td>
                      <td className="px-3 py-3 text-right">{formatUAH(r.servicesCost)}</td>
                      <td className="px-3 py-3 text-right">{formatUAH(r.overhead)}</td>
                      <td className="px-3 py-3 text-right font-bold bg-slate-50">
                        {formatUAH(perUnit)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold bg-slate-50">
                        {formatUAH(r.totalCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong>Як рахується:</strong> накладні витрати (оренда + комуналка за період) ділю
        на загальну кількість відшитих одиниць — це частка цеху на штуку. До неї додаю
        ціну відшиву, ціну крою, тканину (за середньою ціною/метр), дод. послуги. Так
        бачиш реальну собівартість одиниці. Коли додаси ціни продажу — буду рахувати ще й
        маржу і %.
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
