import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server'
import { notificationRepo, requesterFromSession } from '@/lib/repo';

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const requester = requesterFromSession(session);

  // Get all notifications for the user
  const notifications = await notificationRepo.findManyByUserId(requester.userId, requester);

  // Count unread notifications
  const unreadCount = await notificationRepo.countUnreadByUserId(requester.userId, requester);

  return NextResponse.json({
    notifications,
    unreadCount
  });
}

export async function POST() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}