"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Plane,
  ShoppingBag,
  ShieldCheck,
  Search,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Fuse from "fuse.js";

interface Profile {
  id: string;
  email: string | null;
  role: string;
  is_active: boolean;
  full_name?: string | null;
}

interface AdminDashboardProps {
  initialProfiles: Profile[] | null;
}

// Dummy Trips Data
const DUMMY_TRIPS = [
  {
    id: "TRIP-001",
    traveler: "Clarissa Wijaya",
    from: "Singapore (SIN)",
    to: "Jakarta (CGK)",
    date: "Aug 15, 2026",
    baggage: "8 kg remaining",
    status: "upcoming",
  },
  {
    id: "TRIP-002",
    traveler: "Min-Ho Kim",
    from: "Seoul, KR (ICN)",
    to: "Jakarta (CGK)",
    date: "Aug 24, 2026",
    baggage: "15 kg remaining",
    status: "active",
  },
  {
    id: "TRIP-003",
    traveler: "Somchai Prasert",
    from: "Bangkok, TH (BKK)",
    to: "Surabaya (SUB)",
    date: "Sep 02, 2026",
    baggage: "5 kg remaining",
    status: "completed",
  },
  {
    id: "TRIP-004",
    traveler: "Alex Morgan",
    from: "Tokyo, JP (NRT)",
    to: "Jakarta (CGK)",
    date: "Aug 20, 2026",
    baggage: "10 kg remaining",
    status: "active",
  },
  {
    id: "TRIP-005",
    traveler: "Sarah Jenkins",
    from: "London, UK (LHR)",
    to: "Bali (DPS)",
    date: "Sep 10, 2026",
    baggage: "20 kg remaining",
    status: "cancelled",
  },
];

// Dummy Requests Data
const DUMMY_REQUESTS = [
  {
    id: "REQ-802",
    buyer: "Bob Miller",
    item: "Tokyo Banana Treat (Pack of 12)",
    price: "$35.00",
    traveler: "Alex Morgan",
    status: "accepted",
    escrow: "Held in Escrow",
  },
  {
    id: "REQ-803",
    buyer: "Jane Doe",
    item: "K-Beauty Velvet Lip Tint",
    price: "$18.00",
    traveler: "Min-Ho Kim",
    status: "purchased",
    escrow: "Held in Escrow",
  },
  {
    id: "REQ-804",
    buyer: "Michael Chen",
    item: "Gentle Monster Sunglasses",
    price: "$280.00",
    traveler: "None",
    status: "pending",
    escrow: "Awaiting Payment",
  },
  {
    id: "REQ-805",
    buyer: "Clara Wijaya",
    item: "Premium Thai Milk Tea Powder",
    price: "$25.00",
    traveler: "Somchai Prasert",
    status: "delivered",
    escrow: "Released to Traveler",
  },
  {
    id: "REQ-806",
    buyer: "David Vance",
    item: "French Perfume (Le Labo 50ml)",
    price: "$210.00",
    traveler: "None",
    status: "cancelled",
    escrow: "Refunded to Buyer",
  },
];

// Fallback Dummy Profiles (if DB is empty or fails)
const DUMMY_PROFILES: Profile[] = [
  // { id: "u-1", email: "alice.johnson@jastip.com", role: "admin", is_active: true, full_name: "Alice Johnson" },
  // { id: "u-2", email: "clara.w@gmail.com", role: "seller", is_active: true, full_name: "Clarissa Wijaya" },
  // { id: "u-3", email: "minho.k@gmail.com", role: "seller", is_active: true, full_name: "Min-Ho Kim" },
  // { id: "u-4", email: "bob.miller@gmail.com", role: "buyer", is_active: true, full_name: "Bob Miller" },
  // { id: "u-5", email: "jane.doe@yahoo.com", role: "buyer", is_active: false, full_name: "Jane Doe" },
];

