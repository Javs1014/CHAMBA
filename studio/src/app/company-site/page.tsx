
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function CompanySitePage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col text-white">
      {/* Background Image is removed, the gradient from globals.css will show */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary to-blue-700" />


      {/* Navbar */}
      <nav className="sticky top-0 z-20 bg-green-800/90 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/company-site" className="flex items-center gap-2 text-xl font-bold">
                <Logo className="h-8 w-auto text-accent" />
                <span>Aquarius</span>
              </Link>
            </div>
            <div className="hidden md:flex space-x-4">
              <Link href="/company-site" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/company-site#" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">
                Products
              </Link>
              <Link href="/company-site#" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">
                Services
              </Link>
              <Link href="/company-site#" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link href="/company-site#" className="hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">
                Contact
              </Link>
              <Link href="/landing" className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-md text-sm font-medium">
                Client Portal
              </Link>
            </div>
            {/* Mobile menu button can be added here if needed */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center p-4 bg-black/30">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            GLOBAL Trade <br />
            BRINGS <span className="text-green-400">Development</span> <br />
            AROUND THE <br />
            GLOBE
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-200">
            Still not in the map? Dive into the globe with what we offer.
          </p>
          <Button
            className="mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-8 py-3 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            size="lg"
            onClick={() => {
              // Placeholder action for "Dive now"
              // In the future, this could scroll to a section or navigate
              console.log('Dive now clicked');
            }}
          >
            Dive now
          </Button>
        </div>
      </main>
    </div>
  );
}
