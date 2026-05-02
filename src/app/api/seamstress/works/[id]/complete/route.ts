import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });

  const work = await prisma.workItem.findUnique({
    where: { id: params.id },
    include: { batch: { include: { model: true } } },
  });
  if (!work || work.seamstressId !== session.userId) {
    return NextResponse.json({ error: 'Не знайдено' }, { status: 404 });
  }
  if (work.status !== 'TAKEN' && work.status !== 'REJECTED') {
    return NextResponse.json({ error: 'Не можна здати' }, { status: 400 });
  }

  // Здача = автоматичний прийом і нарахування суми
  const amount = Number(work.batch.model.sewingPrice) * work.qty;
  const now = new Date();

  await prisma.workItem.update({
    where: { id: params.id },
    data: {
      status: 'ACCEPTED',
      completedAt: now,
      acceptedAt: now,
      amount,
      note: null,
    },
  });
  return NextResponse.json({ ok: true });
}
