import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { normalizePhone } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();
    if (!phone || !pin) {
      return NextResponse.json({ error: 'Введіть телефон і PIN' }, { status: 400 });
    }

    const normalized = normalizePhone(String(phone));
    const user = await prisma.user.findUnique({ where: { phone: normalized } });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(pin), user.pinHash);
    if (!ok) {
      return NextResponse.json({ error: 'Невірний PIN' }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      role: user.role as 'ADMIN' | 'SEAMSTRESS',
      name: user.name,
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Серверна помилка' }, { status: 500 });
  }
}
