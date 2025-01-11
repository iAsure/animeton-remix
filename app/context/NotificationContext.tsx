import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@iconify/react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
  title?: string
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const notificationVariants = {
  initial: { opacity: 0, x: -50, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -50, scale: 0.95, transition: { duration: 0.2 } }
}

const NOTIFICATION_TTL = 5000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications(current => current.filter(notification => notification.id !== id))
  }, [])

  const showNotification = useCallback(
    ({ message, type, duration = NOTIFICATION_TTL, title }: Omit<Notification, 'id'>) => {
      const id = crypto.randomUUID()
      const notification = { id, message, type, title }

      setNotifications(current => [...current, notification])

      if (duration) {
        setTimeout(() => removeNotification(id), duration)
      }
    },
    [removeNotification]
  )

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      <div className="fixed top-20 left-4 z-50 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              layout
              variants={notificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`
                relative min-w-[380px] rounded-lg border overflow-hidden backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.4)]
                ${notification.type === 'success' && 'border-green-500/50 bg-[#0c1f14] text-green-200 shadow-green-500/30'}
                ${notification.type === 'error' && 'border-red-500/50 bg-[#1f0c0c] text-red-200 shadow-red-500/30'}
                ${notification.type === 'warning' && 'border-yellow-500/50 bg-[#1f180c] text-yellow-200 shadow-yellow-500/30'}
                ${notification.type === 'info' && 'border-blue-500/50 bg-[#0c141f] text-blue-200 shadow-blue-500/30'}
              `}
            >
              <div 
                className={`
                  absolute bottom-0 left-0 right-0 h-full bg-gradient-to-r opacity-10
                  ${notification.type === 'success' && 'from-green-500 to-green-400'}
                  ${notification.type === 'error' && 'from-red-500 to-red-400'}
                  ${notification.type === 'warning' && 'from-yellow-500 to-yellow-400'}
                  ${notification.type === 'info' && 'from-blue-500 to-blue-400'}
                `}
                style={{
                  animation: `shrink ${NOTIFICATION_TTL}ms linear forwards`,
                  transformOrigin: 'right'
                }}
              />
              <div className="relative flex items-start gap-3 p-4">
                <div className="mt-0.5">
                  <Icon 
                    icon={
                      notification.type === 'success' ? 'mdi:check-circle' :
                      notification.type === 'error' ? 'mdi:alert-circle' :
                      notification.type === 'warning' ? 'mdi:alert' :
                      'mdi:information'
                    }
                    className={`
                      h-5 w-5
                      ${notification.type === 'success' && 'text-green-400'}
                      ${notification.type === 'error' && 'text-red-400'}
                      ${notification.type === 'warning' && 'text-yellow-400'}
                      ${notification.type === 'info' && 'text-blue-400'}
                    `}
                  />
                </div>
                <div className="flex-1">
                  {notification.title && (
                    <h4 className="font-semibold tracking-wide mb-1 text-white">{notification.title}</h4>
                  )}
                  <p className="text-sm opacity-95">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="mt-0.5 opacity-70 hover:opacity-100 transition-opacity text-white/80 hover:text-white"
                >
                  <Icon icon="mdi:close" className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
} 