import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const schema = z.object({
  batchId: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SEAMSTRESS') {
    return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  }
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });
  }
  const { batchId, size, qty } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Атомарне зменшення з перевіркою
      const updated = await tx.batchSize.updateMany({
        where: { batchId, size, remainingQty: { gte: qty } },
        data: { remainingQty: { decrement: qty } },
      });
      if (updated.count === 0) {
        throw new Error('Недостатньо крою');
      }
      const work = await tx.workItem.create({
        data: {
          seamstressId: session.userId,
          batchId,
          size,
          qty,
          status: 'TAKEN',
        },
      });
      return work;
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Помилка' }, { status: 400 });
  }
}
