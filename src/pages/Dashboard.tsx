import React from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';
import { Users, Clock, CheckCircle, UserCircle, ArrowRight, Play, Check } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '../components/ui';

export function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { state, dispatch } = useAppStore();

  const todayQueue = state.queue.filter(q => {
    const itemDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
    return isSameDay(itemDate, new Date());
  });

  const waitingCount = todayQueue.filter(q => q.status === 'waiting').length;
  const inProgressCount = todayQueue.filter(q => q.status === 'in-progress').length;
  const completedCount = todayQueue.filter(q => q.status === 'completed').length;
  const availableTherapists = state.therapists.filter(t => t.status === 'available').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#2C302E]">Dashboard</h2>
        <p className="text-gray-500">Ringkasan aktivitas hari ini, {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu</p>
              <h3 className="text-2xl font-bold text-[#2C302E]">{waitingCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sedang Dilayani</p>
              <h3 className="text-2xl font-bold text-[#2C302E]">{inProgressCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai Hari Ini</p>
              <h3 className="text-2xl font-bold text-[#2C302E]">{completedCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-[#D4C5B9]/30 text-[#7C9082] rounded-2xl">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Terapis Tersedia</p>
              <h3 className="text-2xl font-bold text-[#2C302E]">{availableTherapists} / {state.therapists.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Antrian Aktif</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('queue')} className="text-[#7C9082]">
              Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.queue.filter(q => q.status === 'waiting' || q.status === 'in-progress').length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada antrian aktif saat ini.</p>
              ) : (
                state.queue
                  .filter(q => q.status === 'waiting' || q.status === 'in-progress')
                  .sort((a, b) => {
                    const timeA = a.isReservation && a.scheduledTime ? new Date(a.scheduledTime).getTime() : new Date(a.createdAt).getTime();
                    const timeB = b.isReservation && b.scheduledTime ? new Date(b.scheduledTime).getTime() : new Date(b.createdAt).getTime();
                    return timeA - timeB;
                  })
                  .slice(0, 5)
                  .map(q => {
                    const customer = state.customers.find(c => c.id === q.customerId);
                    const service = state.services.find(s => s.id === q.serviceId);
                    const therapist = state.therapists.find(t => t.id === q.therapistId);
                    
                    return (
                      <div key={q.id} className="flex items-center justify-between p-4 rounded-xl border border-[#E8E6E1] bg-[#FDFBF7] group hover:border-[#7C9082] transition-colors">
                        <div>
                          <p className="font-medium text-[#2C302E]">{customer?.name}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <p className="text-sm text-gray-500">{service?.name}</p>
                            {q.isReservation && q.scheduledTime && (
                              <Badge variant="neutral" className="text-[10px] px-1.5">{format(new Date(q.scheduledTime), 'HH:mm')}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={q.status === 'in-progress' ? 'warning' : 'default'} className="mb-1">
                              {q.status === 'in-progress' ? 'Sedang Dilayani' : 'Menunggu'}
                            </Badge>
                            
                            {/* Smart Action Buttons directly from Dashboard */}
                            {q.status === 'waiting' && q.therapistId && (
                              <Button 
                                size="sm" 
                                className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => dispatch({ type: 'UPDATE_QUEUE_STATUS', payload: { id: q.id, status: 'in-progress', startTime: new Date().toISOString() } })}
                              >
                                <Play className="w-3 h-3 mr-1" /> Mulai
                              </Button>
                            )}
                            {q.status === 'in-progress' && (
                              <Button 
                                size="sm" 
                                className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => dispatch({ type: 'UPDATE_QUEUE_STATUS', payload: { id: q.id, status: 'completed', endTime: new Date().toISOString() } })}
                              >
                                <Check className="w-3 h-3 mr-1" /> Selesai
                              </Button>
                            )}
                          </div>
                          {therapist && <p className="text-xs text-gray-500">Terapis: {therapist.name}</p>}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Status Terapis</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('therapists')} className="text-[#7C9082]">
              Kelola <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.therapists.map(t => {
                const activeItem = state.queue.find(q => q.therapistId === t.id && q.status === 'in-progress');
                let activeText = '';
                if (activeItem) {
                  if (activeItem.isBreak) {
                    activeText = 'Sedang Istirahat';
                  } else {
                    const svc = state.services.find(s => s.id === activeItem.serviceId);
                    const cust = state.customers.find(c => c.id === activeItem.customerId);
                    activeText = `${svc?.name || 'Layanan'} - ${cust?.name || 'Pelanggan'}`;
                  }
                }

                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#E8E6E1] flex items-center justify-center text-[#7C9082] font-medium">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#2C302E]">{t.name}</p>
                        {activeText ? (
                          <p className="text-xs text-orange-600 font-medium">{activeText}</p>
                        ) : (
                          <p className="text-xs text-gray-500">{t.specialties.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={t.status === 'available' ? 'success' : t.status === 'busy' ? 'warning' : 'neutral'}
                    >
                      {t.status === 'available' ? 'Tersedia' : t.status === 'busy' ? 'Sibuk' : 'Off'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
