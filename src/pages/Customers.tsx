import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, Button, Modal, Input, Label } from '../components/ui';
import { Plus, Search, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function Customers({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { state, dispatch } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState('');

  const filteredCustomers = state.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    dispatch({
      type: 'ADD_CUSTOMER',
      payload: {
        id: `c${Date.now()}`,
        name,
        phone,
        email,
        preferences,
        totalVisits: 0,
      },
    });
    
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setPreferences('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2C302E]">Daftar Pelanggan</h2>
          <p className="text-gray-500">Kelola data dan riwayat kunjungan pelanggan</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pelanggan
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Semua Pelanggan</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari nama atau nomor HP..." 
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
                  <th className="px-6 py-4 font-medium">Kontak</th>
                  <th className="px-6 py-4 font-medium">Total Kunjungan</th>
                  <th className="px-6 py-4 font-medium">Kunjungan Terakhir</th>
                  <th className="px-6 py-4 font-medium">Preferensi</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada pelanggan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#2C302E]">
                        {c.name}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#2C302E]">{c.phone}</p>
                        {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                      </td>
                      <td className="px-6 py-4 text-[#2C302E]">
                        {c.totalVisits} kali
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.lastVisit ? format(new Date(c.lastVisit), 'dd MMM yyyy', { locale: id }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.preferences || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => {
                            // Smart Integration: Navigate to queue and trigger add modal
                            // We can use a global state or just navigate to queue
                            if (onNavigate) onNavigate('queue');
                          }}
                        >
                          <CalendarPlus className="w-3 h-3 mr-1" /> Buat Antrian
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Pelanggan Baru">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input 
              id="name" 
              placeholder="Masukkan nama pelanggan" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor HP</Label>
            <Input 
              id="phone" 
              type="tel"
              placeholder="0812xxxx" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Opsional)</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="email@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferences">Preferensi (Opsional)</Label>
            <Input 
              id="preferences" 
              placeholder="Contoh: Tekanan pijat kuat, alergi minyak tertentu" 
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Pelanggan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
