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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  MinusSquare,
  RotateCcw,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";
import Fuse from "fuse.js";

interface Profile {
  id: string;
  email: string | null;
  role: string;
  is_active: boolean;
  full_name?: string | null;
}

type UserSortField = "name" | "id" | "role" | "status";
type TripSortField = "id" | "traveler" | "route" | "baggage" | "date" | "status";
type RequestSortField =
  | "id"
  | "buyer"
  | "item"
  | "price"
  | "traveler"
  | "escrow"
  | "status";

type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | "admin" | "seller" | "buyer";
type TripStatusFilter =
  | "all"
  | "active"
  | "upcoming"
  | "completed"
  | "cancelled";
type RequestStatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "purchased"
  | "delivered"
  | "cancelled";
type RequestEscrowFilter = "all" | "held" | "released" | "awaiting" | "refunded";

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
const DUMMY_PROFILES: Profile[] = [];

export function AdminDashboard({ initialProfiles }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "trips" | "requests">(
    "users",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Users Filter and Sort State
  const [userStatusFilter, setUserStatusFilter] = useState<StatusFilter>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<RoleFilter>("all");
  const [userSortField, setUserSortField] = useState<UserSortField>("name");
  const [userSortOrder, setUserSortOrder] = useState<SortDirection>("asc");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Trips Filter and Sort State
  const [tripStatusFilter, setTripStatusFilter] =
    useState<TripStatusFilter>("all");
  const [tripSortField, setTripSortField] = useState<TripSortField>("date");
  const [tripSortOrder, setTripSortOrder] = useState<SortDirection>("asc");
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  // Requests Filter and Sort State
  const [requestStatusFilter, setRequestStatusFilter] =
    useState<RequestStatusFilter>("all");
  const [requestEscrowFilter, setRequestEscrowFilter] =
    useState<RequestEscrowFilter>("all");
  const [requestSortField, setRequestSortField] =
    useState<RequestSortField>("id");
  const [requestSortOrder, setRequestSortOrder] =
    useState<SortDirection>("asc");
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

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
    let list = usersList;
    const query = searchQuery.trim();
    if (query) {
      list = usersFuse.search(query).map((result) => result.item);
    }

    // Filter by Status
    if (userStatusFilter !== "all") {
      const isActive = userStatusFilter === "active";
      list = list.filter((user) => user.is_active === isActive);
    }

    // Filter by Role
    if (userRoleFilter !== "all") {
      list = list.filter(
        (user) => user.role.toLowerCase() === userRoleFilter.toLowerCase(),
      );
    }

    // Sort
    if (userSortField) {
      list = [...list].sort((a, b) => {
        let comp = 0;
        if (userSortField === "name") {
          const valA = (a.full_name || a.email || "").toLowerCase();
          const valB = (b.full_name || b.email || "").toLowerCase();
          comp = valA.localeCompare(valB);
        } else if (userSortField === "id") {
          comp = a.id.localeCompare(b.id);
        } else if (userSortField === "role") {
          comp = a.role.localeCompare(b.role);
        } else if (userSortField === "status") {
          const valA = a.is_active ? 1 : 0;
          const valB = b.is_active ? 1 : 0;
          comp = valA - valB;
        }

        return userSortOrder === "asc" ? comp : -comp;
      });
    }

    return list;
  }, [
    usersFuse,
    usersList,
    searchQuery,
    userStatusFilter,
    userRoleFilter,
    userSortField,
    userSortOrder,
  ]);

  // Filtered & Sorted Trips
  const filteredTrips = useMemo(() => {
    let list = DUMMY_TRIPS;
    const query = searchQuery.trim();
    if (query) {
      list = tripsFuse.search(query).map((result) => result.item);
    }

    // Filter by Status
    if (tripStatusFilter !== "all") {
      list = list.filter(
        (trip) => trip.status.toLowerCase() === tripStatusFilter.toLowerCase(),
      );
    }

    // Sort
    if (tripSortField) {
      list = [...list].sort((a, b) => {
        let comp = 0;
        if (tripSortField === "id") {
          comp = a.id.localeCompare(b.id);
        } else if (tripSortField === "traveler") {
          comp = a.traveler.localeCompare(b.traveler);
        } else if (tripSortField === "route") {
          const routeA = `${a.from} -> ${a.to}`;
          const routeB = `${b.from} -> ${b.to}`;
          comp = routeA.localeCompare(routeB);
        } else if (tripSortField === "baggage") {
          const numA = parseFloat(a.baggage) || 0;
          const numB = parseFloat(b.baggage) || 0;
          comp = numA - numB;
        } else if (tripSortField === "date") {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          comp = timeA - timeB;
        } else if (tripSortField === "status") {
          comp = a.status.localeCompare(b.status);
        }

        return tripSortOrder === "asc" ? comp : -comp;
      });
    }

    return list;
  }, [
    tripsFuse,
    searchQuery,
    tripStatusFilter,
    tripSortField,
    tripSortOrder,
  ]);

  const filteredRequests = useMemo(() => {
    let list = DUMMY_REQUESTS;
    const query = searchQuery.trim();
    if (query) {
      list = requestsFuse.search(query).map((result) => result.item);
    }

    // Filter by Order Status
    if (requestStatusFilter !== "all") {
      list = list.filter(
        (req) =>
          req.status.toLowerCase() === requestStatusFilter.toLowerCase(),
      );
    }

    // Filter by Escrow Status
    if (requestEscrowFilter !== "all") {
      list = list.filter((req) => {
        const escrowLower = req.escrow.toLowerCase();
        if (requestEscrowFilter === "held")
          return escrowLower.includes("held");
        if (requestEscrowFilter === "released")
          return escrowLower.includes("released");
        if (requestEscrowFilter === "awaiting")
          return escrowLower.includes("awaiting");
        if (requestEscrowFilter === "refunded")
          return escrowLower.includes("refunded");
        return true;
      });
    }

    // Sort
    if (requestSortField) {
      list = [...list].sort((a, b) => {
        let comp = 0;
        if (requestSortField === "id") {
          comp = a.id.localeCompare(b.id);
        } else if (requestSortField === "buyer") {
          comp = a.buyer.localeCompare(b.buyer);
        } else if (requestSortField === "item") {
          comp = a.item.localeCompare(b.item);
        } else if (requestSortField === "price") {
          const numA =
            parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
          const numB =
            parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          comp = numA - numB;
        } else if (requestSortField === "traveler") {
          comp = a.traveler.localeCompare(b.traveler);
        } else if (requestSortField === "escrow") {
          comp = a.escrow.localeCompare(b.escrow);
        } else if (requestSortField === "status") {
          comp = a.status.localeCompare(b.status);
        }

        return requestSortOrder === "asc" ? comp : -comp;
      });
    }

    return list;
  }, [
    requestsFuse,
    searchQuery,
    requestStatusFilter,
    requestEscrowFilter,
    requestSortField,
    requestSortOrder,
  ]);

  // --- USER HANDLERS ---
  const handleSortUser = (field: UserSortField) => {
    if (userSortField === field) {
      setUserSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setUserSortField(field);
      setUserSortOrder("asc");
    }
  };

  const handleSelectAllUsers = () => {
    if (
      selectedUserIds.length === filteredUsers.length &&
      filteredUsers.length > 0
    ) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleSelectUserByStatus = (status: "active" | "inactive") => {
    const isActive = status === "active";
    const matchingIds = filteredUsers
      .filter((u) => u.is_active === isActive)
      .map((u) => u.id);
    setSelectedUserIds(matchingIds);
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const hasActiveUserFilters =
    userStatusFilter !== "all" ||
    userRoleFilter !== "all" ||
    (activeTab === "users" && searchQuery.trim() !== "") ||
    userSortField !== "name" ||
    userSortOrder !== "asc";

  const handleResetUserFilters = () => {
    setUserStatusFilter("all");
    setUserRoleFilter("all");
    setSearchQuery("");
    setUserSortField("name");
    setUserSortOrder("asc");
    setSelectedUserIds([]);
  };

  const isAllUsersSelected =
    filteredUsers.length > 0 &&
    selectedUserIds.length === filteredUsers.length;
  const isPartiallyUsersSelected =
    selectedUserIds.length > 0 &&
    selectedUserIds.length < filteredUsers.length;

  const activeUsersCount = useMemo(
    () => usersList.filter((u) => u.is_active).length,
    [usersList],
  );
  const inactiveUsersCount = useMemo(
    () => usersList.filter((u) => !u.is_active).length,
    [usersList],
  );

  // --- TRIP HANDLERS ---
  const handleSortTrip = (field: TripSortField) => {
    if (tripSortField === field) {
      setTripSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setTripSortField(field);
      setTripSortOrder("asc");
    }
  };

  const handleSelectAllTrips = () => {
    if (
      selectedTripIds.length === filteredTrips.length &&
      filteredTrips.length > 0
    ) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(filteredTrips.map((t) => t.id));
    }
  };

  const handleSelectTripByStatus = (status: TripStatusFilter) => {
    if (status === "all") {
      setSelectedTripIds(filteredTrips.map((t) => t.id));
    } else {
      const matchingIds = filteredTrips
        .filter((t) => t.status === status)
        .map((t) => t.id);
      setSelectedTripIds(matchingIds);
    }
  };

  const handleToggleSelectTrip = (id: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const hasActiveTripFilters =
    tripStatusFilter !== "all" ||
    (activeTab === "trips" && searchQuery.trim() !== "") ||
    tripSortField !== "date" ||
    tripSortOrder !== "asc";

  const handleResetTripFilters = () => {
    setTripStatusFilter("all");
    setSearchQuery("");
    setTripSortField("date");
    setTripSortOrder("asc");
    setSelectedTripIds([]);
  };

  const isAllTripsSelected =
    filteredTrips.length > 0 &&
    selectedTripIds.length === filteredTrips.length;
  const isPartiallyTripsSelected =
    selectedTripIds.length > 0 &&
    selectedTripIds.length < filteredTrips.length;

  const tripCounts = useMemo(() => {
    return {
      active: DUMMY_TRIPS.filter((t) => t.status === "active").length,
      upcoming: DUMMY_TRIPS.filter((t) => t.status === "upcoming").length,
      completed: DUMMY_TRIPS.filter((t) => t.status === "completed").length,
      cancelled: DUMMY_TRIPS.filter((t) => t.status === "cancelled").length,
    };
  }, []);

  // --- REQUEST HANDLERS ---
  const handleSortRequest = (field: RequestSortField) => {
    if (requestSortField === field) {
      setRequestSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setRequestSortField(field);
      setRequestSortOrder("asc");
    }
  };

  const handleSelectAllRequests = () => {
    if (
      selectedRequestIds.length === filteredRequests.length &&
      filteredRequests.length > 0
    ) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(filteredRequests.map((r) => r.id));
    }
  };

  const handleSelectRequestByStatus = (status: RequestStatusFilter) => {
    if (status === "all") {
      setSelectedRequestIds(filteredRequests.map((r) => r.id));
    } else {
      const matchingIds = filteredRequests
        .filter((r) => r.status === status)
        .map((r) => r.id);
      setSelectedRequestIds(matchingIds);
    }
  };

  const handleToggleSelectRequest = (id: string) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const hasActiveRequestFilters =
    requestStatusFilter !== "all" ||
    requestEscrowFilter !== "all" ||
    (activeTab === "requests" && searchQuery.trim() !== "") ||
    requestSortField !== "id" ||
    requestSortOrder !== "asc";

  const handleResetRequestFilters = () => {
    setRequestStatusFilter("all");
    setRequestEscrowFilter("all");
    setSearchQuery("");
    setRequestSortField("id");
    setRequestSortOrder("asc");
    setSelectedRequestIds([]);
  };

  const isAllRequestsSelected =
    filteredRequests.length > 0 &&
    selectedRequestIds.length === filteredRequests.length;
  const isPartiallyRequestsSelected =
    selectedRequestIds.length > 0 &&
    selectedRequestIds.length < filteredRequests.length;

  const requestCounts = useMemo(() => {
    return {
      pending: DUMMY_REQUESTS.filter((r) => r.status === "pending").length,
      accepted: DUMMY_REQUESTS.filter((r) => r.status === "accepted").length,
      purchased: DUMMY_REQUESTS.filter((r) => r.status === "purchased").length,
      delivered: DUMMY_REQUESTS.filter((r) => r.status === "delivered").length,
      cancelled: DUMMY_REQUESTS.filter((r) => r.status === "cancelled").length,
    };
  }, []);

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

      {/* Users Control & Filter Bar */}
      {activeTab === "users" && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Status Filter Selector */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUserStatusFilter("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${userStatusFilter === "all"
                      ? "bg-white text-zinc-900 shadow-xs font-semibold dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  All Status ({usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserStatusFilter("active")}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${userStatusFilter === "active"
                      ? "bg-emerald-500 text-white shadow-xs font-semibold"
                      : "text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                    }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Active ({activeUsersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserStatusFilter("inactive")}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${userStatusFilter === "inactive"
                      ? "bg-zinc-600 text-white shadow-xs font-semibold dark:bg-zinc-600"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  <XCircle className="h-3 w-3" />
                  <span>Inactive ({inactiveUsersCount})</span>
                </button>
              </div>

              {/* Role Filter Dropdown */}
              <div className="relative">
                <select
                  aria-label="Filter by Role"
                  value={userRoleFilter}
                  onChange={(e) =>
                    setUserRoleFilter(e.target.value as RoleFilter)
                  }
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-wise-green cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              {hasActiveUserFilters && (
                <button
                  type="button"
                  onClick={handleResetUserFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-mute hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Reset all filters and sorting"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Right: Quick Sort & Selection Utilities */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Sort by:</span>
                <select
                  aria-label="Sort users by column"
                  value={userSortField}
                  onChange={(e) =>
                    setUserSortField(e.target.value as UserSortField)
                  }
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-wise-green cursor-pointer"
                >
                  <option value="name">User Details (Name/Email)</option>
                  <option value="id">User ID</option>
                  <option value="role">Assigned Role</option>
                  <option value="status">Account Status</option>
                </select>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setUserSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title={`Current order: ${userSortOrder === "asc" ? "Ascending" : "Descending"
                    }. Click to toggle.`}
                >
                  {userSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Ascending</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Descending</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select by Status Utility */}
              <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                <span className="text-xs text-mute font-medium">Select:</span>
                <button
                  type="button"
                  onClick={() => handleSelectUserByStatus("active")}
                  className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectUserByStatus("inactive")}
                  className="px-2 py-1 text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {/* Selection Banner if users are selected */}
          {selectedUserIds.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {selectedUserIds.length}{" "}
                  {selectedUserIds.length === 1 ? "user" : "users"} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllUsers}
                  className="text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer font-medium"
                >
                  {selectedUserIds.length === filteredUsers.length
                    ? "Deselect All"
                    : `Select All Filtered (${filteredUsers.length})`}
                </button>
                <span className="text-emerald-300 dark:text-emerald-700">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-red-600 dark:text-red-400 hover:underline cursor-pointer font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trips Control & Filter Bar */}
      {activeTab === "trips" && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Status Filter Selector */}
              <div className="flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTripStatusFilter("all")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${tripStatusFilter === "all"
                      ? "bg-white text-zinc-900 shadow-xs font-semibold dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  All ({DUMMY_TRIPS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTripStatusFilter("active")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${tripStatusFilter === "active"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    }`}
                >
                  Active ({tripCounts.active})
                </button>
                <button
                  type="button"
                  onClick={() => setTripStatusFilter("upcoming")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${tripStatusFilter === "upcoming"
                      ? "bg-amber-500 text-white shadow-xs font-semibold"
                      : "text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                    }`}
                >
                  Upcoming ({tripCounts.upcoming})
                </button>
                <button
                  type="button"
                  onClick={() => setTripStatusFilter("completed")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${tripStatusFilter === "completed"
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                    }`}
                >
                  Completed ({tripCounts.completed})
                </button>
                <button
                  type="button"
                  onClick={() => setTripStatusFilter("cancelled")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${tripStatusFilter === "cancelled"
                      ? "bg-zinc-600 text-white shadow-xs font-semibold dark:bg-zinc-600"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  Cancelled ({tripCounts.cancelled})
                </button>
              </div>

              {/* Reset Filter Button */}
              {hasActiveTripFilters && (
                <button
                  type="button"
                  onClick={handleResetTripFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-mute hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Reset all filters and sorting"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Right: Quick Sort & Selection Utilities */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Sort by:</span>
                <select
                  aria-label="Sort trips by column"
                  value={tripSortField}
                  onChange={(e) =>
                    setTripSortField(e.target.value as TripSortField)
                  }
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-wise-green cursor-pointer"
                >
                  <option value="date">Delivery Date</option>
                  <option value="id">Trip ID</option>
                  <option value="traveler">Traveler</option>
                  <option value="route">Route</option>
                  <option value="baggage">Baggage / Weight</option>
                  <option value="status">Status</option>
                </select>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setTripSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title={`Current order: ${tripSortOrder === "asc" ? "Ascending" : "Descending"
                    }. Click to toggle.`}
                >
                  {tripSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Ascending</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Descending</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select by Status Utility */}
              <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                <span className="text-xs text-mute font-medium">Select:</span>
                <button
                  type="button"
                  onClick={() => handleSelectTripByStatus("active")}
                  className="px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTripByStatus("upcoming")}
                  className="px-2 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTripByStatus("completed")}
                  className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {/* Selection Banner if trips are selected */}
          {selectedTripIds.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {selectedTripIds.length}{" "}
                  {selectedTripIds.length === 1 ? "trip" : "trips"} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllTrips}
                  className="text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer font-medium"
                >
                  {selectedTripIds.length === filteredTrips.length
                    ? "Deselect All"
                    : `Select All Filtered (${filteredTrips.length})`}
                </button>
                <span className="text-emerald-300 dark:text-emerald-700">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedTripIds([])}
                  className="text-red-600 dark:text-red-400 hover:underline cursor-pointer font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Requests Control & Filter Bar */}
      {activeTab === "requests" && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Order Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRequestStatusFilter("all")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${requestStatusFilter === "all"
                      ? "bg-white text-zinc-900 shadow-xs font-semibold dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  All ({DUMMY_REQUESTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatusFilter("pending")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${requestStatusFilter === "pending"
                      ? "bg-amber-500 text-white shadow-xs font-semibold"
                      : "text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                    }`}
                >
                  Pending ({requestCounts.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatusFilter("accepted")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${requestStatusFilter === "accepted"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    }`}
                >
                  Accepted ({requestCounts.accepted})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatusFilter("purchased")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${requestStatusFilter === "purchased"
                      ? "bg-purple-600 text-white shadow-xs font-semibold"
                      : "text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                    }`}
                >
                  Purchased ({requestCounts.purchased})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatusFilter("delivered")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${requestStatusFilter === "delivered"
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                    }`}
                >
                  Delivered ({requestCounts.delivered})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatusFilter("cancelled")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${requestStatusFilter === "cancelled"
                      ? "bg-zinc-600 text-white shadow-xs font-semibold dark:bg-zinc-600"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  Cancelled ({requestCounts.cancelled})
                </button>
              </div>

              {/* Escrow Filter Dropdown */}
              <div className="relative">
                <select
                  aria-label="Filter by Escrow Status"
                  value={requestEscrowFilter}
                  onChange={(e) =>
                    setRequestEscrowFilter(
                      e.target.value as RequestEscrowFilter,
                    )
                  }
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-wise-green cursor-pointer"
                >
                  <option value="all">All Escrow Status</option>
                  <option value="held">Held in Escrow</option>
                  <option value="released">Released to Traveler</option>
                  <option value="awaiting">Awaiting Payment</option>
                  <option value="refunded">Refunded to Buyer</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              {hasActiveRequestFilters && (
                <button
                  type="button"
                  onClick={handleResetRequestFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-mute hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Reset all filters and sorting"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Right: Quick Sort & Selection Utilities */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Sort by:</span>
                <select
                  aria-label="Sort requests by column"
                  value={requestSortField}
                  onChange={(e) =>
                    setRequestSortField(e.target.value as RequestSortField)
                  }
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-wise-green cursor-pointer"
                >
                  <option value="id">Request ID</option>
                  <option value="buyer">Buyer</option>
                  <option value="item">Requested Item</option>
                  <option value="price">Budget (Price)</option>
                  <option value="traveler">Assigned Traveler</option>
                  <option value="escrow">Escrow Status</option>
                  <option value="status">Order Status</option>
                </select>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setRequestSortOrder((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title={`Current order: ${requestSortOrder === "asc" ? "Ascending" : "Descending"
                    }. Click to toggle.`}
                >
                  {requestSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Ascending</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Descending</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select by Status Utility */}
              <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                <span className="text-xs text-mute font-medium">Select:</span>
                <button
                  type="button"
                  onClick={() => handleSelectRequestByStatus("pending")}
                  className="px-2 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRequestByStatus("accepted")}
                  className="px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Accepted
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRequestByStatus("delivered")}
                  className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Delivered
                </button>
              </div>
            </div>
          </div>

          {/* Selection Banner if requests are selected */}
          {selectedRequestIds.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {selectedRequestIds.length}{" "}
                  {selectedRequestIds.length === 1 ? "request" : "requests"}{" "}
                  selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllRequests}
                  className="text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer font-medium"
                >
                  {selectedRequestIds.length === filteredRequests.length
                    ? "Deselect All"
                    : `Select All Filtered (${filteredRequests.length})`}
                </button>
                <span className="text-emerald-300 dark:text-emerald-700">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedRequestIds([])}
                  className="text-red-600 dark:text-red-400 hover:underline cursor-pointer font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs Tables Render */}
      <div className="bg-white rounded-2xl shadow-xs border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800 select-none">
                <tr>
                  <th className="w-12 px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center justify-center"
                      title={
                        isAllUsersSelected
                          ? "Deselect all"
                          : "Select all shown users"
                      }
                      aria-label="Select all shown users"
                    >
                      {isAllUsersSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                      ) : isPartiallyUsersSelected ? (
                        <MinusSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th
                    onClick={() => handleSortUser("name")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>User Details</span>
                      {userSortField === "name" ? (
                        userSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortUser("id")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>User ID</span>
                      {userSortField === "id" ? (
                        userSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortUser("role")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Assigned Role</span>
                      {userSortField === "role" ? (
                        userSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortUser("status")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Account Status</span>
                      {userSortField === "status" ? (
                        userSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-mute"
                    >
                      No matching user profiles found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((profile) => {
                    const isSelected = selectedUserIds.includes(profile.id);
                    return (
                      <tr
                        key={profile.id}
                        className={`transition-colors ${isSelected
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          }`}
                      >
                        <td className="w-12 px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectUser(profile.id)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Select user ${profile.full_name || profile.id
                              }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                            ) : (
                              <Square className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </button>
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "trips" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800 select-none">
                <tr>
                  <th className="w-12 px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllTrips}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center justify-center"
                      title={
                        isAllTripsSelected
                          ? "Deselect all"
                          : "Select all shown trips"
                      }
                      aria-label="Select all shown trips"
                    >
                      {isAllTripsSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                      ) : isPartiallyTripsSelected ? (
                        <MinusSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th
                    onClick={() => handleSortTrip("id")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Trip ID</span>
                      {tripSortField === "id" ? (
                        tripSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortTrip("traveler")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Traveler</span>
                      {tripSortField === "traveler" ? (
                        tripSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortTrip("route")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Itinerary / Route</span>
                      {tripSortField === "route" ? (
                        tripSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortTrip("baggage")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Baggage / Weight</span>
                      {tripSortField === "baggage" ? (
                        tripSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortTrip("date")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Delivery Date</span>
                      {tripSortField === "date" ? (
                        tripSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortTrip("status")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {tripSortField === "status" ? (
                        tripSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-mute"
                    >
                      No matching trips found.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => {
                    const isSelected = selectedTripIds.includes(trip.id);
                    return (
                      <tr
                        key={trip.id}
                        className={`transition-colors ${isSelected
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          }`}
                      >
                        <td className="w-12 px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectTrip(trip.id)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Select trip ${trip.id}`}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                            ) : (
                              <Square className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </button>
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800 select-none">
                <tr>
                  <th className="w-12 px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllRequests}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center justify-center"
                      title={
                        isAllRequestsSelected
                          ? "Deselect all"
                          : "Select all shown requests"
                      }
                      aria-label="Select all shown requests"
                    >
                      {isAllRequestsSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                      ) : isPartiallyRequestsSelected ? (
                        <MinusSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th
                    onClick={() => handleSortRequest("id")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Request ID</span>
                      {requestSortField === "id" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortRequest("buyer")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Buyer</span>
                      {requestSortField === "buyer" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortRequest("item")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Requested Item</span>
                      {requestSortField === "item" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortRequest("price")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Budget</span>
                      {requestSortField === "price" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortRequest("traveler")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Assigned Traveler</span>
                      {requestSortField === "traveler" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortRequest("escrow")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Escrow Status</span>
                      {requestSortField === "escrow" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortRequest("status")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Order Status</span>
                      {requestSortField === "status" ? (
                        requestSortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-mute"
                    >
                      No matching shopping requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const isSelected = selectedRequestIds.includes(req.id);
                    return (
                      <tr
                        key={req.id}
                        className={`transition-colors ${isSelected
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          }`}
                      >
                        <td className="w-12 px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRequest(req.id)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Select request ${req.id}`}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-wise-green" />
                            ) : (
                              <Square className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </button>
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
