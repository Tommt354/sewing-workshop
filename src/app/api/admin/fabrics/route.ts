import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(1),
  meters: z.string().or(z.number()),
  pricePerMeter: z.string().or(z.number()),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });

  const meters = Number(parsed.data.meters);
  const pricePerMeter = Number(parsed.data.pricePerMeter);

  await prisma.fabric.create({
    data: {
      name: parsed.data.name,
      totalMeters: meters,
      remainingM: meters,
      pricePerMeter,
      totalCost: meters * pricePerMeter,
    },
  });
  return NextResponse.json({ ok: true });
}
