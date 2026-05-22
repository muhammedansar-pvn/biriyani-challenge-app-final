import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-20 py-8 border-t border-green-200/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-slate-900">
              ബിരിയാണി<span className="text-brand-lime font-black">ചലഞ്ച്</span>
            </span>
          </div>
          
          <div className="text-sm text-slate-500 flex items-center gap-1 font-bold">
            Made with  by <span className="font-cooper text-brand-lime">SSF</span> Tirur Division Event crow          </div>
          
          <div className="text-sm text-slate-400 font-medium flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
            <span className="text-slate-300">|</span>
            <a 
              href="#/admin" 
              className="text-slate-450 hover:text-brand-lime transition-colors font-bold flex items-center gap-1"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
