import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal, Input, Select, Label } from '../components/ui';
import { format, differenceInMinutes, parseISO, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, Play, Check, X, Clock, Calendar as CalendarIcon, List, GripVertical, CalendarClock, Users, Coffee, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const getSnappedDate = (date: Date | string | number) => {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const snappedMinutes = Math.round(minutes / 15) * 15;
  d.setMinutes(snappedMinutes, 0, 0);
  return d;
};

export const getQueueItemDuration = (item: any, services: any[]) => {
  if (item.customDuration) return item.customDuration;
  if (!item.serviceIds || item.serviceIds.length === 0) return 60;
  return item.serviceIds.reduce((total: number, id: string) => {
    const service = services.find(s => s.id === id);
    return total + (service?.durationMinutes || 0);
  }, 0);
};

export const getQueueItemPrice = (item: any, services: any[]) => {
  if (!item.serviceIds || item.serviceIds.length === 0) return 0;
  return item.serviceIds.reduce((total: number, id: string) => {
    const service = services.find(s => s.id === id);
    return total + (service?.price || 0);
  }, 0);
};

export function Queue() {
  const { state, dispatch } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'completed'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [notes, setNotes] = useState('');
  const [isReservation, setIsReservation] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [customDuration, setCustomDuration] = useState<number | ''>('');

  // Break State
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [breakTherapistId, setBreakTherapistId] = useState('');
  const [breakStartTime, setBreakStartTime] = useState('');
  const [breakDuration, setBreakDuration] = useState<number | ''>(15);
  const [isBreakNow, setIsBreakNow] = useState(true);

  // New Customer Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [dragOverTherapistId, setDragOverTherapistId] = useState<string | null>(null);
  const [dragOverTime, setDragOverTime] = useState<Date | null>(null);

  // Edit Schedule State
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [editIsReservation, setEditIsReservation] = useState(false);
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [editTherapistId, setEditTherapistId] = useState('');
  const [editCustomDuration, setEditCustomDuration] = useState<number | ''>('');

  const activeQueue = state.queue
    .filter(q => q.status === 'waiting' || q.status === 'in-progress')
    .sort((a, b) => {
      const timeA = a.isReservation && a.scheduledTime ? new Date(a.scheduledTime).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.isReservation && b.scheduledTime ? new Date(b.scheduledTime).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || selectedServiceIds.length === 0) return;
    if (isReservation && !scheduledTime) return;

    dispatch({
      type: 'ADD_TO_QUEUE',
      payload: {
        id: `q${Date.now()}`,
        customerId: selectedCustomerId,
        serviceIds: selectedServiceIds,
        therapistId: selectedTherapistId || undefined,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        notes,
        customDuration: customDuration ? Number(customDuration) : undefined,
        ...(isReservation && { isReservation: true, scheduledTime: new Date(scheduledTime).toISOString() }),
      },
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleAddBreak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakTherapistId || !breakDuration) return;
    if (!isBreakNow && !breakStartTime) return;

    const startTime = isBreakNow ? new Date().toISOString() : new Date(breakStartTime).toISOString();

    dispatch({
      type: 'ADD_TO_QUEUE',
      payload: {
        id: `b${Date.now()}`,
        therapistId: breakTherapistId,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        isReservation: true,
        scheduledTime: startTime,
        customDuration: Number(breakDuration),
        isBreak: true,
        notes: 'Istirahat',
      },
    });
    setIsBreakModalOpen(false);
    setBreakTherapistId('');
    setBreakStartTime('');
    setBreakDuration(15);
    setIsBreakNow(true);
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedServiceIds([]);
    setSelectedTherapistId('');
    setNotes('');
    setIsReservation(false);
    setScheduledTime('');
    setCustomDuration('');
  };

  const handleStartService = (queueId: string, therapistId: string) => {
    dispatch({
      type: 'UPDATE_QUEUE_STATUS',
      payload: { id: queueId, status: 'in-progress', therapistId, startTime: new Date().toISOString() },
    });
  };

  const handleFinishService = (queueId: string, therapistId?: string) => {
    dispatch({
      type: 'UPDATE_QUEUE_STATUS',
      payload: { id: queueId, status: 'completed', endTime: new Date().toISOString() },
    });
  };

  const handleCancelService = (queueId: string, therapistId?: string) => {
    dispatch({
      type: 'UPDATE_QUEUE_STATUS',
      payload: { id: queueId, status: 'cancelled' },
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    console.log('Drag start:', id);
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDragOverHour(hour);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverHour(null);
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDragOverHour(null);
    setDraggedId(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      const newTime = new Date(selectedDate);
      newTime.setHours(hour, 0, 0, 0);
      dispatch({
        type: 'UPDATE_QUEUE_SCHEDULE',
        payload: { id, scheduledTime: newTime.toISOString(), isReservation: true }
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverHour(null);
    setDragOverTherapistId(null);
    setDragOverTime(null);
  };

  const handleTimelineDragOver = (e: React.DragEvent, therapistId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTherapistId !== therapistId) {
      setDragOverTherapistId(therapistId);
    }

    // Calculate snapped time for visual feedback
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const totalMinutes = 15 * 60;
    const droppedMinutes = percentage * totalMinutes;
    const snappedMinutes = Math.round(droppedMinutes / 15) * 15;
    const newHour = 8 + Math.floor(snappedMinutes / 60);
    const newMinute = snappedMinutes % 60;
    
    const time = new Date(selectedDate);
    time.setHours(newHour, newMinute, 0, 0);
    setDragOverTime(time);
  };

  const handleTimelineDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTherapistId(null);
    setDragOverTime(null);
  };

  const handleTimelineDrop = (e: React.DragEvent<HTMLDivElement>, therapistId: string) => {
    e.preventDefault();
    console.log('Drop on therapist:', therapistId, 'draggedId:', draggedId);
    setDragOverTherapistId(null);

    if (!draggedId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    // 15 hours total (8 to 22) = 900 minutes
    const totalMinutes = 15 * 60;
    const droppedMinutes = percentage * totalMinutes;
    
    // Snap to nearest 15 minutes
    const snappedMinutes = Math.round(droppedMinutes / 15) * 15;

    const newHour = 8 + Math.floor(snappedMinutes / 60);
    const newMinute = snappedMinutes % 60;

    const draggedItem = state.queue.find(q => q.id === draggedId);
    if (!draggedItem) return;

    const baseDate = draggedItem.scheduledTime ? new Date(draggedItem.scheduledTime) : new Date(selectedDate);
    baseDate.setHours(newHour, newMinute, 0, 0);

    // Calculate duration
    const duration = getQueueItemDuration(draggedItem, state.services);
    
    let finalStartTime = baseDate.getTime();
    let finalEndTime = finalStartTime + duration * 60000;

    // Smart Overlap Prevention (Nyambung Jam)
    if (therapistId !== 'unassigned') {
      const therapistItems = state.queue.filter(q => {
        if (q.id === draggedId) return false;
        if (q.therapistId !== therapistId) return false;
        if (q.status === 'completed' || q.status === 'cancelled') return false;
        const qDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
        return isSameDay(qDate, baseDate);
      }).map(q => {
        const qDuration = getQueueItemDuration(q, state.services);
        const qDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
        const snappedStart = getSnappedDate(qDate).getTime();
        return { start: snappedStart, end: snappedStart + qDuration * 60000 };
      }).sort((a, b) => a.start - b.start);

      // Push forward if overlapping
      for (const item of therapistItems) {
        // If the new block overlaps with this item
        if (finalStartTime < item.end && finalEndTime > item.start) {
          // Snap to the end of the overlapping item
          finalStartTime = item.end;
          
          // Ensure the pushed start time is also snapped to the next 15-minute boundary
          const d = new Date(finalStartTime);
          const m = d.getMinutes();
          if (m % 15 !== 0) {
            d.setMinutes(Math.ceil(m / 15) * 15, 0, 0);
            finalStartTime = d.getTime();
          }
          
          finalEndTime = finalStartTime + duration * 60000;
        }
      }

      // If pushed past 22:00, reject drop
      if (new Date(finalStartTime).getHours() >= 22) {
        setDraggedId(null);
        return;
      }
    }

    baseDate.setTime(finalStartTime);

    dispatch({
      type: 'UPDATE_QUEUE_SCHEDULE',
      payload: {
        id: draggedId,
        scheduledTime: baseDate.toISOString(),
        isReservation: true,
        therapistId: therapistId === 'unassigned' ? null : therapistId,
      },
    });

    setDraggedId(null);
  };

  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;

    const newCustomerId = `c${Date.now()}`;
    dispatch({
      type: 'ADD_CUSTOMER',
      payload: {
        id: newCustomerId,
        name: newCustomerName,
        phone: newCustomerPhone,
        totalVisits: 0,
      },
    });
    
    setSelectedCustomerId(newCustomerId);
    setIsAddCustomerModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const openEditModal = (q: any) => {
    setEditingQueueId(q.id);
    setEditIsReservation(q.isReservation || false);
    setEditTherapistId(q.therapistId || '');
    setEditCustomDuration(q.customDuration || '');
    
    const timeToEdit = q.scheduledTime || q.createdAt;
    const d = new Date(timeToEdit);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    
    setEditScheduledTime(localISOTime);
    setIsEditModalOpen(true);
  };

  const [editShiftSubsequent, setEditShiftSubsequent] = useState(false);

  const handleUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQueueId) {
      const draggedItem = state.queue.find(q => q.id === editingQueueId);
      if (!draggedItem) return;

      const newDuration = editCustomDuration ? Number(editCustomDuration) : getQueueItemDuration(draggedItem, state.services);
      const newStartTime = new Date(editScheduledTime).getTime();
      const newEndTime = newStartTime + newDuration * 60000;

      dispatch({
        type: 'UPDATE_QUEUE_SCHEDULE',
        payload: {
          id: editingQueueId,
          scheduledTime: new Date(editScheduledTime).toISOString(),
          isReservation: editIsReservation,
          therapistId: editTherapistId || undefined,
          customDuration: editCustomDuration ? Number(editCustomDuration) : undefined,
        },
      });

      if (editShiftSubsequent && editTherapistId) {
        const therapistItems = state.queue.filter(q => {
          if (q.id === editingQueueId) return false;
          if (q.therapistId !== editTherapistId) return false;
          const qDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
          return isSameDay(qDate, new Date(editScheduledTime));
        }).map(q => {
          const qDuration = getQueueItemDuration(q, state.services);
          const qDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
          return { ...q, start: qDate.getTime(), duration: qDuration };
        }).sort((a, b) => a.start - b.start);

        let currentEndTime = newEndTime;
        for (const item of therapistItems) {
          if (item.start < currentEndTime) {
            const shift = currentEndTime - item.start;
            const newStart = item.start + shift;
            dispatch({
              type: 'UPDATE_QUEUE_SCHEDULE',
              payload: {
                id: item.id,
                scheduledTime: new Date(newStart).toISOString(),
                isReservation: true,
                therapistId: editTherapistId,
              },
            });
            currentEndTime = newStart + item.duration * 60000;
          } else {
            currentEndTime = item.start + item.duration * 60000;
          }
        }
      }
    }
    setIsEditModalOpen(false);
    setEditingQueueId(null);
    setEditShiftSubsequent(false);
  };

  // Generate hours for timeline view (08:00 to 22:00)
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2C302E]">Manajemen Antrian</h2>
          <p className="text-gray-500">Kelola antrian langsung dan jadwal reservasi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setIsBreakModalOpen(true);
            setIsBreakNow(true);
            setBreakDuration(15);
            setBreakTherapistId('');
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setBreakStartTime(now.toISOString().slice(0, 16));
          }}>
            <Coffee className="w-4 h-4 mr-2" />
            Istirahat
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Antrian
          </Button>
        </div>
      </div>

      <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl w-fit">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'list' ? 'bg-white text-[#2C302E] shadow-sm' : 'text-gray-500 hover:text-[#2C302E]'
          }`}
        >
          <List className="w-4 h-4 mr-2" />
          Daftar Aktif
        </button>
        <button
          onClick={() => setViewMode('completed')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'completed' ? 'bg-white text-[#2C302E] shadow-sm' : 'text-gray-500 hover:text-[#2C302E]'
          }`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Daftar Selesai
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'timeline' ? 'bg-white text-[#2C302E] shadow-sm' : 'text-gray-500 hover:text-[#2C302E]'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Jadwal Terapis
        </button>
      </div>

      {viewMode === 'timeline' && (
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E8E6E1] w-fit">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => { const next = new Date(d); next.setDate(next.getDate() - 1); return next; })}>
            &lt;
          </Button>
          <input
            type="date"
            className="text-sm border-none focus:ring-0"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => { const next = new Date(d); next.setDate(next.getDate() + 1); return next; })}>
            &gt;
          </Button>
        </div>
      )}

      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Antrian & Reservasi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-[#E8E6E1]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Waktu</th>
                    <th className="px-6 py-4 font-medium">Pelanggan</th>
                    <th className="px-6 py-4 font-medium">Layanan</th>
                    <th className="px-6 py-4 font-medium">Terapis</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1]">
                  {activeQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada antrian aktif saat ini.
                      </td>
                    </tr>
                  ) : (
                    activeQueue.map((q) => {
                      const customer = state.customers.find(c => c.id === q.customerId);
                      const services = q.serviceIds ? q.serviceIds.map(id => state.services.find(s => s.id === id)).filter(Boolean) : [];
                      const therapist = state.therapists.find(t => t.id === q.therapistId);
                      const availableTherapists = state.therapists.filter(t => t.status === 'available');

                      return (
                        <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {q.isReservation && q.scheduledTime ? (
                              <div>
                                <p className="font-medium text-[#7C9082]">{format(new Date(q.scheduledTime), 'HH:mm')}</p>
                                <Badge variant="neutral" className="mt-1 text-[10px] px-1.5">Reservasi</Badge>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium text-gray-500">{format(new Date(q.createdAt), 'HH:mm')}</p>
                                <Badge variant="neutral" className="mt-1 text-[10px] px-1.5">Walk-in</Badge>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {q.isBreak ? (
                              <div className="flex items-center text-gray-500 font-medium">
                                <Coffee className="w-4 h-4 mr-2" />
                                Waktu Istirahat
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-[#2C302E]">{customer?.name}</p>
                                {q.notes && <p className="text-xs text-gray-400 mt-1">Catatan: {q.notes}</p>}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {q.isBreak ? (
                              <p className="text-gray-500">{q.customDuration} mnt</p>
                            ) : (
                              <>
                                <p className="text-[#2C302E]">{services.map(s => s?.name).join(', ')}</p>
                                <p className="text-xs text-gray-500">{getQueueItemDuration(q, state.services)} mnt - Rp {getQueueItemPrice(q, state.services).toLocaleString('id-ID')}</p>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {q.status === 'waiting' && !q.isBreak ? (
                              <Select 
                                className="w-40 h-8 text-xs"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleStartService(q.id, e.target.value);
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Pilih Terapis...</option>
                                {availableTherapists.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </Select>
                            ) : (
                              <span className="font-medium text-[#7C9082]">{therapist?.name || 'Belum Ditugaskan'}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={q.status === 'in-progress' ? 'warning' : 'default'}>
                              {q.status === 'in-progress' ? (q.isBreak ? 'Sedang Istirahat' : 'Sedang Dilayani') : 'Menunggu'}
                            </Badge>
                            {q.status === 'in-progress' && q.startTime && (
                              <div className="flex items-center mt-2 text-xs text-orange-600 font-medium">
                                <Clock className="w-3 h-3 mr-1" />
                                {differenceInMinutes(new Date(), new Date(q.startTime))} / {q.isBreak ? q.customDuration : getQueueItemDuration(q, state.services)} mnt
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditModal(q)} title="Edit Jadwal">
                              <CalendarClock className="w-4 h-4" />
                            </Button>
                            {q.status === 'in-progress' && (
                              <Button size="sm" variant="success" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleFinishService(q.id, q.therapistId)}>
                                <Check className="w-4 h-4 mr-1" /> Selesai
                              </Button>
                            )}
                            <Button size="sm" variant="danger" onClick={() => handleCancelService(q.id, q.therapistId)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'completed' ? (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Selesai</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-[#E8E6E1]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Waktu Selesai</th>
                    <th className="px-6 py-4 font-medium">Pelanggan</th>
                    <th className="px-6 py-4 font-medium">Layanan</th>
                    <th className="px-6 py-4 font-medium">Terapis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1]">
                  {state.queue.filter(q => q.status === 'completed').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada antrian yang sudah selesai.
                      </td>
                    </tr>
                  ) : (
                    state.queue.filter(q => q.status === 'completed').map((q) => {
                      const customer = state.customers.find(c => c.id === q.customerId);
                      const services = q.serviceIds ? q.serviceIds.map(id => state.services.find(s => s.id === id)).filter(Boolean) : [];
                      const therapist = state.therapists.find(t => t.id === q.therapistId);
                      return (
                        <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-gray-500">
                            {q.endTime ? format(new Date(q.endTime), 'HH:mm') : '-'}
                          </td>
                          <td className="px-6 py-4 font-medium text-[#2C302E]">
                            {customer?.name}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[#2C302E]">{services.map(s => s?.name).join(', ')}</p>
                            <p className="text-xs text-gray-500">{getQueueItemDuration(q, state.services)} mnt - Rp {getQueueItemPrice(q, state.services).toLocaleString('id-ID')}</p>
                          </td>
                          <td className="px-6 py-4 text-[#7C9082]">
                            {therapist?.name}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Jadwal Terapis (Timeline)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[1000px] pb-4">
              {/* Header: Hours */}
              <div className="flex border-b border-[#E8E6E1] bg-gray-50/50 sticky top-0 z-10">
                <div className="w-48 shrink-0 border-r border-[#E8E6E1] p-4 font-medium text-gray-500">
                  Terapis
                </div>
                <div className="flex-1 relative h-12">
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="absolute top-0 bottom-0 border-l border-[#E8E6E1] px-2 py-3 text-xs font-medium text-gray-400"
                      style={{ left: `${(hour - 8) * (100 / 15)}%`, width: `${100 / 15}%` }}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Body: Therapists */}
              <div className="divide-y divide-[#E8E6E1]">
                {[...state.therapists, { id: 'unassigned', name: 'Belum Ditugaskan' }].map(therapist => {
                  const therapistItems = state.queue.filter(q => {
                    if (q.status === 'completed' || q.status === 'cancelled') return false;
                    const itemDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
                    if (!isSameDay(itemDate, selectedDate)) return false;
                    
                    if (therapist.id === 'unassigned') {
                      return !q.therapistId;
                    }
                    return q.therapistId === therapist.id;
                  });

                  return (
                    <div key={therapist.id} className="flex relative group hover:bg-gray-50/30 transition-colors">
                      <div className="w-48 shrink-0 border-r border-[#E8E6E1] p-4 bg-white z-10 flex items-center justify-between">
                        <span className="font-medium text-[#2C302E] truncate pr-2">{therapist.name}</span>
                        {therapist.id !== 'unassigned' && (
                          <Badge variant={(therapist as any).status === 'available' ? 'success' : (therapist as any).status === 'busy' ? 'warning' : 'neutral'} className="text-[10px] px-1.5 scale-90">
                            {(therapist as any).status}
                          </Badge>
                        )}
                      </div>
                      <div 
                        className={cn(
                          "flex-1 relative h-20 transition-colors",
                          dragOverTherapistId === therapist.id && "bg-blue-50/50"
                        )}
                        onDragOver={(e) => handleTimelineDragOver(e, therapist.id)}
                        onDragLeave={handleTimelineDragLeave}
                        onDrop={(e) => handleTimelineDrop(e, therapist.id)}
                      >
                        {/* Grid lines */}
                        {hours.map(hour => (
                          <React.Fragment key={hour}>
                            <div 
                              className="absolute top-0 bottom-0 border-l border-[#E8E6E1]/80"
                              style={{ left: `${(hour - 8) * (100 / 15)}%`, zIndex: 0 }}
                            />
                            {[15, 30, 45].map(min => (
                              <div 
                                key={`${hour}-${min}`}
                                className="absolute top-0 bottom-0 border-l border-[#E8E6E1]/30 border-dashed"
                                style={{ left: `${(hour - 8 + min/60) * (100 / 15)}%`, zIndex: 0 }}
                              />
                            ))}
                          </React.Fragment>
                        ))}
                        
                        {/* Ghost element for feedback */}
                        {dragOverTherapistId === therapist.id && dragOverTime && (
                          <div
                            className="absolute top-2 bottom-2 rounded-lg border-2 border-dashed border-[#7C9082] bg-[#7C9082]/10 z-10 pointer-events-none"
                            style={{
                              left: `${((dragOverTime.getHours() - 8) * 60 + dragOverTime.getMinutes()) / (15 * 60) * 100}%`,
                              width: `${(getQueueItemDuration(state.queue.find(q => q.id === draggedId) || {}, state.services) / (15 * 60)) * 100}%`
                            }}
                          />
                        )}
                        
                        {/* Items */}
                        {therapistItems.map(q => {
                          const rawDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
                          const itemDate = getSnappedDate(rawDate);
                          const startHour = itemDate.getHours();
                          const startMinute = itemDate.getMinutes();
                          
                          // Calculate position (8:00 is 0%)
                          const startMinutesFrom8 = (startHour - 8) * 60 + startMinute;
                          const leftPercent = Math.max(0, (startMinutesFrom8 / (15 * 60)) * 100);
                          
                          const services = q.serviceIds ? q.serviceIds.map(id => state.services.find(s => s.id === id)).filter(Boolean) : [];
                          const duration = getQueueItemDuration(q, state.services);
                          const elapsed = q.status === 'in-progress' && q.startTime ? differenceInMinutes(new Date(), new Date(q.startTime)) : 0;
                          const isDelayed = q.status === 'in-progress' && elapsed > duration;
                          const delay = isDelayed ? elapsed - duration : 0;
                          
                          const widthPercent = (duration / (15 * 60)) * 100;
                          
                          const customer = state.customers.find(c => c.id === q.customerId);

                          return (
                            <div
                              key={q.id}
                              draggable={true}
                              onDragStart={(e) => {
                                handleDragStart(e, q.id);
                              }}
                              onDragEnd={handleDragEnd}
                              onClick={() => openEditModal(q)}
                              className={cn(
                                "group/block absolute top-2 bottom-2 rounded-lg border shadow-sm hover:shadow-md transition-all z-20 hover:z-[100]",
                                q.status !== 'in-progress' ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
                                q.isBreak 
                                  ? "bg-gray-100 border-gray-300" 
                                  : isDelayed
                                    ? "bg-red-50 border-red-400 animate-pulse"
                                    : q.status === 'in-progress' 
                                      ? "bg-orange-50 border-orange-200" 
                                      : "bg-white border-[#7C9082]",
                                draggedId === q.id && "opacity-50 scale-95 z-30"
                              )}
                              style={{ 
                                left: `${leftPercent}%`, 
                                width: `${widthPercent}%`,
                                minWidth: '3rem'
                              }}
                            >
                              <div className="w-full h-full overflow-hidden p-2">
                                {q.isBreak ? (
                                  <div className="flex items-center justify-center h-full text-gray-500">
                                    <Coffee className="w-4 h-4 mr-1 shrink-0" />
                                    <span className="text-xs font-medium truncate">Istirahat</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-[#2C302E] truncate">{customer?.name}</span>
                                      {isDelayed && <span className="text-[10px] font-bold text-red-600">+{delay}m</span>}
                                      {q.status === 'in-progress' && !isDelayed && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0 ml-1" />}
                                    </div>
                                    <span className="text-[10px] text-gray-500 truncate">{services.map(s => s?.name).join(', ')}</span>
                                    <span className="text-[10px] text-gray-400 mt-auto truncate">
                                      {format(itemDate, 'HH:mm')} - {format(new Date(itemDate.getTime() + duration * 60000), 'HH:mm')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Smart Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/block:block w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-[100] pointer-events-none">
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                
                                {q.isBreak ? (
                                  <>
                                    <p className="font-semibold text-sm mb-1 flex items-center"><Coffee className="w-3.5 h-3.5 mr-1.5" /> Waktu Istirahat</p>
                                    <p className="text-gray-300">{format(itemDate, 'HH:mm')} - {format(new Date(itemDate.getTime() + duration * 60000), 'HH:mm')} ({duration} menit)</p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="font-semibold text-sm">{customer?.name}</span>
                                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", q.status === 'in-progress' ? "bg-orange-500/20 text-orange-300" : "bg-gray-700 text-gray-300")}>
                                        {q.status === 'in-progress' ? 'Sedang Dilayani' : 'Menunggu'}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 mb-1.5">{services.map(s => s?.name).join(', ')}</p>
                                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{format(itemDate, 'HH:mm')} - {format(new Date(itemDate.getTime() + duration * 60000), 'HH:mm')} ({duration} menit)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                      <span className="font-semibold text-gray-300">Total:</span>
                                      <span>Rp {getQueueItemPrice(q, state.services).toLocaleString('id-ID')}</span>
                                    </div>
                                    {q.notes && (
                                      <div className="mt-2 pt-2 border-t border-gray-700">
                                        <p className="text-gray-400 italic">"{q.notes}"</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title="Tambah Antrian / Reservasi">
        <form onSubmit={handleAddToQueue} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer">Pelanggan</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-[#7C9082] hover:text-[#5A6B5F] p-0"
                onClick={() => setIsAddCustomerModalOpen(true)}
              >
                + Pelanggan Baru
              </Button>
            </div>
            <Select 
              id="customer" 
              value={selectedCustomerId} 
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Pelanggan...</option>
              {state.customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Layanan (Bisa pilih lebih dari satu)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-[#E8E6E1] rounded-md bg-gray-50">
              {state.services.map(s => (
                <label key={s.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors border border-transparent hover:border-[#E8E6E1]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#7C9082] rounded border-gray-300 focus:ring-[#7C9082]"
                    checked={selectedServiceIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServiceIds([...selectedServiceIds, s.id]);
                      } else {
                        setSelectedServiceIds(selectedServiceIds.filter(id => id !== s.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.durationMinutes} mnt</p>
                  </div>
                  <div className="text-sm font-medium text-[#7C9082]">
                    Rp {s.price.toLocaleString('id-ID')}
                  </div>
                </label>
              ))}
            </div>
            {selectedServiceIds.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-[#7C9082]/10 rounded-md mt-2">
                <span className="text-sm font-medium text-[#2C302E]">Total:</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#7C9082]">
                    Rp {selectedServiceIds.reduce((total, id) => total + (state.services.find(s => s.id === id)?.price || 0), 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedServiceIds.reduce((total, id) => total + (state.services.find(s => s.id === id)?.durationMinutes || 0), 0)} menit
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="therapist">Terapis (Opsional)</Label>
              <Select 
                id="therapist" 
                value={selectedTherapistId} 
                onChange={(e) => setSelectedTherapistId(e.target.value)}
              >
                <option value="">Bebas / Siapa Saja</option>
                {state.therapists.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customDuration">Durasi (Menit)</Label>
              <Input 
                id="customDuration" 
                type="number"
                placeholder="Sesuai layanan" 
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl border border-[#E8E6E1] space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isReservation" 
                className="w-4 h-4 text-[#7C9082] rounded border-gray-300 focus:ring-[#7C9082]"
                checked={isReservation} 
                onChange={e => setIsReservation(e.target.checked)} 
              />
              <Label htmlFor="isReservation" className="cursor-pointer">Ini adalah Reservasi (Jadwal ke depan)</Label>
            </div>
            
            {isReservation && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="scheduledTime">Waktu Reservasi</Label>
                <Input 
                  type="datetime-local" 
                  id="scheduledTime" 
                  value={scheduledTime} 
                  onChange={e => setScheduledTime(e.target.value)} 
                  required={isReservation}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Input 
              id="notes" 
              placeholder="Contoh: Minta terapis perempuan" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>Batal</Button>
            <Button type="submit">Simpan ke Antrian</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} title="Tambah Pelanggan Baru">
        <form onSubmit={handleAddNewCustomer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newCustomerName">Nama Lengkap</Label>
            <Input 
              id="newCustomerName" 
              placeholder="Masukkan nama pelanggan" 
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newCustomerPhone">Nomor HP</Label>
            <Input 
              id="newCustomerPhone" 
              type="tel"
              placeholder="0812xxxx" 
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              required
            />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddCustomerModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Pelanggan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Jadwal Pelanggan">
        <form onSubmit={handleUpdateSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editTherapist">Terapis</Label>
              <Select 
                id="editTherapist" 
                value={editTherapistId} 
                onChange={(e) => setEditTherapistId(e.target.value)}
              >
                <option value="">Bebas / Siapa Saja</option>
                {state.therapists.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCustomDuration">Durasi (Menit)</Label>
              <Input 
                id="editCustomDuration" 
                type="number"
                placeholder="Sesuai layanan" 
                value={editCustomDuration}
                onChange={(e) => setEditCustomDuration(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-[#E8E6E1] space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="editIsReservation" 
                className="w-4 h-4 text-[#7C9082] rounded border-gray-300 focus:ring-[#7C9082]"
                checked={editIsReservation} 
                onChange={e => setEditIsReservation(e.target.checked)} 
              />
              <Label htmlFor="editIsReservation" className="cursor-pointer">Jadikan Reservasi (Tampil di Jadwal)</Label>
            </div>
            
            <div className="space-y-2 pl-6">
              <Label htmlFor="editScheduledTime">Waktu Jadwal</Label>
              <Input 
                type="datetime-local" 
                id="editScheduledTime" 
                value={editScheduledTime} 
                onChange={e => setEditScheduledTime(e.target.value)} 
                required
              />
            </div>
            <div className="flex items-center space-x-2 pl-6">
              <input 
                type="checkbox" 
                id="editShiftSubsequent" 
                className="w-4 h-4 text-[#7C9082] rounded border-gray-300 focus:ring-[#7C9082]"
                checked={editShiftSubsequent} 
                onChange={e => setEditShiftSubsequent(e.target.checked)} 
              />
              <Label htmlFor="editShiftSubsequent" className="cursor-pointer">Geser jadwal berikutnya secara otomatis</Label>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBreakModalOpen} onClose={() => setIsBreakModalOpen(false)} title="Tambah Waktu Istirahat">
        <form onSubmit={handleAddBreak} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="breakTherapist">Terapis</Label>
            <Select 
              id="breakTherapist" 
              value={breakTherapistId} 
              onChange={(e) => setBreakTherapistId(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Terapis...</option>
              {state.therapists.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Waktu Mulai</Label>
            <div className="flex items-center space-x-2 mb-2">
              <input 
                type="checkbox" 
                id="isBreakNow" 
                checked={isBreakNow} 
                onChange={(e) => setIsBreakNow(e.target.checked)}
                className="rounded border-gray-300 text-[#7C9082] focus:ring-[#7C9082]"
              />
              <Label htmlFor="isBreakNow" className="font-normal cursor-pointer">Mulai Sekarang</Label>
            </div>
            {!isBreakNow && (
              <Input 
                type="datetime-local" 
                id="breakStartTime" 
                value={breakStartTime} 
                onChange={e => setBreakStartTime(e.target.value)} 
                required={!isBreakNow}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakDuration">Durasi (Menit)</Label>
            <div className="flex gap-2 mb-2">
              {[15, 30, 45, 60].map(mins => (
                <Button
                  key={mins}
                  type="button"
                  variant={breakDuration === mins ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBreakDuration(mins)}
                  className="flex-1"
                >
                  {mins} mnt
                </Button>
              ))}
            </div>
            <Input 
              id="breakDuration" 
              type="number"
              placeholder="Atau ketik durasi manual..." 
              value={breakDuration}
              onChange={(e) => setBreakDuration(e.target.value ? Number(e.target.value) : '')}
              required
            />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsBreakModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Istirahat</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
