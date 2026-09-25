import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server'
import { notificationRepo, requesterFromSession } from '@/lib/repo';

export async function POST() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Update all notifications for the user as read
  await notificationRepo.markAllReadByUserId(userId, requesterFromSession(session));

  return NextResponse.json({
    success: true,
    message: 'All notifications marked as read'
  });
}
