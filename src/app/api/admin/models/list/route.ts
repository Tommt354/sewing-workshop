import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  await requireAdmin();
  const models = await prisma.model.findMany({
    where: { active: true },
    select: { id: true, article: true, name: true, sizes: true, photoUrl: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ models });
}
