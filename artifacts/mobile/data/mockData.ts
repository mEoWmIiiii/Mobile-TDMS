export type JobStatus =
  | "IN_TRANSIT"
  | "PENDING"
  | "DELIVERED"
  | "DELAYED"
  | "FOR_DISPATCH"
  | "CONFIRMED";

export interface Job {
  id: string;
  customer: string;
  contact: string;
  origin: string;
  destination: string;
  driver: string;
  driverInitials: string;
  truck: string;
  cargo: string;
  weight: number;
  mode: "Land" | "Air";
  status: JobStatus;
  date: string;
  remarks?: string;
}

export interface Truck {
  id: string;
  type: string;
  planeNo: string | null;
  status: "moving" | "docked" | "alert" | "idle";
  progress: number;
  speed: number;
  location: string;
}

export interface Manifest {
  mawb: string;
  shipper: string;
  origin: string;
  cutoff: string;
  hawb: string;
  date: string;
  qty: number;
  weight: number;
  dimensions: string;
  markings: string[];
}

export interface KPI {
  label: string;
  value: number;
  delta: string;
  positive: boolean;
  color: string;
}

export const JOBS: Job[] = [
  {
    id: "JB-2024-001",
    customer: "ABC Corporation",
    contact: "+63 912 345 6789",
    origin: "Cebu",
    destination: "Manila",
    driver: "R. Santos",
    driverInitials: "RS",
    truck: "TRK-001",
    cargo: "Electronics",
    weight: 500,
    mode: "Land",
    status: "IN_TRANSIT",
    date: "May 11, 2024",
    remarks: "Handle with care — fragile electronics",
  },
  {
    id: "JB-2024-002",
    customer: "XYZ Limited",
    contact: "+63 917 888 9999",
    origin: "Davao",
    destination: "Cebu",
    driver: "M. Cruz",
    driverInitials: "MC",
    truck: "TRK-003",
    cargo: "Food Products",
    weight: 800,
    mode: "Land",
    status: "PENDING",
    date: "May 12, 2024",
    remarks: "Refrigerated cargo — maintain 4°C",
  },
  {
    id: "JB-2024-003",
    customer: "Mega Industries",
    contact: "+63 998 123 4567",
    origin: "Manila",
    destination: "Laguna",
    driver: "J. Reyes",
    driverInitials: "JR",
    truck: "TRK-007",
    cargo: "Construction",
    weight: 2000,
    mode: "Land",
    status: "DELIVERED",
    date: "May 10, 2024",
  },
  {
    id: "JB-2024-004",
    customer: "Marketing Solutions",
    contact: "+63 999 456 7890",
    origin: "Iloilo",
    destination: "Bacolod",
    driver: "A. Diaz",
    driverInitials: "AD",
    truck: "TRK-002",
    cargo: "Clothing",
    weight: 300,
    mode: "Land",
    status: "DELAYED",
    date: "May 13, 2024",
    remarks: "Delayed due to road closure on SLEX",
  },
  {
    id: "JB-2024-005",
    customer: "Global Trade PH",
    contact: "+63 917 654 3210",
    origin: "Quezon City",
    destination: "Cavite",
    driver: "P. Lim",
    driverInitials: "PL",
    truck: "TRK-004",
    cargo: "Office Supplies",
    weight: 150,
    mode: "Land",
    status: "FOR_DISPATCH",
    date: "May 13, 2024",
  },
  {
    id: "JB-2024-006",
    customer: "Pacific Imports",
    contact: "+63 912 000 1111",
    origin: "Manila",
    destination: "Pampanga",
    driver: "K. Torres",
    driverInitials: "KT",
    truck: "TRK-005",
    cargo: "Medical Supplies",
    weight: 200,
    mode: "Air",
    status: "CONFIRMED",
    date: "May 14, 2024",
    remarks: "Priority shipment — urgent medical equipment",
  },
];

