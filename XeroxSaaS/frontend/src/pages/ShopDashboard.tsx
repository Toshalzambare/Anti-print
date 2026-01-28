import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LayoutDashboard, LogOut, Printer, RefreshCw, CheckCircle, Clock, FileText, Layers, Palette, Power, UserPlus, X, Settings, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';

const ShopDashboard = () => {
  const { user, logout } = useContext(AuthContext)!;
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, printed: 0, revenue: 0 });
  const [socket, setSocket] = useState<any>(null);
  
  // UI States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>('pdf'); // 'pdf' or 'img'
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Employee Form
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPass, setEmpPass] = useState('');

  const downloadQR = () => {
     const svg = document.getElementById("shop-qr");
     if (!svg) return;
     const svgData = new XMLSerializer().serializeToString(svg);
     const canvas = document.createElement("canvas");
     const ctx = canvas.getContext("2d");
     const img = new Image();
     img.onload = () => {
       canvas.width = img.width;
       canvas.height = img.height;
       ctx?.drawImage(img, 0, 0);
       const pngFile = canvas.toDataURL("image/png");
       const downloadLink = document.createElement("a");
       downloadLink.download = `${shop.name}-QR.png`;
       downloadLink.href = pngFile;
       downloadLink.click();
     };
     img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // 1. Fetch Initial Data
  const fetchShopDetails = async () => {
    try {
      const { data } = await api.get('/shops/my-shop');
      setShop(data);
    } catch (err: any) { 
      // If Owner doesn't have a shop, send to setup
      if (err.response?.status === 404 && user?.role === 'OWNER') {
         navigate('/shop/setup');
      }
      console.error(err); 
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/shop');
      setOrders(data);
      updateStats(data);
    } catch (err) { }
  };

  const updateStats = (data: any[]) => {
    const pending = data.filter((o: any) => o.orderStatus === 'QUEUED').length;
    const printed = data.filter((o: any) => o.orderStatus === 'COMPLETED').length;
    const revenue = data.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    setStats({ pending, printed, revenue });
  };

  const handlePrint = () => {
    if (!previewUrl) return;
    
    if (previewType === 'pdf') {
      // Open PDF in new tab - Browser's native PDF viewer has the best Print UX
      window.open(previewUrl, '_blank');
    } else {
      // For Images, create a print-ready popup
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Document</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center;">
              <img src="${previewUrl}" style="max-width:100%; max-height:100vh;" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  useEffect(() => {
    fetchShopDetails();
    fetchOrders();

    // Socket.io Connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => { newSocket.close(); };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (socket && shop) {
      socket.emit('join_shop', shop._id);
      
      const handleNewOrder = (newOrder: any) => {
        toast(() => (
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <div>
               <p className="font-bold">New Order Received!</p>
               <p className="text-sm">#{newOrder._id.slice(-4)} • ₹{newOrder.totalAmount}</p>
            </div>
          </div>
        ), { duration: 5000, position: 'top-right' });
        
        setOrders(prev => {
           const updated = [newOrder, ...prev];
           updateStats(updated);
           return updated;
        });
      };

      socket.on('new_order', handleNewOrder);
      
      return () => {
        socket.off('new_order', handleNewOrder);
      };
    }
  }, [socket, shop]);


  // Actions
  const markCompleted = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'COMPLETED' });
      const updatedOrders = orders.map(o => o._id === orderId ? { ...o, orderStatus: 'COMPLETED' } : o);
      setOrders(updatedOrders);
      updateStats(updatedOrders);
      toast.success('Order Completed');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const [toggling, setToggling] = useState(false);

  const toggleStatus = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      console.log('Toggling status...');
      const { data } = await api.put('/shops/status');
      console.log('New Status:', data.status);
      
      // Force refresh from server to ensure UI is 100% sync
      await fetchShopDetails(); 
      
      toast.success(data.status === 'OPEN' ? 'Shop is now OPEN' : 'Shop is now CLOSED');
    } catch (e) { 
      console.error(e);
      toast.error('Failed to toggle status'); 
    } finally {
      setToggling(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/shops/employees', { name: empName, email: empEmail, password: empPass });
      toast.success('Employee added successfully');
      setShowEmployeeModal(false);
      setEmpName(''); setEmpEmail(''); setEmpPass('');
    } catch (e) { toast.error('Failed to add employee'); }
  };

  const openPreview = async (storageKey: string, originalName: string) => {
     try {
       const { data } = await api.post('/upload/presigned', { storageKey });
       setPreviewUrl(data.url);
       const ext = originalName.split('.').pop()?.toLowerCase();
       setPreviewType(['jpg', 'jpeg', 'png', 'gif'].includes(ext || '') ? 'img' : 'pdf');
     } catch (e) { toast.error('Could not load file'); }
  };

  const renderSpecs = (config: any) => {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${config.color === 'color' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          <Palette size={10} /> {config.color === 'color' ? 'COLOR' : 'B&W'}
        </span>
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${config.side === 'double' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
          <Layers size={10} /> {config.side === 'double' ? 'DUPLEX' : 'SINGLE'}
        </span>
        {config.copies > 1 && (
          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
            {config.copies} COPIES
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 relative">
      
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2"><Printer className="text-primary"/> XeroxSaaS</h2>
          <p className="text-xs text-slate-400 mt-1">Partner Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 text-primary rounded-xl cursor-pointer">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          {user?.role === 'OWNER' && (
             <button onClick={() => navigate('/shop/settings')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
               <Settings size={20} /> Settings
             </button>
          )}
        </nav>
        <div className="p-4 border-t border-slate-700"><button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut size={16} /> Logout</button></div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-10 gap-4">
          <div className="flex justify-between w-full md:w-auto items-center">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-slate-800">Shop Dashboard</h1>
               {shop && <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                 <span className="bg-slate-100 px-2 py-1 rounded font-mono">ID: {shop._id}</span>
                 {user?.role === 'OWNER' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">OWNER</span>}
               </div>}
            </div>
            {/* Mobile Logout */}
            <button onClick={() => { logout(); navigate('/login'); }} className="md:hidden text-slate-500 hover:text-red-500 p-2">
              <LogOut size={20} />
            </button>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
             {/* Shop Status Toggle (Owner Only) */}
             {user?.role === 'OWNER' && shop && (
               <button 
                 onClick={toggleStatus}
                 className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold transition-all text-xs md:text-sm whitespace-nowrap
                   ${shop.status === 'OPEN' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}
                 `}
               >
                 <Power size={16} />
                 {shop.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
               </button>
             )}
             
             {/* Add Employee (Owner Only) */}
             {user?.role === 'OWNER' && (
                <>
                <button onClick={() => setShowQR(true)} className="btn btn-outline flex items-center gap-2 text-xs md:text-sm whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2">
                  <QrCode size={16} /> <span className="hidden sm:inline">QR Code</span>
                </button>
                <button onClick={() => setShowEmployeeModal(true)} className="btn btn-outline flex items-center gap-2 text-xs md:text-sm whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2">
                  <UserPlus size={16} /> <span className="hidden sm:inline">Staff</span>
                </button>
                </>
             )}

             <button onClick={fetchOrders} className="p-2 text-slate-500 hover:text-primary-hover"><RefreshCw size={20}/></button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-8 w-full">
           {/* Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1">Queue Size</p><h3 className="text-3xl font-bold text-slate-900">{stats.pending}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1">Completed Today</p><h3 className="text-3xl font-bold text-slate-900">{stats.printed}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1">Revenue Estimate</p><h3 className="text-3xl font-bold text-primary-hover">₹{stats.revenue.toFixed(2)}</h3>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-lg">Live Orders</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr><th className="p-4">Order ID</th><th className="p-4">Student</th><th className="p-4">Files & Config</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No orders active.</td></tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-sm text-slate-500">#{order._id.slice(-6)}</td>
                        <td className="p-4 font-medium">{order.user?.name || 'Guest'}</td>
                        <td className="p-4">
                          <div className="space-y-3">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 font-medium text-slate-700">
                                  <FileText size={16} className="text-slate-400" />
                                  <span className="truncate max-w-[200px]">{item.originalName}</span>
                                  <button 
                                    onClick={() => openPreview(item.storageKey, item.originalName)}
                                    className="ml-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded font-bold transition-colors"
                                  >
                                    PREVIEW
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 pl-6">
                                  <span>Range: <b>{item.config.pageRange || 'All'}</b></span>
                                  <span>•</span>
                                  <span>{item.pageCount} Pgs</span>
                                </div>
                                <div className="pl-6">{renderSpecs(item.config)}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                            ${order.orderStatus === 'QUEUED' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {order.orderStatus === 'QUEUED' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.orderStatus === 'QUEUED' ? (
                            <button onClick={() => markCompleted(order._id)} className="btn bg-slate-900 text-white hover:bg-slate-800 text-xs py-2 px-4 shadow-none flex items-center gap-2">
                              <Printer size={16} /> Mark Done
                            </button>
                          ) : (
                            <span className="text-slate-400 text-sm">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* 1. Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={20}/> Document Preview</h3>
                <div className="flex gap-2">
                   <button onClick={handlePrint} className="btn btn-primary text-sm py-1.5 flex items-center gap-2">
                     <Printer size={16}/> Print Now
                   </button>
                   <a href={previewUrl} download className="btn btn-outline text-sm py-1.5" target="_blank" rel="noreferrer">Download File</a>
                   <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><X size={24}/></button>
                </div>
             </div>
             <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
                {previewType === 'pdf' ? (
                   <iframe src={previewUrl} className="w-full h-full rounded-xl bg-white shadow-sm" title="Preview"></iframe>
                ) : (
                   <img src={previewUrl} alt="Preview" className="max-w-full max-h-full rounded-xl shadow-lg" />
                )}
             </div>
          </div>
        </div>
      )}

      {/* 2. Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Add Employee</h3>
                <button onClick={() => setShowEmployeeModal(false)}><X size={24} className="text-slate-400 hover:text-red-500"/></button>
             </div>
             <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" required className="input-field" value={empName} onChange={e => setEmpName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required className="input-field" value={empEmail} onChange={e => setEmpEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required className="input-field" value={empPass} onChange={e => setEmpPass(e.target.value)} />
                </div>
                <button type="submit" className="w-full btn btn-primary flex justify-center items-center gap-2">
                  <UserPlus size={18} /> Create Account
                </button>
             </form>
          </div>
        </div>
      )}

      {/* 3. QR Code Modal */}
      {showQR && shop && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in">
              <h3 className="font-bold text-2xl mb-2">{shop.name}</h3>
              <p className="text-slate-500 mb-6 text-sm">Scan to upload documents here</p>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mb-6">
                 <QRCode 
                    id="shop-qr"
                    value={`${window.location.origin}/student/dashboard?shopId=${shop._id}`} 
                    size={200}
                    level="H"
                 />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={downloadQR} className="btn btn-primary">Download</button>
                 <button onClick={() => setShowQR(false)} className="btn btn-outline">Close</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ShopDashboard;