import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatUAH, formatPhone } from '@/lib/utils';

export default async function SeamstressesPage() {
  const seamstresses = await prisma.user.findMany({
    where: { role: 'SEAMSTRESS' },
    orderBy: { name: 'asc' },
  });

  // Скільки в кожної до виплати
  const earnings = await prisma.workItem.groupBy({
    by: ['seamstressId'],
    where: { status: 'ACCEPTED' },
    _sum: { amount: true },
  });
  const earnMap = new Map<string, number>(
    earnings.map((e) => [e.seamstressId, Number(e._sum.amount || 0)])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Швеї</h1>
        <Link
          href="/admin/seamstresses/new"
          className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Додати швею
        </Link>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        {seamstresses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Немає швей. Додайте першу.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Ім'я</th>
                <th className="text-left px-4 py-3">Телефон</th>
                <th className="text-right px-4 py-3">До виплати</th>
                <th className="text-center px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {seamstresses.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/seamstresses/${s.id}`} className="hover:text-brand-600">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatPhone(s.phone)}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatUAH(earnMap.get(s.id) || 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.active ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        активна
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                        неактивна
                      </span>
                    )}
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
