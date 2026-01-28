import { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import toast from 'react-hot-toast';
import { Store, ShoppingCart, LogOut, FileText, Trash2, Eye, Edit2, MapPin, ArrowRight, Loader2, Info, QrCode, X, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
  const { logout } = useContext(AuthContext)!;
  const navigate = useNavigate();
  
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShop, setSelectedShop] = useState<any>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  // Calculate Distance (Haversine Formula)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const handleSelectShop = (shop: any) => {
     setSelectedShop(shop);
     navigate(`?shopId=${shop._id}`);
  };

  const handleClearShop = () => {
     setSelectedShop(null);
     navigate('/student/dashboard');
  };

  // Fetch Shops on Mount & Sort by Location
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data } = await api.get('/shops');
        let sortedShops = data;

        // Try to get user location for sorting
        if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude, longitude } = pos.coords;
              
              sortedShops = data.map((shop: any) => {
                 const [shopLat, shopLng] = shop.location?.coordinates || [0,0];
                 const dist = getDistance(latitude, longitude, shopLat, shopLng);
                 return { ...shop, distance: dist };
              }).sort((a: any, b: any) => a.distance - b.distance);
              
              setShops(sortedShops);
           }, () => {
              setShops(data);
           });
        } else {
           setShops(data);
        }

        // Check URL for initial selection
        const params = new URLSearchParams(window.location.search);
        const shopIdParam = params.get('shopId');
        if (shopIdParam) {
           const targetShop = data.find((s: any) => s._id === shopIdParam);
           if (targetShop) setSelectedShop(targetShop);
        }

      } catch (error) {
        toast.error('Could not load shops');
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  // Sync back button (popstate)
  useEffect(() => {
     const handlePopState = () => {
        const params = new URLSearchParams(window.location.search);
        const shopId = params.get('shopId');
        if (!shopId) setSelectedShop(null);
     };
     window.addEventListener('popstate', handlePopState);
     return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize Scanner when modal opens
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner) {
       const timer = setTimeout(() => {
          scanner = new Html5QrcodeScanner(
             "reader", 
             { fps: 10, qrbox: { width: 250, height: 250 } },
             false 
          );
          
          scanner.render((decodedText) => {
             try {
                const url = new URL(decodedText);
                const shopId = url.searchParams.get('shopId');
                if (shopId) {
                   const target = shops.find(s => s._id === shopId);
                   if (target) {
                      handleSelectShop(target);
                      toast.success(`Found Shop: ${target.name}`);
                      scanner?.clear();
                      setShowScanner(false);
                   } else {
                      toast.error('Shop not found');
                   }
                }
             } catch (e) {
                const target = shops.find(s => s._id === decodedText);
                if (target) {
                   handleSelectShop(target);
                   scanner?.clear();
                   setShowScanner(false);
                }
             }
          }, () => {});
          
       }, 100);
       return () => {
         clearTimeout(timer);
         if (scanner) {
           scanner.clear().catch(console.error);
         }
       };
    }
  }, [showScanner, shops]);

  const fetchMyOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setMyOrders(data);
    } catch (e) { }
  };

  const handleCancelOrder = async (orderId: string) => {
    if(!window.confirm('Are you sure you want to cancel? Refund will be initiated.')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled & Refunded');
      fetchMyOrders(); 
    } catch (e) {
      toast.error('Could not cancel order');
    }
  };

  useEffect(() => {
    if (showOrdersModal) fetchMyOrders();
  }, [showOrdersModal]);

  const handleUploadComplete = (files: any[]) => {
    const newItems = files.map(f => ({
      ...f,
      config: { color: 'bw', side: 'single', copies: 1, pageRange: 'All' }
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
      const isColor = item.config.color === 'color';
      const isDouble = item.config.side === 'double';
      const totalPages = item.pageCount * item.config.copies;
      let rate = 0;
      const bulk = selectedShop.pricing.bulkDiscount;
      if (bulk && bulk.enabled && totalPages >= bulk.threshold) {
         rate = isColor ? bulk.colorPrice : bulk.bwPrice;
      } else {
         if (isColor) {
            rate = isDouble ? selectedShop.pricing.color.double : selectedShop.pricing.color.single;
         } else {
            rate = isDouble ? selectedShop.pricing.bw.double : selectedShop.pricing.bw.single;
         }
      }
      return total + (rate * totalPages);
    }, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedShop) return;
    try {
      const { data: order } = await api.post('/orders', {
        shopId: selectedShop._id,
        items: cart
      });
      await api.post('/orders/checkout', { orderId: order._id });
      const userConfirmed = window.confirm(
        `Authorized Payment Gateway (Mock)\n\n` + 
        `Merchant: ${selectedShop.name}\n` + 
        `Amount: ₹${order.totalAmount}\n\n` + 
        `Click OK to Pay Securely`
      );
      if (userConfirmed) {
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
          <div className="flex gap-4">
             <button onClick={() => setShowOrdersModal(true)} className="btn btn-outline flex items-center gap-2">
               <Clock size={18} /> My Orders
             </button>
             <button onClick={() => setShowScanner(true)} className="btn btn-primary flex items-center gap-2">
               <QrCode size={18} /> Scan Shop QR
             </button>
             <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-2">
               <LogOut size={16} /> Logout
             </button>
          </div>
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
                <div key={shop._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => handleSelectShop(shop)}>
                  {/* Shop Image if available */}
                  {shop.image ? (
                     <div className="h-32 w-full bg-cover bg-center rounded-xl mb-4" style={{backgroundImage: `url(${shop.image.replace('minio:9000', 'localhost:9000')})`}} />
                  ) : (
                     <div className="h-32 w-full bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-300">
                        <Store size={40} />
                     </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{shop.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin size={14} /> {shop.address}
                        {shop.distance !== undefined && <span className="text-xs font-bold text-primary ml-2">• {shop.distance.toFixed(1)} km</span>}
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
                      <span className="block text-slate-400 text-xs uppercase font-bold">B&W (S)</span>
                      <span className="font-bold text-slate-800">₹{shop.pricing?.bw?.single || 0}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase font-bold">Color (S)</span>
                      <span className="font-bold text-slate-800">₹{shop.pricing?.color?.single || 0}</span>
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
        
        {/* Scanner Modal */}
        {showScanner && (
           <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Scan QR Code</h3>
                    <button onClick={() => setShowScanner(false)}><X/></button>
                 </div>
                 <div id="reader" className="rounded-xl overflow-hidden border border-slate-200"></div>
                 <p className="text-center text-slate-500 text-sm mt-4">Point your camera at a shop's QR code</p>
              </div>
           </div>
        )}

        {/* My Orders Modal */}
        {showOrdersModal && (
           <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg">My Orders</h3>
                    <button onClick={() => setShowOrdersModal(false)}><X/></button>
                 </div>
                 <div className="flex-1 overflow-auto p-4 space-y-4">
                    {myOrders.length === 0 ? <p className="text-center text-slate-400 py-10">No orders yet.</p> : 
                       myOrders.map(order => (
                          <div key={order._id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="font-bold text-slate-800">#{order._id.slice(-4)}</span>
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ 
                                      order.orderStatus === 'QUEUED' ? 'bg-yellow-100 text-yellow-700' :
                                      order.orderStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                      order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                                   }`}>{order.orderStatus}</span>
                                </div>
                                <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()} • ₹{order.totalAmount}</p>
                             </div>
                             {order.orderStatus === 'QUEUED' && (
                                <button onClick={() => handleCancelOrder(order._id)} className="btn btn-outline text-red-500 hover:bg-red-50 border-red-200 text-xs py-1.5">
                                   Cancel & Refund
                                </button>
                             )}
                          </div>
                       ))
                    }
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD (Shop Selected) ---
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={handleClearShop} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Back to Shops">
             <ArrowLeft size={20} />
           </button>
           <h1 className="text-xl font-bold flex items-center gap-2">
             <Store className="text-primary" />
             <span className="hidden md:inline">XeroxSaaS <span className="text-slate-400 font-normal">| Student</span></span>
           </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-xs text-slate-400">Printing at</span>
             <span className="text-sm font-bold text-slate-800">{selectedShop.name}</span>
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
                Current Shop Rates: <span className="font-bold text-slate-700">B&W ₹{selectedShop.pricing?.bw?.single}</span> / <span className="font-bold text-slate-700">Color ₹{selectedShop.pricing?.color?.single}</span>
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
                     ₹{((item.config.color === 'bw' ? selectedShop.pricing?.bw?.single : selectedShop.pricing?.color?.single) * item.pageCount * item.config.copies).toFixed(2)}
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
