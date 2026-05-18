import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';

export default async function ModelsPage() {
  const models = await prisma.model.findMany({
    where: { active: true },
    include: { services: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Моделі</h1>
        <Link
          href="/admin/models/new"
          className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Нова модель
        </Link>
      </div>

      {models.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
          Немає моделей. Створіть першу.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m) => {
            const servicesTotal = m.services.reduce((s, x) => s + Number(x.price), 0);
            return (
              <Link
                key={m.id}
                href={`/admin/models/${m.id}`}
                className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition"
              >
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt={m.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-400">
                    Без фото
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.article}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Відшив:</span>
                      <span className="font-medium">{formatUAH(m.sewingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Крій:</span>
                      <span>{formatUAH(m.cuttingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Тканина:</span>
                      <span>{Number(m.fabricPerUnitM).toFixed(2)} м</span>
                    </div>
                    {servicesTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Дод. послуги:</span>
                        <span>{formatUAH(servicesTotal)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.sizes.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-slate-100 px-2 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {m.colors && m.colors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.colors.map((c) => (
                        <span
                          key={c}
                          className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
