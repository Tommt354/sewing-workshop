import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeamstress } from '@/lib/auth';

export async function GET() {
  await requireSeamstress();

  const batches = await prisma.cuttingBatch.findMany({
    where: { sizes: { some: { remainingQty: { gt: 0 } } } },
    include: {
      model: true,
      sizes: { where: { remainingQty: { gt: 0 } }, orderBy: { size: 'asc' } },
    },
    orderBy: { createdAt: 'asc' }, // FIFO
  });

  // Групуємо: (model + color) → перша доступна партія для кожного розміру
  const map = new Map<
    string,
    {
      key: string;
      modelId: string;
      article: string;
      name: string;
      color: string;
      photoUrl: string | null;
      note: string | null;
      sewingPrice: number;
      sizes: Map<string, { size: string; remaining: number; batchId: string }>;
    }
  >();

  for (const b of batches) {
    const key = `${b.modelId}::${b.color || ''}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        key,
        modelId: b.modelId,
        article: b.model.article,
        name: b.model.name,
        color: b.color || '',
        photoUrl: b.model.photoUrl,
        note: b.model.note,
        sewingPrice: Number(b.model.sewingPrice),
        sizes: new Map(),
      };
      map.set(key, entry);
    }
    for (const s of b.sizes) {
      if (!entry.sizes.has(s.size)) {
        entry.sizes.set(s.size, {
          size: s.size,
          remaining: s.remainingQty,
          batchId: b.id,
        });
      }
    }
  }

  const models = Array.from(map.values()).map((m) => ({
    key: m.key,
    modelId: m.modelId,
    article: m.article,
    name: m.name,
    color: m.color,
    photoUrl: m.photoUrl,
    note: m.note,
    sewingPrice: m.sewingPrice,
    sizes: Array.from(m.sizes.values()),
  }));

  return NextResponse.json({ models });
}
