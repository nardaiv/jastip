import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-canvas-soft font-sans text-ink antialiased">

      <header className="sticky top-0 z-50 w-full bg-canvas border-b border-canvas-soft/85 py-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-black text-2xl text-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary stroke-[3px]"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="tracking-tight text-ink dark:text-zinc-50">Jastip</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-body-sm-strong text-ink dark:text-zinc-300">
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#featured-trips" className="hover:text-primary transition-colors">
              Featured Trips
            </a>
            <a href="#why-us" className="hover:text-primary transition-colors">
              Why Jastip
            </a>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <button className="button-primary text-sm font-semibold">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="button-secondary text-sm font-semibold px-5 py-2.5 h-10">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="button-primary text-sm font-semibold px-5 py-2.5 h-10">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">

            {/* Left Content Column */}
            <div className="space-y-8 lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-wise-green-pale border border-wise-green-neutral text-ink-deep text-xs font-semibold uppercase tracking-wider">
                🚀 Smart peer-to-peer delivery
              </div>

              <h1 className="text-display-xl text-ink font-black tracking-tight leading-[1.1]">
                Buy anything from anywhere, <br />
                <span className="text-emerald-700 dark:text-primary">
                  delivered by travelers.
                </span>
              </h1>

              <p className="text-body-lg text-body leading-relaxed max-w-2xl">
                Want a local delicacy, fashion brand, or product unavailable in your country? Connect with travelers visiting those countries and get it delivered safely.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                  <button className="button-primary w-full sm:w-auto text-base font-semibold h-12 px-8">
                    Start Ordering
                  </button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <button className="button-tertiary w-full sm:w-auto text-base font-semibold h-12 px-8">
                    See How It Works
                  </button>
                </a>
              </div>
            </div>

            {/* Right Card Mockup Column (Wise Signature Card Style) */}
            <div className="lg:col-span-5 relative">
              <div className="card-content max-w-sm mx-auto hover:scale-[1.02] transition-transform duration-300">

                {/* Traveler Card Title */}
                <div className="flex items-center justify-between border-b border-canvas-soft pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-canvas-soft flex items-center justify-center font-bold text-ink">
                      AM
                    </div>
                    <div>
                      <h4 className="text-body-sm-strong text-ink">Alex Morgan</h4>
                      <span className="text-caption text-mute">⭐️ 4.9 (42 reviews)</span>
                    </div>
                  </div>
                  <span className="badge-positive">
                    Active Trip
                  </span>
                </div>

                {/* Trip Route */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-emerald-600">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-caption font-semibold text-mute">DEPARTING FROM</span>
                    <span className="text-body-sm-strong text-ink">Tokyo, Japan (NRT)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-primary">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-caption font-semibold text-mute">ARRIVING TO</span>
                    <span className="text-body-sm-strong text-ink">Jakarta, Indonesia (CGK)</span>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-canvas-soft p-4 rounded-md space-y-2 border border-canvas-soft">
                  <div className="flex justify-between text-caption">
                    <span className="text-mute">Delivery Date</span>
                    <span className="font-semibold text-ink">Aug 20, 2026</span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span className="text-mute">Accepting up to</span>
                    <span className="font-semibold text-ink">10 kg remaining</span>
                  </div>
                </div>

                {/* Call to action inside card */}
                <Link href={user ? "/dashboard" : "/signup"} className="block mt-5">
                  <button className="button-primary w-full text-xs font-semibold py-2.5 rounded-xl">
                    Request Custom Purchase
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section (Content Band Style) */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-canvas text-ink border-t border-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-caption font-semibold uppercase tracking-wider text-emerald-700">Simple workflow</span>
            <h2 className="text-display-md text-ink font-black tracking-tight">
              Two roles, one seamless process
            </h2>
            <p className="text-body-md text-body">
              Whether you are looking to purchase foreign goods or wishing to offset your travel expenses.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2">

            {/* Buyer Path (card-feature-sage) */}
            <div className="card-feature-sage space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-canvas flex items-center justify-center font-bold text-lg">
                  🛍️
                </div>
                <h3 className="text-display-xs text-ink font-semibold">For Buyers</h3>
              </div>
              <ul className="space-y-4 text-body-sm text-body">
                <li className="flex gap-3">
                  <span className="font-bold text-ink">1.</span>
                  <span><strong>Submit requests:</strong> Create an order detailing what you want to buy, the price, and location.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-ink">2.</span>
                  <span><strong>Match traveler:</strong> A traveler flying from that origin route accepts your offer.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-ink">3.</span>
                  <span><strong>Secure escrow payment:</strong> Pay safely. Funds are held in escrow until delivery.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-ink">4.</span>
                  <span><strong>Deliver & Release:</strong> Meet up or receive your shipment, then release the traveler's payout.</span>
                </li>
              </ul>
            </div>

            {/* Traveler Path (card-feature-green) */}
            <div className="card-feature-green space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-canvas flex items-center justify-center font-bold text-lg">
                  ✈️
                </div>
                <h3 className="text-display-xs text-ink font-semibold">For Travelers</h3>
              </div>
              <ul className="space-y-4 text-body-sm text-body">
                <li className="flex gap-3">
                  <span className="font-bold text-ink">1.</span>
                  <span><strong>Publish Trip:</strong> Add your travel itinerary, departure/arrival ports, and available baggage weight.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-ink">2.</span>
                  <span><strong>Collect requests:</strong> Browse and accept shopping requests submitted by local buyers.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-ink">3.</span>
                  <span><strong>Shop & Deliver:</strong> Buy the items overseas, pack them in your luggage, and bring them home.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-ink">4.</span>
                  <span><strong>Earn tips:</strong> Deliver goods to buyers and receive your tip payouts directly into your wallet.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Trips Section (Sage-Tinted Canvas Soft surface) */}
      <section id="featured-trips" className="py-20 lg:py-28 bg-canvas-soft text-ink border-t border-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-caption font-semibold uppercase tracking-wider text-emerald-700">Popular Routes</span>
            <h2 className="text-display-md text-ink font-black tracking-tight">
              Featured active trips
            </h2>
            <p className="text-body-md text-body">
              Explore active listings to submit custom shopping requests to travelers today.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {/* Trip 1 */}
            <div className="card-content space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="badge-positive uppercase font-bold text-xs">Aug 15</span>
                <span className="text-caption text-mute">Available: 8 kg</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-lg text-ink">Singapore (SIN) ➔ Jakarta (CGK)</h4>
                <p className="text-caption text-mute">Traveler: Clarissa W.</p>
              </div>
              <Link href={user ? "/dashboard" : "/signup"} className="block">
                <button className="button-tertiary w-full text-sm font-semibold py-2">
                  Request Item
                </button>
              </Link>
            </div>

            {/* Trip 2 */}
            <div className="card-content space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="badge-positive uppercase font-bold text-xs">Aug 24</span>
                <span className="text-caption text-mute">Available: 15 kg</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-lg text-ink">Seoul, KR (ICN) ➔ Jakarta (CGK)</h4>
                <p className="text-caption text-mute">Traveler: Min-Ho K.</p>
              </div>
              <Link href={user ? "/dashboard" : "/signup"} className="block">
                <button className="button-tertiary w-full text-sm font-semibold py-2">
                  Request Item
                </button>
              </Link>
            </div>

            {/* Trip 3 */}
            <div className="card-content space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="badge-positive uppercase font-bold text-xs">Sep 02</span>
                <span className="text-caption text-mute">Available: 5 kg</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-lg text-ink">Bangkok, TH (BKK) ➔ Surabaya (SUB)</h4>
                <p className="text-caption text-mute">Traveler: Somchai P.</p>
              </div>
              <Link href={user ? "/dashboard" : "/signup"} className="block">
                <button className="button-tertiary w-full text-sm font-semibold py-2">
                  Request Item
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Wise-inspired Footer */}
      <footer className="mt-auto py-12 bg-ink text-canvas-soft border-t border-canvas-soft/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-body-sm text-canvas-soft/75">
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
