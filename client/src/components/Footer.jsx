import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass-panel mt-20 py-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">
              Biriyani <span className="text-brand-lime">Challenge</span>
            </span>
          </div>
          
          <div className="text-sm text-gray-400 flex items-center gap-1">
            Made with <Heart size={14} className="text-brand-lime" /> by <span className="font-cooper text-slate-700">SSF</span> Tirur Division
          </div>
          
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
