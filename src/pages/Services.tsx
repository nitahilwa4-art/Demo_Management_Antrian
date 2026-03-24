import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, Button, Modal, Input, Label } from '../components/ui';
import { Plus, Search, Clock, DollarSign, Activity } from 'lucide-react';
import { isSameDay } from 'date-fns';

export function Services() {
  const { state, dispatch } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const filteredServices = state.services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !price) return;

    dispatch({
      type: 'ADD_SERVICE',
      payload: {
        id: `s${Date.now()}`,
        name,
        durationMinutes: parseInt(duration, 10),
        price: parseInt(price, 10),
        description,
      },
    });
    
    setIsAddModalOpen(false);
    setName('');
    setDuration('');
    setPrice('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2C302E]">Daftar Layanan</h2>
          <p className="text-gray-500">Kelola jenis layanan spa dan refleksi</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Layanan
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Semua Layanan</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari layanan..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-[#E8E6E1]">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama Layanan</th>
                  <th className="px-6 py-4 font-medium">Deskripsi</th>
                  <th className="px-6 py-4 font-medium">Durasi</th>
                  <th className="px-6 py-4 font-medium">Harga</th>
                  <th className="px-6 py-4 font-medium text-right">Dipesan Hari Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1]">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada layanan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((s) => {
                    const todayBookings = state.queue.filter(q => {
                      if (q.serviceId !== s.id) return false;
                      const itemDate = q.isReservation && q.scheduledTime ? new Date(q.scheduledTime) : new Date(q.createdAt);
                      return isSameDay(itemDate, new Date());
                    }).length;

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#2C302E]">
                          {s.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                          {s.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-[#2C302E]">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            {s.durationMinutes} Menit
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-[#2C302E] font-medium">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                            {s.price.toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center justify-end text-[#7C9082] bg-[#F4F1EB] px-2.5 py-1 rounded-full text-xs font-medium">
                            <Activity className="w-3 h-3 mr-1" />
                            {todayBookings} kali
                          </div>
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Layanan Baru">
        <form onSubmit={handleAddService} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Layanan</Label>
            <Input 
              id="name" 
              placeholder="Contoh: Pijat Tradisional" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi (Menit)</Label>
              <Input 
                id="duration" 
                type="number"
                min="1"
                placeholder="60" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input 
                id="price" 
                type="number"
                min="0"
                placeholder="150000" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Input 
              id="description" 
              placeholder="Penjelasan singkat tentang layanan" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Layanan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
