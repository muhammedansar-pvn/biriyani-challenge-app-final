import React, { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ onTrackClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (e, targetId) => {
    // If onTrackClick is not provided (meaning we are on /admin or another route)
    // we want to let the standard link behavior take over and navigate to homepage.
    if (!onTrackClick) return;

    e.preventDefault();
    setIsOpen(false);
    
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <nav className="fixed w-full z-50 bg-[#f0fdf4]/90 backdrop-blur-lg border-b border-green-200/40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <a href="/" className="font-extrabold text-lg tracking-wide text-slate-900 hover:text-green-700 transition-colors">
              ബിരിയാണി  <span className="text-brand-lime font-black"> ചലഞ്ച്</span>
            </a>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              <a 
                href="/#home" 
                onClick={(e) => handleNavClick(e, 'home')}
                className="text-slate-700 hover:text-brand-lime transition-colors px-2 py-1 rounded-md text-xs sm:text-sm font-extrabold"
              >
                Home
              </a>
              {onTrackClick && (
                <button 
                  onClick={onTrackClick}
                  className="text-slate-700 hover:text-brand-lime transition-colors px-2 py-1 rounded-md text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
                >
                  <Search size={14} />
                  My Orders
                </button>
              )}
              <a 
                href="/#order" 
                onClick={(e) => handleNavClick(e, 'order')}
                className="bg-brand-lime text-white hover:bg-brand-yellow transition-all px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md shadow-brand-lime/15 cursor-pointer border-none"
              >
                Order Now
              </a>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-600 hover:text-brand-lime hover:bg-green-50 transition-all focus:outline-none border-none bg-transparent"
            >
              {isOpen ? <X className="block h-5 w-5" /> : <Menu className="block h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-green-200/40 absolute w-full bg-[#f0fdf4]/95 backdrop-blur-lg shadow-xl"
        >
          <div className="px-3 pt-2 pb-4 space-y-1 sm:px-4">
            <a 
              href="/#home" 
              onClick={(e) => handleNavClick(e, 'home')} 
              className="text-slate-700 hover:bg-green-50/60 block px-4 py-2.5 rounded-xl text-base font-bold transition-all cursor-pointer"
            >
              Home
            </a>
            {onTrackClick && (
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => {
                    onTrackClick();
                  }, 100);
                }}
                className="text-slate-700 hover:bg-green-50/60 block w-full text-left px-4 py-2.5 rounded-xl text-base font-bold transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2"
              >
                <Search size={18} className="text-slate-500" />
                My Orders
              </button>
            )}
            <a 
              href="/#order" 
              onClick={(e) => handleNavClick(e, 'order')} 
              className="text-brand-lime bg-green-50/80 block px-4 py-2.5 rounded-xl text-base font-extrabold transition-all cursor-pointer"
            >
              Order Now
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default React.memo(Navbar);
