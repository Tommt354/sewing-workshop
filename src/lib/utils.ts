import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Приймає будь-що — number, string, Prisma Decimal, null, undefined
export function formatUAH(value: unknown) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 2,
  }).format(isNaN(n) ? 0 : n);
}

export function formatPhone(phone: string) {
  // +380XXXXXXXXX → +380 XX XXX XX XX
  const m = phone.match(/^\+?(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (!m) return phone;
  return `+${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`;
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('380')) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 10) return '+38' + digits;
  return '+' + digits;
}

// Понеділок поточного тижня (для робочих періодів)
export function getWeekStart(date: Date | string = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7; // Sunday = 0 → 7
  if (day !== 1) d.setHours(-24 * (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date | string = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatWeekRange(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  return `${fmt(s)} – ${fmt(e)}`;
}
