import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, X, Image as ImageIcon, List } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: ScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Check Permissions first
    Html5Qrcode.getCameras().then(devices => {
       if (devices && devices.length) {
          startScanner();
       } else {
          setError("No camera found");
       }
    }).catch(err => {
       setPermissionDenied(true);
       setError("Camera permission denied.");
    });

    return () => {
       if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
       }
    };
  }, []);

  const startScanner = () => {
     const scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false 
     );
     scannerRef.current = scanner;
     
     scanner.render((text) => {
        onScan(text);
        scanner.clear();
     }, (err) => {
        // Ignore frame errors
     });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const html5QrCode = new Html5Qrcode("reader-hidden");
        try {
           const decodedText = await html5QrCode.scanFile(file, true);
           onScan(decodedText);
        } catch (err) {
           toast.error("Could not find QR code in image");
        }
     }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
       <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-red-500"><X size={24}/></button>
          
          <h3 className="font-bold text-lg dark:text-white mb-4 text-center">Scan Shop QR</h3>
          
          <div className="min-h-[300px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden relative">
             {permissionDenied || error ? (
                <div className="text-center p-6 w-full">
                   <div className="bg-red-100 text-red-500 p-4 rounded-full inline-block mb-4"><AlertCircle size={32}/></div>
                   <p className="text-red-500 font-medium text-sm mb-6">{error || "Camera Access Required"}</p>
                   
                   <div className="space-y-3 w-full">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full btn btn-primary flex items-center justify-center gap-2"
                      >
                         <ImageIcon size={18}/> Scan from Gallery
                      </button>
                      
                      <button 
                        onClick={onClose}
                        className="w-full btn btn-outline flex items-center justify-center gap-2"
                      >
                         <List size={18}/> Select Shop from List
                      </button>
                   </div>
                </div>
             ) : (
                <div id="reader" className="w-full h-full"></div>
             )}
             
             {/* Hidden div for file scan logic */}
             <div id="reader-hidden" className="hidden"></div>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
             />
          </div>
          
          {!permissionDenied && !error && (
             <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4">
                Point camera at the QR code on the shop counter.
             </p>
          )}
       </div>
    </div>
  );
};

export default QRScanner;