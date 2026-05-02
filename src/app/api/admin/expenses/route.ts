import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  type: z.enum(['RENT', 'UTILITIES', 'OTHER']),
  amount: z.string().or(z.number()),
  periodStart: z.string(),
  periodEnd: z.string(),
  note: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });
  await prisma.expense.create({
    data: {
      type: parsed.data.type,
      amount: Number(parsed.data.amount),
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      note: parsed.data.note || null,
    },
  });
  return NextResponse.json({ ok: true });
}
