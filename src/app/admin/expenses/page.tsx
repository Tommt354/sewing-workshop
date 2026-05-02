import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';
import { AddExpenseForm } from '@/components/AddExpenseForm';

const TYPE_LABELS: Record<string, string> = {
  RENT: 'Оренда',
  UTILITIES: 'Комуналка',
  OTHER: 'Інше',
};

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { periodStart: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Витрати</h1>
      <AddExpenseForm />
      <div className="bg-white border rounded-xl overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Поки немає витрат</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Тип</th>
                <th className="text-left px-4 py-3">Період</th>
                <th className="text-right px-4 py-3">Сума</th>
                <th className="text-left px-4 py-3">Примітка</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">{TYPE_LABELS[e.type]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(e.periodStart).toLocaleDateString('uk-UA')} —{' '}
                    {new Date(e.periodEnd).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{formatUAH(e.amount)}</td>
                  <td className="px-4 py-3 text-slate-500">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
