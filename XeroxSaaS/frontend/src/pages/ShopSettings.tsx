import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, IndianRupee, ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState({ bw: 0, color: 0 });

  // 1. Load current prices on mount
  useEffect(() => {
    api.get('/shops/my-shop')
      .then(({ data }) => {
        setRates({
          bw: data.pricing.baseRate.bw,
          color: data.pricing.baseRate.color
        });
      })
      .catch(() => toast.error('Could not load current prices'));
  }, []);

  // 2. Save new prices
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/shops/pricing', rates);
      toast.success('Prices updated successfully!');
    } catch (err) {
      toast.error('Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/shop/dashboard')} className="p-2 hover:bg-white rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-primary" /> Configuration
          </h1>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-lg text-slate-800">Pricing Engine</h2>
            <p className="text-sm text-slate-500">Set the base cost per page for students.</p>
          </div>
          
          <form onSubmit={handleSave} className="p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Black & White Input */}
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Black & White Rate</label>
                <div className="relative">
                  <IndianRupee size={18} className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary-hover transition-colors" />
                  <input 
                    type="number" 
                    step="0.1" // Allow decimals (e.g. 1.5 rupees)
                    className="input-field pl-10 text-lg font-bold text-slate-800"
                    value={rates.bw}
                    onChange={e => setRates({...rates, bw: parseFloat(e.target.value)})}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">Cost per single side</p>
              </div>

              {/* Color Input */}
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Color Rate</label>
                <div className="relative">
                  <IndianRupee size={18} className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                  <input 
                    type="number" 
                    step="0.5"
                    className="input-field pl-10 text-lg font-bold text-slate-800 focus:border-pink-500 focus:ring-pink-200"
                    value={rates.color}
                    onChange={e => setRates({...rates, color: parseFloat(e.target.value)})}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">Cost per single side</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary font-bold px-8"
              >
                {loading ? 'Saving...' : 'Update Prices'}
                {!loading && <Save size={18} />}
              </button>
            </div>

          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
          <strong>Tip:</strong> These prices update instantly for all <b>new</b> orders. Existing orders in the queue will keep their old price.
        </div>

      </div>
    </div>
  );
};

export default ShopSettings;