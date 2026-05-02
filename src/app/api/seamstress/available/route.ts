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
    orderBy: { createdAt: 'asc' }, // FIFO — старіші партії беруться першими
  });

  // Беремо першу доступну партію по кожному (model, size)
  const map = new Map<
    string,
    {
      modelId: string;
      article: string;
      name: string;
      photoUrl: string | null;
      sizes: Map<string, { size: string; remaining: number; batchId: string }>;
    }
  >();

  for (const b of batches) {
    let entry = map.get(b.modelId);
    if (!entry) {
      entry = {
        modelId: b.modelId,
        article: b.model.article,
        name: b.model.name,
        photoUrl: b.model.photoUrl,
        sizes: new Map(),
      };
      map.set(b.modelId, entry);
    }
    for (const s of b.sizes) {
      if (!entry.sizes.has(s.size)) {
        entry.sizes.set(s.size, { size: s.size, remaining: s.remainingQty, batchId: b.id });
      }
    }
  }

  const models = Array.from(map.values()).map((m) => ({
    modelId: m.modelId,
    article: m.article,
    name: m.name,
    photoUrl: m.photoUrl,
    sizes: Array.from(m.sizes.values()),
  }));

  return NextResponse.json({ models });
}
