import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';

export default async function InProgressPage() {
  // Усе що швеї взяли і ще не здали
  const items = await prisma.workItem.findMany({
    where: { status: 'TAKEN' },
    include: {
      seamstress: true,
      batch: { include: { model: true } },
    },
    orderBy: { takenAt: 'desc' },
  });

  // Згрупуємо по швеях для зручності
  type Group = {
    seamstressId: string;
    name: string;
    items: typeof items;
    totalQty: number;
  };
  const groups = new Map<string, Group>();
  for (const w of items) {
    let g = groups.get(w.seamstressId);
    if (!g) {
      g = { seamstressId: w.seamstressId, name: w.seamstress.name, items: [], totalQty: 0 };
      groups.set(w.seamstressId, g);
    }
    g.items.push(w);
    g.totalQty += w.qty;
  }

  const totalQty = items.reduce((s, w) => s + w.qty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">В роботі</h1>
        <div className="text-sm text-slate-500">
          Всього на руках: <span className="font-bold text-slate-800">{totalQty} шт</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
          Зараз ніхто нічого не шиє — усе здано
        </div>
      ) : (
        Array.from(groups.values()).map((g) => (
          <div key={g.seamstressId} className="bg-white border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between bg-slate-50">
              <span className="font-bold">{g.name}</span>
              <span className="text-sm text-slate-500">{g.totalQty} шт в роботі</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left px-5 py-2">Модель</th>
                  <th className="text-left px-3 py-2">Колір</th>
                  <th className="text-center px-3 py-2">Розмір</th>
                  <th className="text-right px-3 py-2">К-ть</th>
                  <th className="text-right px-5 py-2">Взято</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((w) => (
                  <tr key={w.id} className="border-t">
                    <td className="px-5 py-2.5 font-medium">{w.batch.model.name}</td>
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
                    <td className="px-5 py-2.5 text-right text-slate-500">
                      {new Date(w.takenAt).toLocaleString('uk-UA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
