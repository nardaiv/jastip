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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup
} from "@/components/ui/select";
import { SelectGroupLabel } from "@base-ui/react";

interface Profile {
  id: string;
  email: string | null;
  role: string;
  is_active: boolean;
  full_name?: string | null;
}

export interface Trip {
  id: string;
  seller_id: string;
  title: string;
  destination_country: string;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  max_request_slots: number | null;
  notes: string | null;
  status: "upcoming" | "active" | "completed" | "cancelled" | "draft" | string;
  created_at?: string;
  updated_at?: string;
  seller?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

type UserSortField = "name" | "id" | "role" | "status";
type TripSortField =
  | "title"
  | "id"
  | "traveler"
  | "destination"
  | "slots"
  | "date"
  | "status";
export interface ItemRequest {
  id: string;
  trip_id: string;
  buyer_id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  estimated_price: number | null;
  currency: string | null;
  agreed_price: number | null;
  jastip_fee: number | null;
  shipping_fee: number | null;
  total_price: number | null;
  reference_link: string | null;
  image_url: string | null;
  status:
  | "pending"
  | "accepted"
  | "rejected"
  | "purchased"
  | "delivered"
  | "cancelled"
  | string;
  rejection_reason: string | null;
  created_at?: string;
  updated_at?: string;
  buyer?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
  trip?: {
    id: string;
    title?: string | null;
    seller_id?: string;
    destination_country?: string;
    destination_city?: string | null;
    seller?: {
      id: string;
      full_name?: string | null;
      email?: string | null;
    } | null;
  } | null;
}

type RequestSortField =
  | "item"
  | "id"
  | "buyer"
  | "price"
  | "traveler"
  | "quantity"
  | "date"
  | "status";

type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | "admin" | "seller" | "buyer";
type TripStatusFilter =
  | "all"
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled"
  | "draft";
type RequestStatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "rejected"
  | "purchased"
  | "delivered"
  | "cancelled";

interface AdminDashboardProps {
  initialProfiles: Profile[] | null;
  initialTrips?: Trip[] | null;
  initialItemRequests?: ItemRequest[] | null;
}

function formatCurrency(
  amount: number | null | undefined,
  currency: string | null = "IDR",
): string {
  if (amount == null) return "-";
  const curr = currency || "IDR";
  try {
    if (curr === "IDR") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
    }).format(amount);
  } catch {
    return `${curr} ${amount.toLocaleString()}`;
  }
}

function formatTripDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTripDateRange(startDateStr: string, endDateStr: string): string {
  const start = formatTripDate(startDateStr);
  const end = formatTripDate(endDateStr);
  if (start === "-" && end === "-") return "-";
  if (start === end) return start;
  return `${start} – ${end}`;
}

// Fallback Dummy Profiles (if DB is empty or fails)
const DUMMY_PROFILES: Profile[] = [];

