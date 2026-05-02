import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const work = await prisma.workItem.findUnique({
    where: { id: params.id },
    include: { batch: { include: { model: true } } },
  });
  if (!work) return NextResponse.json({ error: 'Не знайдено' }, { status: 404 });
  if (work.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Невірний статус' }, { status: 400 });
  }
  const amount = Number(work.batch.model.sewingPrice) * work.qty;
  await prisma.workItem.update({
    where: { id: params.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      amount,
    },
  });
  return NextResponse.json({ ok: true });
}
