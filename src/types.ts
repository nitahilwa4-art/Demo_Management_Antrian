export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
};

export type TherapistStatus = 'available' | 'busy' | 'off';

export type Therapist = {
  id: string;
  name: string;
  status: TherapistStatus;
  specialties: string[];
  rating: number;
  imageUrl?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferences?: string;
  totalVisits: number;
  lastVisit?: string;
};

export type QueueStatus = 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export type QueueItem = {
  id: string;
  customerId?: string;
  serviceIds?: string[];
  therapistId?: string;
  status: QueueStatus;
  createdAt: string;
  scheduledTime?: string;
  isReservation?: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
  customDuration?: number;
  isBreak?: boolean;
};

export type AppState = {
  services: Service[];
  therapists: Therapist[];
  customers: Customer[];
  queue: QueueItem[];
};
