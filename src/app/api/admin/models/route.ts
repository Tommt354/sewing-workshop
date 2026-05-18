import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  article: z.string().min(1),
  name: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
  sizes: z.array(z.string().min(1)).min(1),
  colors: z.array(z.string().min(1)).optional().default([]),
  note: z.string().optional().nullable(),
  sewingPrice: z.string().or(z.number()),
  cuttingPrice: z.string().or(z.number()),
  fabricPerUnitM: z.string().or(z.number()),
  services: z
    .array(z.object({ name: z.string().min(1), price: z.string().or(z.number()) }))
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const model = await prisma.model.create({
      data: {
        article: d.article,
        name: d.name,
        photoUrl: d.photoUrl || null,
        sizes: d.sizes,
        colors: d.colors,
        note: d.note || null,
        sewingPrice: Number(d.sewingPrice),
        cuttingPrice: Number(d.cuttingPrice),
        fabricPerUnitM: Number(d.fabricPerUnitM),
        services: {
          create: d.services.map((s) => ({ name: s.name, price: Number(s.price) })),
        },
      },
    });
    return NextResponse.json({ ok: true, id: model.id });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Артикул вже існує' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Помилка створення' }, { status: 500 });
  }
}
