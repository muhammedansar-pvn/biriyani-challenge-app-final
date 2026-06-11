import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

export const metadata = {
  title: 'ബിരിയാണി ചലഞ്ച് - SSF Tirur',
  description: 'Enjoy delicious, authentic biriyani and support our cultural festival. In aid of Sahithyolsav 2026.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Alfa+Slab+One&display=swap" rel="stylesheet" />
        <link href="https://smc.org.in/fonts/keraleeyam.css" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-brand-dark bg-pattern antialiased" suppressHydrationWarning>
        {children}
        <ToastContainer position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
