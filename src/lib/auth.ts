import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

const COOKIE_NAME = 'sw_session';
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-secret-change-me-in-production-please-32chars'
);

export type Session = {
  userId: string;
  role: 'ADMIN' | 'SEAMSTRESS';
  name: string;
};

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');
  return session;
}

export async function requireSeamstress() {
  const session = await getSession();
  if (!session || session.role !== 'SEAMSTRESS') redirect('/login');
  // переконаємось, що користувач активний
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) redirect('/login');
  return session;
}
