import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Store, Loader2, Image as ImageIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ setPos, pos }: { setPos: any, pos: [number, number] }) => {
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
    },
  });
  return pos ? <Marker position={pos} /> : null;
};

const ShopSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([19.0760, 72.8777]); // Default Mumbai
  const [imgUrl, setImgUrl] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/shops', {
        name: formData.name,
        address: formData.address,
        location: { coordinates: coords },
        image: imgUrl
      });

      toast.success("Shop configured successfully!");
      navigate('/shop/dashboard'); 

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Visual */}
        <div className="bg-secondary p-8 text-white md:w-1/3 flex flex-col justify-between">
          <div>
            <Store className="mb-4 text-primary" size={40} />
            <h2 className="text-xl font-bold">One last step</h2>
            <p className="text-slate-400 text-sm mt-2">
              Tell students where to find you. Your shop will appear in search results immediately.
            </p>
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image URL</label>
                  <div className="relative">
                     <ImageIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                     <input 
                       className="input-field pl-10" 
                       placeholder="https://..."
                       value={imgUrl}
                       onChange={e => setImgUrl(e.target.value)}
                     />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                   <input 
                     required
                     className="input-field"
                     value={formData.address}
                     onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                </div>
            </div>

            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
               <MapContainer center={coords} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker setPos={setCoords} pos={coords} />
               </MapContainer>
               <div className="absolute top-2 right-2 z-[1000] bg-white px-2 py-1 rounded shadow text-xs font-bold">
                  Tap to set location
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