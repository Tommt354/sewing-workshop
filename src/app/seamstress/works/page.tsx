import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { CompleteButton } from '@/components/CompleteButton';

export default async function MyWorksPage() {
  const session = await getSession();
  if (!session) return null;

  const items = await prisma.workItem.findMany({
    where: {
      seamstressId: session.userId,
      status: { in: ['TAKEN', 'COMPLETED', 'REJECTED'] },
    },
    include: { batch: { include: { model: true } } },
    orderBy: { takenAt: 'desc' },
  });

  return (
    <div className="space-y-3">
      <Link href="/seamstress" className="text-sm text-slate-500">
        ← Назад
      </Link>
      <h1 className="text-xl font-bold">Мої роботи</h1>
      {items.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-center text-slate-500">
          Поки немає робіт у виконанні
        </div>
      ) : (
        items.map((w) => (
          <div key={w.id} className="bg-white border rounded-xl p-4 flex gap-3 items-center">
            {w.batch.model.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={w.batch.model.photoUrl}
                alt=""
                className="w-14 h-14 rounded object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded bg-slate-100" />
            )}
            <div className="flex-1">
              <div className="font-bold">{w.batch.model.name}</div>
              <div className="text-sm text-slate-500">
                {w.size} · {w.qty} шт
              </div>
              {w.status === 'TAKEN' && (
                <div className="text-xs text-blue-600 mt-1">в роботі</div>
              )}
              {w.status === 'COMPLETED' && (
                <div className="text-xs text-amber-600 mt-1">очікує прийому</div>
              )}
              {w.status === 'REJECTED' && (
                <div className="text-xs text-red-600 mt-1">
                  ⚠️ повернуто на переробку{w.note && `: ${w.note}`}
                </div>
              )}
            </div>
            {(w.status === 'TAKEN' || w.status === 'REJECTED') && (
              <CompleteButton id={w.id} />
            )}
          </div>
        ))
      )}
    </div>
  );
}
