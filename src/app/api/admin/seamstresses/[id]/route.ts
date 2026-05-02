import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const schema = z.object({
  active: z.boolean().optional(),
  pin: z.string().regex(/^\d{4,6}$/).optional(),
  name: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });

  const update: any = {};
  if (parsed.data.active !== undefined) update.active = parsed.data.active;
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.pin) update.pinHash = await bcrypt.hash(parsed.data.pin, 10);

  await prisma.user.update({ where: { id: params.id }, data: update });
  return NextResponse.json({ ok: true });
}