export function AdminDashboard({
  initialProfiles,
  initialTrips,
  initialItemRequests,
}: AdminDashboardProps) {
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
  const [requestSortField, setRequestSortField] =
    useState<RequestSortField>("item");
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

  // Combine database trips with seller profile details
  const tripsList: Trip[] = useMemo(() => {
    const dbTrips = initialTrips || [];
    const profilesMap = new Map((initialProfiles || []).map((p) => [p.id, p]));

    return dbTrips.map((trip) => {
      const seller =
        trip.seller || profilesMap.get(trip.seller_id) || null;
      return {
        ...trip,
        seller,
      };
    });
  }, [initialTrips, initialProfiles]);

  // Combine database item requests with buyer profile details & trip details
  const requestsList: ItemRequest[] = useMemo(() => {
    const dbRequests = initialItemRequests || [];
    const profilesMap = new Map((initialProfiles || []).map((p) => [p.id, p]));
    const tripsMap = new Map((initialTrips || []).map((t) => [t.id, t]));

    return dbRequests.map((req) => {
      const buyer = req.buyer || profilesMap.get(req.buyer_id) || null;
      const trip = req.trip || tripsMap.get(req.trip_id) || null;
      let tripWithSeller = trip;
      if (trip && !trip.seller && trip.seller_id) {
        tripWithSeller = {
          ...trip,
          seller: profilesMap.get(trip.seller_id) || null,
        };
      }
      return {
        ...req,
        buyer,
        trip: tripWithSeller,
      };
    });
  }, [initialItemRequests, initialProfiles, initialTrips]);

  // Statistics summaries
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const activeTripsCount = tripsList.filter(
      (t) => t.status === "active" || t.status === "upcoming",
    ).length;
    const pendingRequestsCount = requestsList.filter(
      (r) => r.status === "pending" || r.status === "accepted",
    ).length;
    const totalEscrowAmount = requestsList
      .filter((r) => r.status === "accepted" || r.status === "purchased")
      .reduce(
        (sum, r) =>
          sum +
          (Number(r.total_price) ||
            Number(r.agreed_price) ||
            Number(r.estimated_price) ||
            0),
        0,
      );

    return {
      users: totalUsers,
      trips: activeTripsCount,
      requests: pendingRequestsCount,
      escrow: formatCurrency(totalEscrowAmount, "IDR"),
    };
  }, [usersList, tripsList, requestsList]);

  const usersFuse = useMemo(() => {
    return new Fuse(usersList, {
      keys: ["full_name", "email", "id", "role"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [usersList]);

  const tripsFuse = useMemo(() => {
    return new Fuse(tripsList, {
      keys: [
        "title",
        "destination_country",
        "destination_city",
        "notes",
        "id",
        "status",
        "seller.full_name",
        "seller.email",
        "seller_id",
      ],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [tripsList]);

  const requestsFuse = useMemo(() => {
    return new Fuse(requestsList, {
      keys: [
        "item_name",
        "description",
        "id",
        "status",
        "currency",
        "buyer.full_name",
        "buyer.email",
        "buyer_id",
        "trip.title",
        "trip.destination_country",
        "trip.destination_city",
        "trip.seller.full_name",
        "trip.seller.email",
      ],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [requestsList]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let list = usersList;
    const query = searchQuery.trim();
    if (query && activeTab === "users") {
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
    activeTab,
    userStatusFilter,
    userRoleFilter,
    userSortField,
    userSortOrder,
  ]);

  // Filtered & Sorted Trips
  const filteredTrips = useMemo(() => {
    let list = tripsList;
    const query = searchQuery.trim();
    if (query && activeTab === "trips") {
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
        if (tripSortField === "title") {
          comp = (a.title || "").localeCompare(b.title || "");
        } else if (tripSortField === "id") {
          comp = a.id.localeCompare(b.id);
        } else if (tripSortField === "traveler") {
          const nameA =
            a.seller?.full_name || a.seller?.email || a.seller_id || "";
          const nameB =
            b.seller?.full_name || b.seller?.email || b.seller_id || "";
          comp = nameA.localeCompare(nameB);
        } else if (tripSortField === "destination") {
          const destA = `${a.destination_city || ""} ${a.destination_country}`.trim();
          const destB = `${b.destination_city || ""} ${b.destination_country}`.trim();
          comp = destA.localeCompare(destB);
        } else if (tripSortField === "slots") {
          const slotA = a.max_request_slots ?? -1;
          const slotB = b.max_request_slots ?? -1;
          comp = slotA - slotB;
        } else if (tripSortField === "date") {
          const timeA = new Date(a.start_date).getTime() || 0;
          const timeB = new Date(b.start_date).getTime() || 0;
          comp = timeA - timeB;
        } else if (tripSortField === "status") {
          comp = (a.status || "").localeCompare(b.status || "");
        }

        return tripSortOrder === "asc" ? comp : -comp;
      });
    }

    return list;
  }, [
    tripsFuse,
    tripsList,
    searchQuery,
    activeTab,
    tripStatusFilter,
    tripSortField,
    tripSortOrder,
  ]);

  const filteredRequests = useMemo(() => {
    let list = requestsList;
    const query = searchQuery.trim();
    if (query && activeTab === "requests") {
      list = requestsFuse.search(query).map((result) => result.item);
    }

    // Filter by Order Status
    if (requestStatusFilter !== "all") {
      list = list.filter(
        (req) =>
          (req.status || "").toLowerCase() ===
          requestStatusFilter.toLowerCase(),
      );
    }

    // Sort
    if (requestSortField) {
      list = [...list].sort((a, b) => {
        let comp = 0;
        if (requestSortField === "item") {
          comp = (a.item_name || "").localeCompare(b.item_name || "");
        } else if (requestSortField === "id") {
          comp = a.id.localeCompare(b.id);
        } else if (requestSortField === "buyer") {
          const nameA =
            a.buyer?.full_name || a.buyer?.email || a.buyer_id || "";
          const nameB =
            b.buyer?.full_name || b.buyer?.email || b.buyer_id || "";
          comp = nameA.localeCompare(nameB);
        } else if (requestSortField === "price") {
          const priceA =
            Number(a.total_price) ||
            Number(a.agreed_price) ||
            Number(a.estimated_price) ||
            0;
          const priceB =
            Number(b.total_price) ||
            Number(b.agreed_price) ||
            Number(b.estimated_price) ||
            0;
          comp = priceA - priceB;
        } else if (requestSortField === "traveler") {
          const travA =
            a.trip?.seller?.full_name ||
            a.trip?.seller?.email ||
            a.trip?.title ||
            "";
          const travB =
            b.trip?.seller?.full_name ||
            b.trip?.seller?.email ||
            b.trip?.title ||
            "";
          comp = travA.localeCompare(travB);
        } else if (requestSortField === "quantity") {
          comp = (a.quantity || 1) - (b.quantity || 1);
        } else if (requestSortField === "date") {
          const timeA = new Date(a.created_at || "").getTime() || 0;
          const timeB = new Date(b.created_at || "").getTime() || 0;
          comp = timeA - timeB;
        } else if (requestSortField === "status") {
          comp = (a.status || "").localeCompare(b.status || "");
        }

        return requestSortOrder === "asc" ? comp : -comp;
      });
    }

    return list;
  }, [
    requestsFuse,
    requestsList,
    searchQuery,
    activeTab,
    requestStatusFilter,
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
      active: tripsList.filter((t) => t.status === "active").length,
      upcoming: tripsList.filter((t) => t.status === "upcoming").length,
      completed: tripsList.filter((t) => t.status === "completed").length,
      cancelled: tripsList.filter((t) => t.status === "cancelled").length,
      draft: tripsList.filter((t) => t.status === "draft").length,
    };
  }, [tripsList]);

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
    (activeTab === "requests" && searchQuery.trim() !== "") ||
    requestSortField !== "item" ||
    requestSortOrder !== "asc";

  const handleResetRequestFilters = () => {
    setRequestStatusFilter("all");
    setSearchQuery("");
    setRequestSortField("item");
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
      pending: requestsList.filter((r) => r.status === "pending").length,
      accepted: requestsList.filter((r) => r.status === "accepted").length,
      rejected: requestsList.filter((r) => r.status === "rejected").length,
      purchased: requestsList.filter((r) => r.status === "purchased").length,
      delivered: requestsList.filter((r) => r.status === "delivered").length,
      cancelled: requestsList.filter((r) => r.status === "cancelled").length,
    };
  }, [requestsList]);

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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Status:</span>
                <Select
                  value={userStatusFilter}
                  onValueChange={(val) =>
                    setUserStatusFilter((val ?? "all") as StatusFilter)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[140px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="all">
                        All Status ({usersList.length})
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Active ({activeUsersCount})</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Inactive ({inactiveUsersCount})</span>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Role:</span>
                <Select
                  value={userRoleFilter}
                  onValueChange={(val) =>
                    setUserRoleFilter((val ?? "all") as RoleFilter)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[125px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Role</SelectLabel>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Sort by:</span>
                <Select
                  value={userSortField}
                  onValueChange={(val) =>
                    setUserSortField((val ?? "name") as UserSortField)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[160px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sort by</SelectLabel>
                      <SelectItem value="name">User Details</SelectItem>
                      <SelectItem value="id">User ID</SelectItem>
                      <SelectItem value="role">Assigned Role</SelectItem>
                      <SelectItem value="status">Account Status</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setUserSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="flex items-center gap-1 h-9 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  title={`Current order: ${userSortOrder === "asc" ? "Ascending" : "Descending"
                    }. Click to toggle.`}
                >
                  {userSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Asc</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Desc</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select by Status Dropdown */}
              <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                <span className="text-xs text-mute font-medium">Select:</span>
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val === "all") handleSelectAllUsers();
                    else if (val === "active")
                      handleSelectUserByStatus("active");
                    else if (val === "inactive")
                      handleSelectUserByStatus("inactive");
                    else if (val === "clear") setSelectedUserIds([]);
                  }}
                >
                  <SelectTrigger className="h-9 min-w-[130px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="Quick select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Quick Select</SelectLabel>

                      <SelectItem value="all">
                        Select All ({filteredUsers.length})
                      </SelectItem>
                      <SelectItem value="active">
                        Select Active ({activeUsersCount})
                      </SelectItem>
                      <SelectItem value="inactive">
                        Select Inactive ({inactiveUsersCount})
                      </SelectItem>
                      <SelectItem value="clear">Clear Selection</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Status:</span>
                <Select
                  value={tripStatusFilter}
                  onValueChange={(val) =>
                    setTripStatusFilter((val ?? "all") as TripStatusFilter)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[150px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Trip Status</SelectLabel>
                      <SelectItem value="all">
                        All Status ({tripsList.length})
                      </SelectItem>
                      <SelectItem value="upcoming">
                        Upcoming ({tripCounts.upcoming})
                      </SelectItem>
                      <SelectItem value="active">
                        Active ({tripCounts.active})
                      </SelectItem>
                      <SelectItem value="completed">
                        Completed ({tripCounts.completed})
                      </SelectItem>
                      <SelectItem value="cancelled">
                        Cancelled ({tripCounts.cancelled})
                      </SelectItem>
                      {tripCounts.draft > 0 && (
                        <SelectItem value="draft">
                          Draft ({tripCounts.draft})
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Sort by:</span>
                <Select
                  value={tripSortField}
                  onValueChange={(val) =>
                    setTripSortField((val ?? "date") as TripSortField)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[160px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sort by</SelectLabel>
                      <SelectItem value="date">Travel Dates</SelectItem>
                      <SelectItem value="title">Trip Title</SelectItem>
                      <SelectItem value="id">Trip ID</SelectItem>
                      <SelectItem value="traveler">Traveler / Seller</SelectItem>
                      <SelectItem value="destination">Destination</SelectItem>
                      <SelectItem value="slots">Request Slots</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setTripSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="flex items-center gap-1 h-9 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title={`Current order: ${tripSortOrder === "asc" ? "Ascending" : "Descending"
                    }. Click to toggle.`}
                >
                  {tripSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Asc</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Desc</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select by Status Dropdown */}
              <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                <span className="text-xs text-mute font-medium">Select:</span>
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val === "all") handleSelectAllTrips();
                    else if (val === "active")
                      handleSelectTripByStatus("active");
                    else if (val === "upcoming")
                      handleSelectTripByStatus("upcoming");
                    else if (val === "completed")
                      handleSelectTripByStatus("completed");
                    else if (val === "clear") setSelectedTripIds([]);
                  }}
                >
                  <SelectTrigger className="h-9 min-w-[130px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="Quick select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Quick select...</SelectLabel>
                      <SelectItem value="all">
                        Select All ({filteredTrips.length})
                      </SelectItem>
                      <SelectItem value="upcoming">
                        Select Upcoming ({tripCounts.upcoming})
                      </SelectItem>
                      <SelectItem value="active">
                        Select Active ({tripCounts.active})
                      </SelectItem>
                      <SelectItem value="completed">
                        Select Completed ({tripCounts.completed})
                      </SelectItem>
                      <SelectItem value="clear">Clear Selection</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Order Status Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Status:</span>
                <Select
                  value={requestStatusFilter}
                  onValueChange={(val) =>
                    setRequestStatusFilter(
                      (val ?? "all") as RequestStatusFilter,
                    )
                  }
                >
                  <SelectTrigger className="h-9 min-w-[145px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Request Status</SelectLabel>
                      <SelectItem value="all">
                        All Status ({requestsList.length})
                      </SelectItem>
                      <SelectItem value="pending">
                        Pending ({requestCounts.pending})
                      </SelectItem>
                      <SelectItem value="accepted">
                        Accepted ({requestCounts.accepted})
                      </SelectItem>
                      <SelectItem value="purchased">
                        Purchased ({requestCounts.purchased})
                      </SelectItem>
                      <SelectItem value="delivered">
                        Delivered ({requestCounts.delivered})
                      </SelectItem>
                      <SelectItem value="rejected">
                        Rejected ({requestCounts.rejected})
                      </SelectItem>
                      <SelectItem value="cancelled">
                        Cancelled ({requestCounts.cancelled})
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mute font-medium">Sort by:</span>
                <Select
                  value={requestSortField}
                  onValueChange={(val) =>
                    setRequestSortField((val ?? "item") as RequestSortField)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[160px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sort by</SelectLabel>
                      <SelectItem value="item">Requested Item</SelectItem>
                      <SelectItem value="id">Request ID</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="price">Total Price</SelectItem>
                      <SelectItem value="traveler">Assigned Traveler</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="date">Date Created</SelectItem>
                      <SelectItem value="status">Order Status</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setRequestSortOrder((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    )
                  }
                  className="flex items-center gap-1 h-9 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title={`Current order: ${requestSortOrder === "asc" ? "Ascending" : "Descending"
                    }. Click to toggle.`}
                >
                  {requestSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Asc</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-wise-green" />
                      <span>Desc</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select by Status Dropdown */}
              <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                <span className="text-xs text-mute font-medium">Select:</span>
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val === "all") handleSelectAllRequests();
                    else if (val === "pending")
                      handleSelectRequestByStatus("pending");
                    else if (val === "accepted")
                      handleSelectRequestByStatus("accepted");
                    else if (val === "purchased")
                      handleSelectRequestByStatus("purchased");
                    else if (val === "delivered")
                      handleSelectRequestByStatus("delivered");
                    else if (val === "clear") setSelectedRequestIds([]);
                  }}
                >
                  <SelectTrigger className="h-9 min-w-[130px] text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl">
                    <SelectValue placeholder="Quick select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Quick select</SelectLabel>
                      <SelectItem value="all">
                        Select All ({filteredRequests.length})
                      </SelectItem>
                      <SelectItem value="pending">
                        Select Pending ({requestCounts.pending})
                      </SelectItem>
                      <SelectItem value="accepted">
                        Select Accepted ({requestCounts.accepted})
                      </SelectItem>
                      <SelectItem value="purchased">
                        Select Purchased ({requestCounts.purchased})
                      </SelectItem>
                      <SelectItem value="delivered">
                        Select Delivered ({requestCounts.delivered})
                      </SelectItem>
                      <SelectItem value="clear">Clear Selection</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                    onClick={() => handleSortTrip("title")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Trip Details</span>
                      {tripSortField === "title" ? (
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
                      <span>Traveler / Seller</span>
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
                    onClick={() => handleSortTrip("destination")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Destination</span>
                      {tripSortField === "destination" ? (
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
                    onClick={() => handleSortTrip("slots")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Max Slots</span>
                      {tripSortField === "slots" ? (
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
                      <span>Travel Period</span>
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
                      No matching trips found in the database.
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
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {trip.title || "Untitled Trip"}
                            </div>
                            <div
                              className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-[200px]"
                              title={trip.id}
                            >
                              {trip.id}
                            </div>
                            {trip.notes && (
                              <div
                                className="text-[11px] text-zinc-500 dark:text-zinc-400 italic mt-0.5 line-clamp-1 max-w-xs"
                                title={trip.notes}
                              >
                                {trip.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-canvas-soft text-ink font-bold border border-canvas-soft flex items-center justify-center dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-xs">
                              {(
                                trip.seller?.full_name ||
                                trip.seller?.email ||
                                "S"
                              )[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                                {trip.seller?.full_name || "Unknown Seller"}
                              </div>
                              <div className="text-[11px] text-mute">
                                {trip.seller?.email ||
                                  (trip.seller_id
                                    ? `${trip.seller_id.slice(0, 8)}...`
                                    : "No email")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {trip.destination_city
                            ? `${trip.destination_city}, ${trip.destination_country}`
                            : trip.destination_country}
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                          {trip.max_request_slots !== null &&
                            trip.max_request_slots !== undefined
                            ? `${trip.max_request_slots} slots`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-xs">
                          {formatTripDateRange(trip.start_date, trip.end_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${trip.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                              : trip.status === "active"
                                ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                                : trip.status === "upcoming"
                                  ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                                  : trip.status === "cancelled"
                                    ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
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
                    onClick={() => handleSortRequest("traveler")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Trip / Traveler</span>
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
                    onClick={() => handleSortRequest("quantity")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Qty</span>
                      {requestSortField === "quantity" ? (
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
                      <span>Price / Budget</span>
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
                    onClick={() => handleSortRequest("date")}
                    className="px-6 py-4 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {requestSortField === "date" ? (
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
                      <span>Status</span>
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
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {req.item_name || "Unnamed Item"}
                            </div>
                            <div
                              className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-[200px]"
                              title={req.id}
                            >
                              {req.id}
                            </div>
                            {req.description && (
                              <div
                                className="text-[11px] text-zinc-500 dark:text-zinc-400 italic mt-0.5 line-clamp-1 max-w-xs"
                                title={req.description}
                              >
                                {req.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-canvas-soft text-ink font-bold border border-canvas-soft flex items-center justify-center dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-xs">
                              {(
                                req.buyer?.full_name ||
                                req.buyer?.email ||
                                "B"
                              )[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                                {req.buyer?.full_name || "Unknown Buyer"}
                              </div>
                              <div className="text-[11px] text-mute">
                                {req.buyer?.email ||
                                  (req.buyer_id
                                    ? `${req.buyer_id.slice(0, 8)}...`
                                    : "No email")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                            {req.trip?.destination_city
                              ? `${req.trip.destination_city}, ${req.trip.destination_country}`
                              : req.trip?.destination_country ||
                              req.trip?.title ||
                              "No trip assigned"}
                          </div>
                          <div className="text-[11px] text-mute">
                            {req.trip?.seller?.full_name
                              ? `Traveler: ${req.trip.seller.full_name}`
                              : req.trip?.seller?.email
                                ? `Traveler: ${req.trip.seller.email}`
                                : "Unassigned traveler"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {req.quantity || 1}x
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-emerald-700 dark:text-wise-green text-sm">
                            {formatCurrency(
                              req.total_price ||
                              req.agreed_price ||
                              req.estimated_price,
                              req.currency,
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {req.agreed_price != null
                              ? "Agreed Price"
                              : req.total_price != null
                                ? "Total Price"
                                : req.estimated_price != null
                                  ? "Estimated"
                                  : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                          {formatTripDate(req.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${req.status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                                : req.status === "purchased"
                                  ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                                  : req.status === "accepted"
                                    ? "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/50"
                                    : req.status === "pending"
                                      ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                                      : req.status === "rejected"
                                        ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
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