export const TRUCKS: Truck[] = [
  {
    id: "TRK-001",
    type: "10-Wheeler Wing Van",
    planeNo: "PR-101",
    status: "moving",
    progress: 65,
    speed: 72,
    location: "SLEX, Laguna",
  },
  {
    id: "TRK-002",
    type: "4-Wheeler Closed Van",
    planeNo: null,
    status: "alert",
    progress: 30,
    speed: 0,
    location: "Iloilo Port",
  },
  {
    id: "TRK-003",
    type: "Refrigerator Truck",
    planeNo: "5J-204",
    status: "docked",
    progress: 0,
    speed: 0,
    location: "Cebu Terminal",
  },
  {
    id: "TRK-004",
    type: "6-Wheeler Dropside",
    planeNo: null,
    status: "moving",
    progress: 45,
    speed: 60,
    location: "CAVITEX, Cavite",
  },
  {
    id: "TRK-005",
    type: "10-Wheeler Flatbed",
    planeNo: "PR-550",
    status: "idle",
    progress: 0,
    speed: 0,
    location: "Manila Warehouse",
  },
  {
    id: "TRK-007",
    type: "Boom Truck",
    planeNo: null,
    status: "docked",
    progress: 100,
    speed: 0,
    location: "Laguna Depot",
  },
];

export const MANIFESTS: Manifest[] = [
  {
    mawb: "MNL-2024-0456",
    shipper: "Pacific Imports Corp",
    origin: "MNL → CEB",
    cutoff: "1300H",
    hawb: "HAWB-0789",
    date: "May 14, 2024 · 09:45",
    qty: 24,
    weight: 312.5,
    dimensions: "80×60×50 cm",
    markings: ["FRAGILE", "THIS SIDE UP"],
  },
  {
    mawb: "CEB-2024-0231",
    shipper: "Global Trade PH",
    origin: "CEB → MNL",
    cutoff: "1500H",
    hawb: "HAWB-0412",
    date: "May 14, 2024 · 13:00",
    qty: 8,
    weight: 145.0,
    dimensions: "120×80×40 cm",
    markings: ["HAZARDOUS", "HANDLE WITH CARE"],
  },
  {
    mawb: "DVO-2024-0089",
    shipper: "Mindanao Fresh Co.",
    origin: "DVO → CEB",
    cutoff: "1100H",
    hawb: "HAWB-0155",
    date: "May 14, 2024 · 07:30",
    qty: 50,
    weight: 980.0,
    dimensions: "60×40×35 cm",
    markings: ["PERISHABLE", "KEEP COOL"],
  },
];

export const KPIS: KPI[] = [
  { label: "New Bookings", value: 25, delta: "+8%", positive: true, color: "#3B82F6" },
  { label: "For Dispatch", value: 12, delta: "2 queued", positive: true, color: "#F59E0B" },
  { label: "In Transit", value: 35, delta: "+5", positive: true, color: "#8B5CF6" },
  { label: "Delivered Today", value: 80, delta: "+12%", positive: true, color: "#10B981" },
  { label: "Delayed", value: 4, delta: "-1", positive: false, color: "#EF4444" },
];

export const ANALYTICS_DATA = {
  daily: [
    { day: "Mon", delivered: 68, pending: 12 },
    { day: "Tue", delivered: 74, pending: 8 },
    { day: "Wed", delivered: 80, pending: 15 },
    { day: "Thu", delivered: 72, pending: 10 },
    { day: "Fri", delivered: 91, pending: 6 },
    { day: "Sat", delivered: 55, pending: 18 },
    { day: "Sun", delivered: 42, pending: 22 },
  ],
  vehicleDistribution: [
    { type: "Wing Van", count: 8, color: "#3B82F6" },
    { type: "Closed Van", count: 6, color: "#10B981" },
    { type: "Refrigerator", count: 4, color: "#8B5CF6" },
    { type: "Flatbed", count: 3, color: "#F59E0B" },
    { type: "Other", count: 2, color: "#94A3B8" },
  ],
};
