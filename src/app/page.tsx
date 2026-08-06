import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-800 dark:text-zinc-200">
      
      {/* Dynamic Glassmorphism Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/75 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 animate-pulse"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="tracking-tight text-zinc-900 dark:text-zinc-50">Jastip</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              How It Works
            </a>
            <a href="#featured-trips" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Featured Trips
            </a>
            <a href="#why-us" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Why Jastip
            </a>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-all px-5 py-2.5 rounded-full text-sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="cursor-pointer font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 rounded-full text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:shadow-lg active:scale-[0.98] px-5 py-2.5 rounded-full text-sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36 bg-linear-to-b from-blue-50/50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
        
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-900/15" />
          <div className="absolute -bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[120px] dark:bg-indigo-900/15" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Content Column */}
            <div className="space-y-8 lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
                🚀 Smart peer-to-peer delivery
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
                Buy anything from anywhere, <br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  delivered by travelers.
                </span>
              </h1>
              
              <p className="max-w-2xl mx-auto lg:mx-0 text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Want a local delicacy, fashion brand, or product unavailable in your country? Connect with travelers visiting those countries and get it delivered safely.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all rounded-full h-12 px-8">
                    Start Ordering
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto cursor-pointer font-bold border-zinc-200 hover:bg-zinc-100/80 dark:border-zinc-800 dark:hover:bg-zinc-900 rounded-full h-12 px-8">
                    See How It Works
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Card Mockup Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90 transition-all duration-300 hover:scale-[1.02]">
                
                {/* Traveler Card Title */}
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      AM
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Alex Morgan</h4>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">⭐️ 4.9 (42 reviews)</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                    Active Trip
                  </span>
                </div>

                {/* Trip Route */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-blue-600 dark:text-blue-400">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">DEPARTING FROM</span>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Tokyo, Japan (NRT)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-emerald-600 dark:text-emerald-400">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">ARRIVING TO</span>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Jakarta, Indonesia (CGK)</span>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl space-y-2.5 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Delivery Date</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Aug 20, 2026</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Accepting up to</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">10 kg remaining</span>
                  </div>
                </div>

                {/* Call to action inside card */}
                <Link href={user ? "/dashboard" : "/signup"} className="block mt-5">
                  <Button className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs">
                    Request Custom Purchase
                  </Button>
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Simple workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Two roles, one seamless process
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              Whether you are looking to purchase foreign goods or wishing to offset your travel expenses.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            
            {/* Buyer Path */}
            <div className="p-8 rounded-2xl border border-zinc-100 bg-zinc-50/30 dark:border-zinc-900 dark:bg-zinc-900/10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  🛍️
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">For Buyers</h3>
              </div>
              <ul className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span><strong>Submit requests:</strong> Create an order detailing what you want to buy, the price, and location.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span><strong>Match traveler:</strong> A traveler flying from that origin route accepts your offer.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span><strong>Secure escrow payment:</strong> Pay safely. Funds are held in escrow until delivery.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">4.</span>
                  <span><strong>Deliver & Release:</strong> Meet up or receive your shipment, then release the traveler's payout.</span>
                </li>
              </ul>
            </div>

            {/* Traveler Path */}
            <div className="p-8 rounded-2xl border border-zinc-100 bg-zinc-50/30 dark:border-zinc-900 dark:bg-zinc-900/10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  ✈️
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">For Travelers</h3>
              </div>
              <ul className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="flex gap-3">
                  <span className="font-bold text-indigo-600">1.</span>
                  <span><strong>Publish Trip:</strong> Add your travel itinerary, departure/arrival ports, and available baggage weight.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-indigo-600">2.</span>
                  <span><strong>Collect requests:</strong> Browse and accept shopping requests submitted by local buyers.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-indigo-600">3.</span>
                  <span><strong>Shop & Deliver:</strong> Buy the items overseas, pack them in your luggage, and bring them home.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-indigo-600">4.</span>
                  <span><strong>Earn tips:</strong> Deliver goods to buyers and receive your tip payouts directly into your wallet.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Mock Featured Trips Section */}
      <section id="featured-trips" className="py-20 lg:py-28 bg-zinc-50/50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Popular Routes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Featured active trips
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              Explore active listings to submit custom shopping requests to travelers today.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Trip 1 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900 px-2.5 py-0.5 rounded-full uppercase">Aug 15</span>
                <span className="text-xs text-zinc-400">Available: 8 kg</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Singapore (SIN) ➔ Jakarta (CGK)</h4>
                <p className="text-xs text-zinc-400">Traveler: Clarissa W.</p>
              </div>
              <Link href={user ? "/dashboard" : "/signup"} className="block">
                <Button variant="outline" size="sm" className="w-full cursor-pointer hover:bg-zinc-50">
                  Request Item
                </Button>
              </Link>
            </div>

            {/* Trip 2 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900 px-2.5 py-0.5 rounded-full uppercase">Aug 24</span>
                <span className="text-xs text-zinc-400">Available: 15 kg</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Seoul, KR (ICN) ➔ Jakarta (CGK)</h4>
                <p className="text-xs text-zinc-400">Traveler: Min-Ho K.</p>
              </div>
              <Link href={user ? "/dashboard" : "/signup"} className="block">
                <Button variant="outline" size="sm" className="w-full cursor-pointer hover:bg-zinc-50">
                  Request Item
                </Button>
              </Link>
            </div>

            {/* Trip 3 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900 px-2.5 py-0.5 rounded-full uppercase">Sep 02</span>
                <span className="text-xs text-zinc-400">Available: 5 kg</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Bangkok, TH (BKK) ➔ Surabaya (SUB)</h4>
                <p className="text-xs text-zinc-400">Traveler: Somchai P.</p>
              </div>
              <Link href={user ? "/dashboard" : "/signup"} className="block">
                <Button variant="outline" size="sm" className="w-full cursor-pointer hover:bg-zinc-50">
                  Request Item
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="mt-auto py-8 bg-zinc-900 text-zinc-400 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} Jastip App. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support Desk</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
