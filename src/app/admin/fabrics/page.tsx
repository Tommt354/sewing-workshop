import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';
import { AddFabricForm } from '@/components/AddFabricForm';

export default async function FabricsPage() {
  const fabrics = await prisma.fabric.findMany({ orderBy: { createdAt: 'desc' } });
  const totalM = fabrics.reduce((s, f) => s + Number(f.remainingM), 0);
  const totalCost = fabrics.reduce(
    (s, f) => s + Number(f.remainingM) * Number(f.pricePerMeter),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Тканини</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <div className="text-sm text-slate-500">Всього на складі</div>
          <div className="text-2xl font-bold">{totalM.toFixed(1)} м</div>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="text-sm text-slate-500">Загальна вартість</div>
          <div className="text-2xl font-bold">{formatUAH(totalCost)}</div>
        </div>
      </div>
      <AddFabricForm />
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">Список тканин</div>
        {fabrics.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Поки немає тканин</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Назва</th>
                <th className="text-right px-4 py-3">Залишок</th>
                <th className="text-right px-4 py-3">Ціна/м</th>
                <th className="text-right px-4 py-3">Вартість</th>
              </tr>
            </thead>
            <tbody>
              {fabrics.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-right">{Number(f.remainingM).toFixed(1)} м</td>
                  <td className="px-4 py-3 text-right">{formatUAH(f.pricePerMeter)}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatUAH(Number(f.remainingM) * Number(f.pricePerMeter))}
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
