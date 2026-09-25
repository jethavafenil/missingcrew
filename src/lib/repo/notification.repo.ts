import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError } from '@/lib/repo/helpers'
import { mapNotification, type NotificationRow, type NotificationType } from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

export const NOTIF_COLS = 'id,user_id,type,title,message,read,data,created_at'

export async function findManyByUserId(userId: string, _req: Requester): Promise<NotificationRow[]> {
  const { data, error } = await getServiceClient()
    .from('notifications')
    .select(NOTIF_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  throwOnError('notification.findManyByUserId', error)
  return (data ?? []).map((r) => mapNotification(r as Record<string, unknown>))
}

export async function countUnreadByUserId(userId: string, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  throwOnError('notification.countUnread', error)
  return count ?? 0
}

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: unknown | null
}

export async function create(input: CreateNotificationInput, _req: Requester): Promise<NotificationRow> {
  const { data, error } = await getServiceClient()
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      data: input.data ?? null,
      created_at: now().toISOString(),
    })
    .select(NOTIF_COLS)
    .single()
  throwOnError('notification.create', error)
  return mapNotification(data as Record<string, unknown>)
}

export async function markAllReadByUserId(userId: string, _req: Requester): Promise<void> {
  const { error } = await getServiceClient().from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  throwOnError('notification.markAllRead', error)
}

export async function markRead(id: string, _req: Requester): Promise<NotificationRow | null> {
  const { data, error } = await getServiceClient()
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select(NOTIF_COLS)
    .maybeSingle()
  throwOnError('notification.markRead', error)
  return data ? mapNotification(data as Record<string, unknown>) : null
}

export type { NotificationRow, NotificationType }