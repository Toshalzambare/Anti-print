import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import toast from 'react-hot-toast';
import { Store, ShoppingCart, LogOut, FileText, Trash2, Eye, Edit2, MapPin, ArrowRight, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  storageKey: string;
  originalName: string;
  fileHash: string;
  pageCount: number;
  previewUrl?: string; 
  config: {
    color: 'bw' | 'color';
    side: 'single' | 'double';
    copies: number;
    pageRange: string; 
  };
}

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext)!;
  const navigate = useNavigate();
  
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShop, setSelectedShop] = useState<any>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Fetch Shops on Mount
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data } = await api.get('/shops');
        setShops(data);
      } catch (error) {
        toast.error('Could not load shops');
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  const handleUploadComplete = (files: any[]) => {
    const newItems = files.map(f => ({
      ...f,
      config: { 
        color: 'bw', 
        side: 'single', 
        copies: 1,
        pageRange: 'All' 
      }
    }));
    setCart(prev => [...prev, ...newItems]);
    toast.success(`${files.length} file(s) added!`);
  };

  const updateConfig = (index: number, key: string, value: any) => {
    const newCart = [...cart];
    newCart[index].config = { ...newCart[index].config, [key]: value };
    setCart(newCart);
  };

  const updatePageCount = (index: number, newCount: number) => {
    const newCart = [...cart];
    newCart[index].pageCount = newCount;
    setCart(newCart);
  };

  const calculateTotal = () => {
    if (!selectedShop) return 0;
    return cart.reduce((total, item) => {
      const rate = item.config.color === 'bw' 
        ? selectedShop.pricing.baseRate.bw 
        : selectedShop.pricing.baseRate.color;
      return total + (rate * item.pageCount * item.config.copies);
    }, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedShop) return;
    try {
      // 1. Create Order (Pending Payment)
      const { data: order } = await api.post('/orders', {
        shopId: selectedShop._id,
        items: cart
      });

      // 2. Initiate Mock Payment
      // In real Razorpay, we would get an order_id here and open the SDK
      await api.post('/orders/checkout', { orderId: order._id });
      
      // 3. Mock Payment Gateway (Alert for MVP)
      // "Product Level" simulation:
      const userConfirmed = window.confirm(
        `Authorized Payment Gateway (Mock)\n\n` + 
        `Merchant: ${selectedShop.name}\n` +
        `Amount: ₹${order.totalAmount}\n\n` + 
        `Click OK to Pay Securely`
      );
      
      if (userConfirmed) {
         // 4. Verify Payment
         await api.post('/orders/verify', {
            orderId: order._id,
            paymentId: `pay_mock_${Date.now()}`
         });
         
         toast.success('Payment Successful! Order sent to shop.');
         setCart([]);
      } else {
         toast.error('Payment Cancelled');
      }

    } catch (err: any) {
      console.error(err);
      toast.error('Order processing failed');
    }
  };

  // --- VIEW 1: SHOP SELECTION ---
  if (!selectedShop) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Store className="text-primary" />
            XeroxSaaS <span className="text-slate-400 font-normal">| Find a Shop</span>
          </h1>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Select a Print Shop</h2>
            <p className="text-slate-500">Choose a partner to start printing your documents.</p>
          </div>

          {loadingShops ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : shops.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500">No shops available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map(shop => (
                <div key={shop._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedShop(shop)}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{shop.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin size={14} /> {shop.address}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border
                      ${shop.status === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                    `}>
                      {shop.status}
                    </span>
                  </div>

                  <div className="flex gap-4 text-sm mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="block text-slate-400 text-xs uppercase font-bold">B&W</span>
                      <span className="font-bold text-slate-800">₹{shop.pricing.baseRate.bw}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase font-bold">Color</span>
                      <span className="font-bold text-slate-800">₹{shop.pricing.baseRate.color}</span>
                    </div>
                  </div>

                  <button className="w-full btn btn-outline group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all flex items-center justify-center gap-2">
                    Select Shop <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD (Shop Selected) ---
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Store className="text-primary" />
          XeroxSaaS <span className="text-slate-400 font-normal">| Student</span>
        </h1>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-xs text-slate-400">Printing at</span>
             <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
               {selectedShop.name}
               <button onClick={() => setSelectedShop(null)} className="text-primary text-[10px] uppercase font-bold bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20">Change</button>
             </span>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Upload & Config */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Upload Documents</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Info size={14}/>
                Current Shop Rates: <span className="font-bold text-slate-700">B&W ₹{selectedShop.pricing.baseRate.bw}</span> / <span className="font-bold text-slate-700">Color ₹{selectedShop.pricing.baseRate.color}</span>
              </div>
            </div>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </div>

          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                
                {/* File Header */}
                <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl">
                      <FileText size={24} className="text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{item.originalName}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {/* Editable Page Count */}
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                           <span>Pages:</span>
                           <input 
                              type="number" 
                              min="1"
                              className="w-12 bg-transparent text-center font-bold focus:outline-none focus:text-primary-hover"
                              value={item.pageCount}
                              onChange={(e) => updatePageCount(idx, parseInt(e.target.value) || 1)}
                           />
                           <Edit2 size={10} className="text-slate-400"/>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Preview Button */}
                    {item.previewUrl && (
                      <a href={item.previewUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary-hover hover:bg-primary/5 rounded-lg transition-colors" title="Preview File">
                        <Eye size={20} />
                      </a>
                    )}
                    <button onClick={() => {
                      const newCart = [...cart];
                      newCart.splice(idx, 1);
                      setCart(newCart);
                    }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Configuration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Color Mode */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Color Mode</label>
                    <select 
                      className="w-full input-field py-2 text-sm"
                      value={item.config.color}
                      onChange={(e) => updateConfig(idx, 'color', e.target.value)}
                    >
                      <option value="bw">Black & White</option>
                      <option value="color">Color</option>
                    </select>
                  </div>

                  {/* Sides */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Sides</label>
                    <select 
                      className="w-full input-field py-2 text-sm"
                      value={item.config.side}
                      onChange={(e) => updateConfig(idx, 'side', e.target.value)}
                    >
                      <option value="single">Single Side</option>
                      <option value="double">Double Side</option>
                    </select>
                  </div>

                  {/* Page Range */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Pages to Print</label>
                    <input 
                      type="text" 
                      className="w-full input-field py-2 text-sm"
                      placeholder="e.g. 1-5, 8"
                      value={item.config.pageRange}
                      onChange={(e) => updateConfig(idx, 'pageRange', e.target.value)}
                    />
                  </div>

                  {/* Copies */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Copies</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full input-field py-2 text-sm"
                      value={item.config.copies}
                      onChange={(e) => updateConfig(idx, 'copies', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

              </div>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <p>No documents added yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Checkout Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 sticky top-24">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <ShoppingCart className="text-primary" /> Order Summary
            </h3>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-sm pb-4 border-b border-slate-50 last:border-0">
                  <div className="w-2/3">
                    <p className="font-medium text-slate-800 truncate">{item.originalName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.config.color === 'color' ? 'Color' : 'B&W'} • Range: {item.config.pageRange} • {item.config.copies}x
                    </p>
                  </div>
                  <span className="font-bold text-slate-700">
                     ₹{((item.config.color === 'bw' ? selectedShop.pricing.baseRate.bw : selectedShop.pricing.baseRate.color) * item.pageCount * item.config.copies).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500">Total Amount</span>
                <span className="text-3xl font-bold text-slate-900">₹{calculateTotal().toFixed(2)}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full btn btn-primary font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay & Print
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;