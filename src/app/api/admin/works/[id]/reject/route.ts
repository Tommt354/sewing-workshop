import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const { note } = await req.json().catch(() => ({ note: '' }));
  const work = await prisma.workItem.findUnique({ where: { id: params.id } });
  if (!work) return NextResponse.json({ error: 'Не знайдено' }, { status: 404 });
  if (work.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Невірний статус' }, { status: 400 });
  }
  await prisma.workItem.update({
    where: { id: params.id },
    data: { status: 'REJECTED', completedAt: null, note: note || 'Брак' },
  });
  return NextResponse.json({ ok: true });
}
