import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { normalizePhone } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN має бути 4–6 цифр'),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Невірні дані' }, { status: 400 });
  }
  const phone = normalizePhone(parsed.data.phone);
  const pinHash = await bcrypt.hash(parsed.data.pin, 10);

  try {
    const user = await prisma.user.create({
      data: {
        phone,
        name: parsed.data.name,
        pinHash,
        role: 'SEAMSTRESS',
      },
    });
    return NextResponse.json({ ok: true, id: user.id });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Телефон вже використовується' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Помилка створення' }, { status: 500 });
  }
}
