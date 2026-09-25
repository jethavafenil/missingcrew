'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  
  // Use SWR for fetching notifications with automatic revalidation
  const { data, error, mutate } = useSWR<NotificationsData>(
    session ? '/api/notifications' : null,
    swrFetcher,
    {
      // Pusher events below invalidate this key; avoid duplicate polling while
      // the websocket is healthy. Focus/reconnect remain the fallback.
      refreshInterval: 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  useEffect(() => {
    if (!session) return

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`notifications:${session.user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}`,
      }, () => { void mutate() })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [session, mutate])

  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update the cache
      mutate(
        (currentData) => {
          if (!currentData) return currentData
          return {
            notifications: currentData.notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, read: true }
                : notification
            ),
            unreadCount: Math.max(0, currentData.unreadCount - 1),
          }
        },
        false // Don't revalidate immediately
      )

      // Make the API call
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      // Revalidate to ensure sync with server
      mutate()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revalidate on error to restore correct state
      mutate()
    }
  }

  const markAllAsRead = async () => {
    try {
      // Optimistically update the cache
      mutate(
        (currentData) => {
          if (!currentData) return currentData
          return {
            notifications: currentData.notifications.map(notification => ({
              ...notification,
              read: true
            })),
            unreadCount: 0,
          }
        },
        false // Don't revalidate immediately
      )

      // Make the API call
      await fetch('/api/notifications/read-all', {
        method: 'POST'
      })
      
      // Revalidate to ensure sync with server
      mutate()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      // Revalidate on error to restore correct state
      mutate()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
            clipRule="evenodd"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Mobile: Fixed full-width popup, Desktop: Absolute positioned */}
          <div className="fixed md:absolute left-0 right-0 md:right-0 md:left-auto top-14 md:top-auto md:mt-2 w-full md:w-96 bg-white rounded-lg md:rounded-lg shadow-lg border z-50 max-w-full md:max-w-md">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs md:text-sm text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 flex-shrink-0"
                    aria-label="Close notifications"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100vh-8rem)] md:max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
