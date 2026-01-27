import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Store, MapPin, CheckCircle, Loader2 } from 'lucide-react';

const ShopSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    // We'll add detailed pricing configuration in the Settings page later.
    // For now, we use the smart defaults we set in the Backend Schema.
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // POST to /api/shops (Protected by the token we saved in login)
      await api.post('/shops', {
        name: formData.name,
        address: formData.address,
        location: { coordinates: [0, 0] } // Placeholder until we add Google Maps
      });

      toast.success("Shop configured successfully!");
      navigate('/shop/dashboard'); // Send them to the main hub

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Visual */}
        <div className="bg-secondary p-8 text-white md:w-1/3 flex flex-col justify-between">
          <div>
            <Store className="mb-4 text-primary" size={40} />
            <h2 className="text-xl font-bold">One last step</h2>
            <p className="text-slate-400 text-sm mt-2">
              Tell students where to find you. Your shop will appear in search results immediately.
            </p>
          </div>
          <div className="flex gap-2 items-center text-xs text-slate-500">
            <CheckCircle size={12} className="text-primary" />
            <span>Bank details can be added later</span>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-8 md:w-2/3">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Shop Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
              <input 
                required
                className="input-field" 
                placeholder="e.g. Campus Copy Center"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <textarea 
                  required
                  className="input-field pl-10 min-h-[100px] resize-none" 
                  placeholder="Building No, Street, Landmark..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={loading}
                className="w-full btn btn-primary font-bold"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Launch Dashboard'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ShopSetup;