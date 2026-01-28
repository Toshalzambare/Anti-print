import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (date) params.append('startDate', date);
      
      const { data } = await api.get(`/orders/history?${params.toString()}`);
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/shop/dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Order History</h1>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
           <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input 
                   className="input-field pl-10 w-full md:w-64" 
                   placeholder="Search by Name or Order ID"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
              <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input 
                   type="date"
                   className="input-field pl-10"
                   value={date}
                   onChange={e => setDate(e.target.value)}
                 />
              </div>
           </div>
           <button onClick={fetchHistory} className="btn btn-primary flex items-center gap-2">
              <Filter size={16} /> Apply Filters
           </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                 <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                 ) : orders.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No records found.</td></tr>
                 ) : (
                    orders.map(order => (
                       <tr key={order._id} className="hover:bg-slate-50">
                          <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 font-mono text-xs">{order._id.slice(-6)}</td>
                          <td className="p-4 font-medium">{order.user?.name || 'Guest'}</td>
                          <td className="p-4">{order.items.length} Files</td>
                          <td className="p-4 font-bold">₹{order.totalAmount}</td>
                          <td className="p-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                order.orderStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                             }`}>
                                {order.orderStatus}
                             </span>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </main>
    </div>
  );
};

export default ShopHistory;