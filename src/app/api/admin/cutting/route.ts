import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  modelId: z.string().min(1),
  sizes: z.array(z.object({ size: z.string().min(1), qty: z.number().int().positive() })).min(1),
  note: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });
  }
  const { modelId, sizes, note } = parsed.data;

  const model = await prisma.model.findUnique({ where: { id: modelId } });
  if (!model) return NextResponse.json({ error: 'Модель не знайдена' }, { status: 404 });

  // Перевірка: всі розміри мають бути в списку моделі
  const invalid = sizes.filter((s) => !model.sizes.includes(s.size));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Розмір не належить моделі: ${invalid.map((s) => s.size).join(', ')}` },
      { status: 400 }
    );
  }

  const batch = await prisma.cuttingBatch.create({
    data: {
      modelId,
      note: note || null,
      sizes: {
        create: sizes.map((s) => ({
          size: s.size,
          initialQty: s.qty,
          remainingQty: s.qty,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: batch.id });
}
