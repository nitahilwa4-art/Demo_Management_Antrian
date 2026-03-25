import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, Button, Modal, Input, Label, Select, Badge } from '../components/ui';
import { Plus, Search, Star } from 'lucide-react';

export function Therapists() {
  const { state, dispatch } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [status, setStatus] = useState<'available' | 'busy' | 'off'>('available');

  const filteredTherapists = state.therapists.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTherapist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialties) return;

    dispatch({
      type: 'ADD_THERAPIST',
      payload: {
        id: `t${Date.now()}`,
        name,
        specialties: specialties.split(',').map(s => s.trim()),
        status,
        rating: 5.0, // Default rating
      },
    });
    
    setIsAddModalOpen(false);
    setName('');
    setSpecialties('');
    setStatus('available');
  };

  const handleStatusChange = (id: string, newStatus: 'available' | 'busy' | 'off') => {
    dispatch({
      type: 'UPDATE_THERAPIST_STATUS',
      payload: { id, status: newStatus },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2C302E]">Daftar Terapis</h2>
          <p className="text-gray-500">Kelola jadwal dan status terapis</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Terapis
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Semua Terapis</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari nama terapis..." 
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
                  <th className="px-6 py-4 font-medium">Nama</th>
                  <th className="px-6 py-4 font-medium">Spesialisasi</th>
                  <th className="px-6 py-4 font-medium">Penilaian</th>
                  <th className="px-6 py-4 font-medium">Status Saat Ini</th>
                  <th className="px-6 py-4 font-medium text-right">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1]">
                {filteredTherapists.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada terapis yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTherapists.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#2C302E]">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8E6E1] flex items-center justify-center text-[#7C9082] font-medium">
                            {t.name.charAt(0)}
                          </div>
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {t.specialties.join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-[#2C302E]">
                          <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                          {t.rating.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start space-y-1">
                          <Badge 
                            variant={t.status === 'available' ? 'success' : t.status === 'busy' ? 'warning' : 'neutral'}
                          >
                            {t.status === 'available' ? 'Tersedia' : t.status === 'busy' ? 'Sibuk' : 'Off'}
                          </Badge>
                          {t.status === 'busy' && (
                            <span className="text-[10px] text-gray-500">
                              {(() => {
                                const activeItem = state.queue.find(q => q.therapistId === t.id && q.status === 'in-progress');
                                if (activeItem) {
                                  if (activeItem.isBreak) return 'Sedang Istirahat';
                                  const svcs = activeItem.serviceIds ? activeItem.serviceIds.map(id => state.services.find(s => s.id === id)).filter(Boolean) : [];
                                  const cust = state.customers.find(c => c.id === activeItem.customerId);
                                  return `${svcs.map(s => s?.name).join(', ') || 'Layanan'} - ${cust?.name || 'Pelanggan'}`;
                                }
                                return '';
                              })()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Select 
                          className="w-32 h-8 text-xs inline-block"
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value as 'available' | 'busy' | 'off')}
                        >
                          <option value="available">Tersedia</option>
                          <option value="busy">Sibuk</option>
                          <option value="off">Off</option>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Terapis Baru">
        <form onSubmit={handleAddTherapist} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input 
              id="name" 
              placeholder="Masukkan nama terapis" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialties">Spesialisasi (Pisahkan dengan koma)</Label>
            <Input 
              id="specialties" 
              placeholder="Contoh: Refleksi, Pijat Tradisional, Totok Wajah" 
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status Awal</Label>
            <Select 
              id="status" 
              value={status} 
              onChange={(e) => setStatus(e.target.value as 'available' | 'busy' | 'off')}
              required
            >
              <option value="available">Tersedia</option>
              <option value="busy">Sibuk</option>
              <option value="off">Off</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Terapis</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
