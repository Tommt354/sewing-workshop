import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  seamstressId: z.string().min(1),
  weekStart: z.string(),
  weekEnd: z.string(),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });

  const weekStart = new Date(parsed.data.weekStart);
  const weekEnd = new Date(parsed.data.weekEnd);

  const result = await prisma.$transaction(async (tx) => {
    const items = await tx.workItem.findMany({
      where: {
        seamstressId: parsed.data.seamstressId,
        status: 'ACCEPTED',
        acceptedAt: { gte: weekStart, lte: weekEnd },
      },
    });
    if (items.length === 0) {
      throw new Error('Немає робіт для виплати');
    }
    const total = items.reduce((s, w) => s + Number(w.amount || 0), 0);

    const payment = await tx.payment.create({
      data: {
        seamstressId: parsed.data.seamstressId,
        weekStart,
        weekEnd,
        amount: total,
      },
    });

    await tx.workItem.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { status: 'PAID', paidAt: new Date(), paymentId: payment.id },
    });

    return { paymentId: payment.id, amount: total, count: items.length };
  });

  return NextResponse.json({ ok: true, ...result });
}
