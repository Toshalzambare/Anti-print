import React from 'react';
import { Link } from 'react-router-dom';
import { Store, User, Printer, ShieldCheck, Zap, ArrowRight, LayoutDashboard, Database, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <Store className="text-primary" size={28} />
          <span className="text-xl font-bold text-slate-900 dark:text-white">XeroxSaaS</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
             {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
          </button>
          <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Log In</Link>
          <Link to="/register-shop" className="btn btn-primary text-sm py-2 px-4">Partner with Us</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden pt-20 pb-32 px-6">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 -skew-x-12 translate-x-1/4 -z-10" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-slate-800 dark:text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
               <Zap size={14} className="text-primary-hover"/> The Future of Printing
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
              Skip the Queue. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-hover to-green-500">Just Print.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">
              The smartest way to print documents. Upload from anywhere, pay securely, and pick up your prints in seconds.
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/login" className="btn btn-secondary px-8 py-4 text-lg">
                I'm a Student
              </Link>
              <Link to="/login" className="btn btn-primary px-8 py-4 text-lg">
                I Own a Shop
              </Link>
            </div>
          </div>
          <div className="relative">
             <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-all duration-500">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center"><User size={20}/></div>
                      <div>
                         <p className="font-bold text-slate-800">Rahul's Thesis.pdf</p>
                         <p className="text-xs text-slate-400">Ready for pickup • 45 Pages</p>
                      </div>
                   </div>
                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">READY</span>
                </div>
                <div className="space-y-3">
                   <div className="h-2 w-full bg-slate-100 rounded"></div>
                   <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                   <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                   <p className="font-bold text-xl">₹120.00</p>
                   <button className="btn btn-primary py-2 text-sm">Print Now</button>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-secondary text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
                <Printer className="text-primary"/>
                <div>
                   <p className="font-bold text-lg">500+</p>
                   <p className="text-xs text-slate-400">Shops Connected</p>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50 px-6">
         <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 dark:text-white">Why XeroxSaaS?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                     <Database size={24}/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 dark:text-white">Secure Storage</h3>
                  <p className="text-slate-500 dark:text-slate-400">Your documents are encrypted and automatically deleted after 24 hours. Privacy first.</p>
               </div>
               <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                     <LayoutDashboard size={24}/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 dark:text-white">Shop Dashboard</h3>
                  <p className="text-slate-500 dark:text-slate-400">Manage orders, track revenue, and set dynamic pricing with our powerful partner tools.</p>
               </div>
               <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                     <ShieldCheck size={24}/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 dark:text-white">Verified Partners</h3>
                  <p className="text-slate-500 dark:text-slate-400">Every shop is verified. See real-time "Open/Closed" status and live pricing.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 px-6 dark:bg-black">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <Store className="text-primary" size={24} />
               <span className="font-bold text-lg">XeroxSaaS</span>
            </div>
            <p className="text-slate-400 text-sm">© 2026 XeroxSaaS Inc. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-400">
               <a href="#" className="hover:text-primary">Privacy</a>
               <a href="#" className="hover:text-primary">Terms</a>
               <a href="#" className="hover:text-primary">Contact</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Landing;