export function AdminDashboard({ initialProfiles }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "trips" | "requests">(
    "users",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Merge database profiles with dummy profiles so there is always realistic data
  const usersList = useMemo(() => {
    const dbProfiles = initialProfiles || [];
    const dbEmails = new Set(
      dbProfiles.map((p) => p.email?.toLowerCase()).filter(Boolean),
    );
    const uniqueDummys = DUMMY_PROFILES.filter(
      (p) => !p.email || !dbEmails.has(p.email.toLowerCase()),
    );
    return [...dbProfiles, ...uniqueDummys];
  }, [initialProfiles]);

  // Statistics summaries
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const activeTripsCount = DUMMY_TRIPS.filter(
      (t) => t.status === "active" || t.status === "upcoming",
    ).length;
    const pendingRequestsCount = DUMMY_REQUESTS.filter(
      (r) => r.status === "pending" || r.status === "accepted",
    ).length;
    return {
      users: totalUsers,
      trips: activeTripsCount,
      requests: pendingRequestsCount,
      escrow: "$1,643.00",
    };
  }, [usersList]);

  const usersFuse = useMemo(() => {
    return new Fuse(usersList, {
      keys: ["full_name", "email", "id", "role"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [usersList]);

  const tripsFuse = useMemo(() => {
    return new Fuse(DUMMY_TRIPS, {
      keys: ["id", "traveler", "from", "to", "status", "baggage", "date"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, []);

  const requestsFuse = useMemo(() => {
    return new Fuse(DUMMY_REQUESTS, {
      keys: ["id", "buyer", "item", "price", "traveler", "status", "escrow"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return usersList;
    return usersFuse.search(query).map((result) => result.item);
  }, [usersFuse, usersList, searchQuery]);

  const filteredTrips = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return DUMMY_TRIPS;
    return tripsFuse.search(query).map((result) => result.item);
  }, [tripsFuse, searchQuery]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return DUMMY_REQUESTS;
    return requestsFuse.search(query).map((result) => result.item);
  }, [requestsFuse, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Top statistics summary panel */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users Stats Card */}
        <div className="card-content flex items-center justify-between p-6 border border-canvas-soft/85 hover:border-wise-green transition-all dark:bg-zinc-900 dark:border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-caption font-semibold text-mute uppercase tracking-wider">
              Total Members
            </span>
            <p className="text-display-xs font-black text-ink dark:text-zinc-50">
              {stats.users}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-positive font-bold">
              <TrendingUp className="h-3 w-3" />
              <span>+12% vs last month</span>
            </div>
          </div>
          <div className="p-3 bg-canvas-soft text-ink rounded-xl dark:bg-zinc-800 dark:text-zinc-300">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Trips Stats Card */}
        <div className="card-content flex items-center justify-between p-6 border border-canvas-soft/85 hover:border-wise-green transition-all dark:bg-zinc-900 dark:border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-caption font-semibold text-mute uppercase tracking-wider">
              Active Itineraries
            </span>
            <p className="text-display-xs font-black text-ink dark:text-zinc-50">
              {stats.trips}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-positive font-bold">
              <TrendingUp className="h-3 w-3" />
              <span>+3 new departures today</span>
            </div>
          </div>
          <div className="p-3 bg-canvas-soft text-ink rounded-xl dark:bg-zinc-800 dark:text-zinc-300">
            <Plane className="h-6 w-6" />
          </div>
        </div>

        {/* Requests Stats Card */}
        <div className="card-content flex items-center justify-between p-6 border border-canvas-soft/85 hover:border-wise-green transition-all dark:bg-zinc-900 dark:border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-caption font-semibold text-mute uppercase tracking-wider">
              Open Orders
            </span>
            <p className="text-display-xs font-black text-ink dark:text-zinc-50">
              {stats.requests}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span>96% fulfillment rate</span>
            </div>
          </div>
          <div className="p-3 bg-canvas-soft text-ink rounded-xl dark:bg-zinc-800 dark:text-zinc-300">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* Escrow Balance Card */}
        <div className="card-content flex items-center justify-between p-6 border border-canvas-soft/85 hover:border-wise-green transition-all dark:bg-zinc-900 dark:border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-caption font-semibold text-mute uppercase tracking-wider">
              Escrow Balance
            </span>
            <p className="text-display-xs font-black text-ink dark:text-zinc-50">
              {stats.escrow}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-positive font-bold">
              <span>Secured by Smart Trust</span>
            </div>
          </div>
          <div className="p-3 bg-wise-green-pale text-positive-deep rounded-xl dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Section Header with Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        {/* Navigation Tabs */}
        <div className="flex bg-canvas-soft p-1 rounded-xl w-fit dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
          <button
            onClick={() => {
              setActiveTab("users");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "users"
              ? "bg-white shadow-xs text-ink dark:bg-zinc-800 dark:text-white"
              : "text-mute hover:text-ink dark:hover:text-white"
              }`}
          >
            <Users className="h-4 w-4" />
            <span>Users ({filteredUsers.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("trips");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "trips"
              ? "bg-white shadow-xs text-ink dark:bg-zinc-800 dark:text-white"
              : "text-mute hover:text-ink dark:hover:text-white"
              }`}
          >
            <Plane className="h-4 w-4" />
            <span>Trips ({filteredTrips.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("requests");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "requests"
              ? "bg-white shadow-xs text-ink dark:bg-zinc-800 dark:text-white"
              : "text-mute hover:text-ink dark:hover:text-white"
              }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Requests ({filteredRequests.length})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mute">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-wise-green dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
          />
        </div>
      </div>

      {/* Tabs Tables Render */}
      <div className="bg-white rounded-2xl shadow-xs border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-mute"
                    >
                      No matching user profiles found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-canvas-soft text-ink font-bold border border-canvas-soft flex items-center justify-center dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                            {(profile.full_name ||
                              profile.email ||
                              "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {profile.full_name || "Anonymous Member"}
                            </div>
                            <div className="text-xs text-mute">
                              {profile.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                        {profile.id}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${profile.role === "admin"
                            ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                            : profile.role === "seller"
                              ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                              : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                            }`}
                        >
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${profile.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                            : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                        >
                          {profile.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "trips" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Trip ID</th>
                  <th className="px-6 py-4">Traveler</th>
                  <th className="px-6 py-4">Itinerary / Route</th>
                  <th className="px-6 py-4">Baggage / Weight</th>
                  <th className="px-6 py-4">Delivery Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-mute"
                    >
                      No matching trips found.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {trip.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {trip.traveler}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                          <span>{trip.from}</span>
                          <ArrowRight className="h-3 w-3 text-mute" />
                          <span>{trip.to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-xs">
                        {trip.baggage}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-xs">
                        {trip.date}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${trip.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                            : trip.status === "active"
                              ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                              : trip.status === "upcoming"
                                ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                        >
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Requested Item</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Assigned Traveler</th>
                  <th className="px-6 py-4">Escrow Status</th>
                  <th className="px-6 py-4">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-mute"
                    >
                      No matching shopping requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {req.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {req.buyer}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-zinc-950 dark:text-zinc-100 font-medium">
                        {req.item}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700 dark:text-wise-green">
                        {req.price}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {req.traveler === "None" ? (
                          <span className="text-mute font-normal italic">
                            Unassigned
                          </span>
                        ) : (
                          <span>{req.traveler}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${req.escrow.includes("Held")
                              ? "bg-amber-500 animate-pulse"
                              : req.escrow.includes("Released")
                                ? "bg-emerald-500"
                                : req.escrow.includes("Refunded")
                                  ? "bg-red-500"
                                  : "bg-zinc-400"
                              }`}
                          />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                            {req.escrow}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${req.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                            : req.status === "purchased" ||
                              req.status === "accepted"
                              ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                              : req.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
