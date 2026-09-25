import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server'
import { notificationRepo, requesterFromSession } from '@/lib/repo';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Update the notification in the database
  // (Prisma's update-by-unique threw — 500 — when the row was missing)
  const notification = await notificationRepo.markRead(id, requesterFromSession(session));
  if (!notification) {
    throw new Error(`Notification ${id} not found`);
  }

  return NextResponse.json({
    success: true,
    message: `Notification ${id} marked as read`,
    notification
  });
}
