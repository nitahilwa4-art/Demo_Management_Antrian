import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Customer, QueueItem, Service, Therapist, QueueStatus, TherapistStatus } from './types';

type Action =
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'ADD_TO_QUEUE'; payload: QueueItem }
  | { type: 'UPDATE_QUEUE_STATUS'; payload: { id: string; status: QueueStatus; therapistId?: string; startTime?: string; endTime?: string } }
  | { type: 'UPDATE_QUEUE_SCHEDULE'; payload: { id: string; scheduledTime: string; isReservation: boolean; therapistId?: string | null; customDuration?: number } }
  | { type: 'UPDATE_QUEUE_ITEM'; payload: Partial<QueueItem> & { id: string } }
  | { type: 'UPDATE_THERAPIST_STATUS'; payload: { id: string; status: TherapistStatus } }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'ADD_THERAPIST'; payload: Therapist };

const initialState: AppState = {
  services: [
    { id: 's1', name: 'Refleksi Kaki Lengkap', durationMinutes: 60, price: 150000, description: 'Pijat refleksi kaki, betis, dan paha.' },
    { id: 's2', name: 'Pijat Tradisional', durationMinutes: 90, price: 250000, description: 'Pijat seluruh tubuh dengan minyak aromaterapi.' },
    { id: 's3', name: 'Totok Wajah & Kepala', durationMinutes: 45, price: 120000, description: 'Relaksasi otot wajah dan kepala untuk mengurangi stres.' },
  ],
  therapists: [
    { id: 't1', name: 'Budi Santoso', status: 'available', specialties: ['Refleksi', 'Tradisional'], rating: 4.8 },
    { id: 't2', name: 'Siti Aminah', status: 'busy', specialties: ['Tradisional', 'Totok Wajah'], rating: 4.9 },
    { id: 't3', name: 'Agus Wijaya', status: 'off', specialties: ['Refleksi'], rating: 4.7 },
    { id: 't4', name: 'Rina Melati', status: 'available', specialties: ['Totok Wajah', 'Refleksi'], rating: 4.6 },
  ],
  customers: [
    { id: 'c1', name: 'Andi Pratama', phone: '081234567890', totalVisits: 5, lastVisit: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'c2', name: 'Dewi Lestari', phone: '089876543210', totalVisits: 2, lastVisit: new Date(Date.now() - 86400000 * 12).toISOString(), preferences: 'Tekanan pijat sedang' },
    { id: 'c3', name: 'Bambang Pamungkas', phone: '085612349876', totalVisits: 0 },
  ],
  queue: [
    {
      id: 'q1',
      customerId: 'c2',
      serviceId: 's2',
      therapistId: 't2',
      status: 'in-progress',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      startTime: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'q2',
      customerId: 'c1',
      serviceId: 's1',
      status: 'waiting',
      createdAt: new Date(Date.now() - 1200000).toISOString(),
      notes: 'Minta terapis laki-laki',
    },
    {
      id: 'q3',
      customerId: 'c3',
      serviceId: 's3',
      status: 'waiting',
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'q4',
      customerId: 'c1',
      serviceId: 's2',
      status: 'waiting',
      createdAt: new Date().toISOString(),
      scheduledTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
      isReservation: true,
      notes: 'Reservasi jam 3 sore',
    }
  ],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, action.payload] };
    case 'UPDATE_QUEUE_STATUS': {
      const updatedQueue = state.queue.map((q) => {
        if (q.id === action.payload.id) {
          return {
            ...q,
            status: action.payload.status,
            ...(action.payload.therapistId && { therapistId: action.payload.therapistId }),
            ...(action.payload.startTime && { startTime: action.payload.startTime }),
            ...(action.payload.endTime && { endTime: action.payload.endTime }),
          };
        }
        return q;
      });

      // Smart Integration: Auto-update therapist status based on queue changes
      const targetQueueItem = state.queue.find(q => q.id === action.payload.id);
      const therapistId = action.payload.therapistId || targetQueueItem?.therapistId;
      
      let updatedTherapists = state.therapists;
      let updatedCustomers = state.customers;

      if (therapistId) {
        if (action.payload.status === 'in-progress') {
          updatedTherapists = state.therapists.map(t => 
            t.id === therapistId ? { ...t, status: 'busy' } : t
          );
        } else if (action.payload.status === 'completed' || action.payload.status === 'cancelled') {
          // Check if therapist has other in-progress items
          const hasOtherInProgress = updatedQueue.some(q => q.therapistId === therapistId && q.status === 'in-progress' && q.id !== action.payload.id);
          if (!hasOtherInProgress) {
            updatedTherapists = state.therapists.map(t => 
              t.id === therapistId ? { ...t, status: 'available' } : t
            );
          }
        }
      }

      // Smart Integration: Auto-update customer visits when completed
      if (action.payload.status === 'completed' && targetQueueItem?.customerId) {
        updatedCustomers = state.customers.map(c => {
          if (c.id === targetQueueItem.customerId) {
            return {
              ...c,
              totalVisits: c.totalVisits + 1,
              lastVisit: new Date().toISOString()
            };
          }
          return c;
        });
      }

      return {
        ...state,
        queue: updatedQueue,
        therapists: updatedTherapists,
        customers: updatedCustomers,
      };
    }
    case 'UPDATE_QUEUE_SCHEDULE':
      return {
        ...state,
        queue: state.queue.map((q) => {
          if (q.id === action.payload.id) {
            const updated = { 
              ...q, 
              scheduledTime: action.payload.scheduledTime, 
              isReservation: action.payload.isReservation 
            };
            if ('therapistId' in action.payload) {
              updated.therapistId = action.payload.therapistId === null ? undefined : action.payload.therapistId;
            }
            if ('customDuration' in action.payload) {
              updated.customDuration = action.payload.customDuration;
            }
            return updated;
          }
          return q;
        }),
      };
    case 'UPDATE_QUEUE_ITEM':
      return {
        ...state,
        queue: state.queue.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload } : q
        ),
      };
    case 'UPDATE_THERAPIST_STATUS':
      return {
        ...state,
        therapists: state.therapists.map((t) =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        ),
      };
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'ADD_THERAPIST':
      return { ...state, therapists: [...state.therapists, action.payload] };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
