import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatUAH } from '@/lib/utils';
import { ModelEditForm } from '@/components/ModelEditForm';

export default async function ModelDetailPage({ params }: { params: { id: string } }) {
  const model = await prisma.model.findUnique({
    where: { id: params.id },
    include: { services: true },
  });
  if (!model) return notFound();

  const batches = await prisma.cuttingBatch.findMany({
    where: { modelId: model.id },
    include: { sizes: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalCut = batches.reduce(
    (s, b) => s + b.sizes.reduce((s2, sz) => s2 + sz.initialQty, 0),
    0
  );
  const totalRemaining = batches.reduce(
    (s, b) => s + b.sizes.reduce((s2, sz) => s2 + sz.remainingQty, 0),
    0
  );
  const totalSewn = totalCut - totalRemaining;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/models" className="text-sm text-slate-500">
        ← До моделей
      </Link>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card label="Всього нарізано" value={`${totalCut} шт`} />
        <Card label="В роботі/відшито" value={`${totalSewn} шт`} />
        <Card label="Залишок крою" value={`${totalRemaining} шт`} />
      </div>

      <ModelEditForm
        model={{
          id: model.id,
          article: model.article,
          name: model.name,
          photoUrl: model.photoUrl,
          sizes: model.sizes,
          colors: model.colors || [],
          note: model.note,
          sewingPrice: Number(model.sewingPrice),
          cuttingPrice: Number(model.cuttingPrice),
          fabricPerUnitM: Number(model.fabricPerUnitM),
          services: model.services.map((s) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
          })),
        }}
      />

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b font-bold">Історія крою</div>
        {batches.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Партій не було</div>
        ) : (
          <div className="divide-y">
            {batches.map((b) => {
              const initial = b.sizes.reduce((s, x) => s + x.initialQty, 0);
              const remaining = b.sizes.reduce((s, x) => s + x.remainingQty, 0);
              return (
                <div key={b.id} className="p-4 flex flex-wrap gap-3 items-center">
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-2">
                      {b.color && (
                        <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                          {b.color}
                        </span>
                      )}
                      {new Date(b.createdAt).toLocaleString('uk-UA')}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {b.sizes
                        .map((s) => `${s.size}: ${s.remainingQty}/${s.initialQty}`)
                        .join(' · ')}
                    </div>
                    {b.note && (
                      <div className="text-xs text-slate-400 mt-1">{b.note}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {initial - remaining}/{initial} відшито
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="text-sm text-slate-500 mb-2">Собівартість одиниці</div>
        <div className="space-y-1 text-sm">
          <Row label="Ціна відшиву (швеї)" value={formatUAH(model.sewingPrice)} />
          <Row label="Ціна крою (закрійнику)" value={formatUAH(model.cuttingPrice)} />
          <Row
            label={`Тканина (${Number(model.fabricPerUnitM).toFixed(2)} м)`}
            value={'—'}
            note="за поточною ціною"
          />
          {model.services.map((s) => (
            <Row key={s.id} label={`Дод: ${s.name}`} value={formatUAH(s.price)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex justify-between border-b last:border-b-0 py-1">
      <span className="text-slate-600">
        {label}
        {note && <span className="text-xs text-slate-400"> · {note}</span>}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
