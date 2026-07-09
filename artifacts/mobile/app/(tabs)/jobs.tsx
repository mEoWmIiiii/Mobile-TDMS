import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { Icon } from "@/components/Icon";
import {
  AirExportSteps,
  FormState,
  NewBookingForm,
} from "@/components/NewBookingForm";
import { StatusBadge } from "@/components/StatusBadge";
import { JOBS, Job, JobStatus, MANIFESTS, Manifest } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const JOB_STATUSES: JobStatus[] = [
  "IN_TRANSIT",
  "PENDING",
  "DELIVERED",
  "DELAYED",
  "FOR_DISPATCH",
  "CONFIRMED",
];
const MARKINGS_OPTIONS = [
  "FRAGILE",
  "HAZARDOUS",
  "THIS SIDE UP",
  "ROUTING SEAL",
  "PERISHABLE",
];

const MARKING_COLORS: Record<
  string,
  {
    bg: string;
    text: string;
    iconName:
      | "shield"
      | "alert-octagon"
      | "thermometer"
      | "arrow-up"
      | "heart"
      | "wind"
      | "tag";
  }
> = {
  FRAGILE: { bg: "#EFF6FF", text: "#1D4ED8", iconName: "shield" },
  "THIS SIDE UP": { bg: "#F0FDF4", text: "#15803D", iconName: "arrow-up" },
  HAZARDOUS: { bg: "#FEF2F2", text: "#B91C1C", iconName: "alert-octagon" },
  PERISHABLE: { bg: "#F0FDF4", text: "#065F46", iconName: "thermometer" },
  "ROUTING SEAL": { bg: "#F5F3FF", text: "#6D28D9", iconName: "tag" },
};

type QtyUnit = "ctn" | "plt";

interface Dim {
  length: string;
  width: string;
  height: string;
}

const parseDim = (raw: string): Dim[] => {
  const parts = raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((p) => {
    const m = p.match(
      /(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)/,
    );
    return m
      ? { length: m[1], width: m[2], height: m[3] }
      : { length: "", width: "", height: "" };
  });
};

const formatDim = (dims: Dim[]) =>
  dims
    .filter((d) => d.length || d.width || d.height)
    .map((d) => `${d.length || "0"}×${d.width || "0"}×${d.height || "0"} cm`)
    .join(", ") || "";

const formatMilitaryTime = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 4) return `${digits}h`;
  return digits;
};

type PodPhase = "idle" | "capture" | "uploading" | "complete";

const CIRC = 2 * Math.PI * 26; // circumference for r=26

const PHASE_LABELS = ["Pick up", "Warehouse In", "Warehouse Out", "Acceptance"];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const animRefs = useRef<Record<string, Animated.Value>>({});
  const [filterStatus, setFilterStatus] = useState<JobStatus | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, JobStatus>>(
    Object.fromEntries(JOBS.map((j) => [j.id, j.status])),
  );

  // Edit job manifest overrides (local state only)
  const [localManifests, setLocalManifests] = useState<
    Record<string, Manifest & { qtyUnit?: QtyUnit }>
  >(() => {
    const map: Record<string, Manifest & { qtyUnit?: QtyUnit }> = {};
    JOBS.forEach((j, i) => {
      const m = MANIFESTS[i % MANIFESTS.length];
      map[j.id] = { ...m, qtyUnit: "ctn" };
    });
    return map;
  });

  // Persisted air-export step data for edit mode (local state only)
  const [localAirForms, setLocalAirForms] = useState<
    Record<string, AirExportSteps>
  >({});

  const getManifest = (jobId: string) => localManifests[jobId] ?? MANIFESTS[0];

  // Edit modal state
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    mawb: "",
    hawb: "",
    qty: "",
    qtyUnit: "ctn" as QtyUnit,
    weight: "",
    dims: [{ length: "", width: "", height: "" }] as Dim[],
    customMarkings: "",
    cutoff: "1300H",
  });

  const openEdit = (jobId: string) => {
    const m = getManifest(jobId);
    const parsedDims = parseDim(m.dimensions);
    setEditForm({
      mawb: m.mawb,
      hawb: m.hawb,
      qty: String(m.qty),
      qtyUnit: (m.qtyUnit as QtyUnit) ?? "ctn",
      weight: String(m.weight),
      dims: parsedDims.length
        ? parsedDims
        : [{ length: "", width: "", height: "" }],
      customMarkings: m.markings.join(", "),
      cutoff: m.cutoff,
    });
    setEditJobId(jobId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const saveEdit = () => {
    if (!editJobId) return;
    const allMarkings = editForm.customMarkings
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setLocalManifests((prev) => ({
      ...prev,
      [editJobId]: {
        ...prev[editJobId],
        mawb: editForm.mawb,
        hawb: editForm.hawb,
        qty: Number(editForm.qty) || 0,
        qtyUnit: editForm.qtyUnit,
        weight: Number(editForm.weight) || 0,
        dimensions: formatDim(editForm.dims),
        cutoff: editForm.cutoff,
        markings: allMarkings,
      },
    }));
    setEditJobId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleEditMarking = (m: string) => {
    setEditForm((f) => {
      const current = f.customMarkings
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const next = current.includes(m)
        ? current.filter((x) => x !== m)
        : [...current, m];
      return { ...f, customMarkings: next.join(", ") };
    });
  };

  // POD state
  const [podJobId, setPodJobId] = useState<string | null>(null);
  const [podPhase, setPodPhase] = useState<PodPhase>("idle");
  const uploadProgress = useRef(new Animated.Value(0)).current;

  // New booking form state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<
    Partial<FormState> | undefined
  >(undefined);

  // Editable job list (mirrors JOBS initially; new bookings are prepended)
  const [jobBookings, setJobBookings] = useState<Job[]>(JOBS);

  JOBS.forEach((job) => {
    if (!animRefs.current[job.id])
      animRefs.current[job.id] = new Animated.Value(0);
  });

  const toggleExpand = useCallback(
    (id: string) => {
      const isOpen = expandedId === id;
      if (!isOpen && expandedId) {
        Animated.timing(animRefs.current[expandedId], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      setExpandedId(isOpen ? null : id);
      Animated.timing(animRefs.current[id], {
        toValue: isOpen ? 0 : 1,
        duration: 260,
        useNativeDriver: false,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [expandedId],
  );

  const openNewBooking = () => {
    setIsEditMode(false);
    setEditingJobId(null);
    setInitialFormData(undefined);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openBookingForEdit = (jobId: string) => {
    const job = jobBookings.find((j) => j.id === jobId);
    const manifest = getManifest(jobId);
    if (!job) return;
    const parsedDims = parseDim(manifest.dimensions);
    const storedAir = localAirForms[jobId];
    const derivedAir: AirExportSteps = {
      step1: {
        goodPhysicalCondition: false,
        labelsMarking: false,
        remarks: "ok",
        remarksChecked: false,
        weather: "",
        ylphDriver:
          job.mode === "Air" && job.driver !== "TBD" ? job.driver : "",
        arrivalDate: "",
        arrivalTime: "",
        pickupVerified: false,
      },
      step2: {
        goodPhysicalCondition: false,
        labelsMarking: false,
        remarks: "ok",
        remarksChecked: false,
        weather: "",
        date: "",
        time: "",
        quantity: "",
        warehouseRep: "",
        repVerified: false,
      },
      step3: {
        goodPhysicalCondition: false,
        labelsMarking: false,
        remarks: "ok",
        remarksChecked: false,
        weather: "",
        date: "",
        time: "",
        quantity: "",
        warehouseRep: "",
        warehouseRepVerified: false,
      },
      step4: {
        mawb: manifest.mawb !== "N/A" ? manifest.mawb : "",
        goodPhysicalCondition: false,
        labelsMarking: false,
        remarks: "ok",
        remarksChecked: false,
        weather: "",
        date: "",
        time: "",
        quantity: "",
        airlineRep: "",
        airlineRepVerified: false,
      },
    };
    const air = storedAir
      ? {
          step1: { ...derivedAir.step1, ...storedAir.step1 },
          step2: { ...derivedAir.step2, ...storedAir.step2 },
          step3: { ...derivedAir.step3, ...storedAir.step3 },
          step4: { ...derivedAir.step4, ...storedAir.step4 },
        }
      : derivedAir;
    const initialData: FormState = {
      customer: job.customer,
      contact: job.contact,
      origin: job.origin,
      destination: job.destination,
      weight: String(job.weight),
      qty: String(manifest.qty),
      qtyUnit: (manifest.qtyUnit as QtyUnit) ?? "ctn",
      dims: parsedDims.length
        ? parsedDims
        : [{ length: "", width: "", height: "" }],
      mode: job.mode === "Air" ? "Air" : "Land",
      cargoType: "",
      remarks: job.remarks || "",
      hawb: manifest.hawb,
      cutoff: manifest.cutoff,
      selectedMarkings: manifest.markings,
      descriptionOfGoods: job.cargo,
      date: manifest.date,
      airStep: 0,
      air,
    };
    setIsEditMode(true);
    setEditingJobId(jobId);
    setInitialFormData(initialData);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleBookingSubmit = (formData: FormState) => {
    if (isEditMode && editingJobId) {
      const existingStatus =
        localStatuses[editingJobId] ??
        jobBookings.find((j) => j.id === editingJobId)?.status ??
        "CONFIRMED";
      const driver =
        formData.mode === "Air"
          ? formData.air.step1.ylphDriver || "TBD"
          : "TBD";
      const driverInitials =
        driver
          .split(/\s+/)
          .map((n) => n[0])
          .filter(Boolean)
          .join("")
          .slice(0, 2)
          .toUpperCase() || "TBD";
      const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const airRemarks = [
        formData.air.step1.remarks,
        formData.air.step2.remarks,
        formData.air.step3.remarks,
        formData.air.step4.remarks,
      ]
        .filter((r) => r && r.trim().toLowerCase() !== "ok")
        .join(" · ");

      const updatedJob: Job = {
        id: editingJobId,
        customer: formData.customer,
        contact: formData.contact,
        origin: formData.origin,
        destination: formData.destination,
        driver,
        driverInitials,
        truck: formData.mode === "Air" ? "AIR" : "TBD",
        cargo:
          formData.descriptionOfGoods || formData.cargoType || "General Cargo",
        weight: Number(formData.weight) || 0,
        mode: formData.mode,
        status: existingStatus,
        date: formData.date || today,
        remarks: airRemarks || undefined,
      };

      const updatedManifest: Manifest & { qtyUnit?: QtyUnit } = {
        mawb:
          formData.mode === "Air" ? formData.air.step4.mawb || "N/A" : "N/A",
        shipper: formData.customer,
        origin: formData.origin,
        cutoff: formData.cutoff,
        hawb: formData.hawb || "N/A",
        date: formData.date || today,
        qty: Number(formData.qty) || 0,
        qtyUnit: formData.qtyUnit,
        weight: Number(formData.weight) || 0,
        dimensions: formatDim(formData.dims),
        markings: formData.selectedMarkings,
      };

      setJobBookings((prev) =>
        prev.map((j) => (j.id === editingJobId ? updatedJob : j)),
      );
      setLocalManifests((prev) => ({
        ...prev,
        [editingJobId]: updatedManifest,
      }));
      setLocalAirForms((prev) => ({ ...prev, [editingJobId]: formData.air }));
      setEditingJobId(null);
      setIsEditMode(false);
      setInitialFormData(undefined);
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const nextNum = jobBookings.length + 1;
      const nextId = `JB-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;
      const driver =
        formData.mode === "Air"
          ? formData.air.step1.ylphDriver || "TBD"
          : "TBD";
      const driverInitials =
        driver
          .split(/\s+/)
          .map((n) => n[0])
          .filter(Boolean)
          .join("")
          .slice(0, 2)
          .toUpperCase() || "TBD";
      const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const airRemarks = [
        formData.air.step1.remarks,
        formData.air.step2.remarks,
        formData.air.step3.remarks,
        formData.air.step4.remarks,
      ]
        .filter((r) => r && r.trim().toLowerCase() !== "ok")
        .join(" · ");

      const newJob: Job = {
        id: nextId,
        customer: formData.customer,
        contact: formData.contact,
        origin: formData.origin,
        destination: formData.destination,
        driver,
        driverInitials,
        truck: formData.mode === "Air" ? "AIR" : "TBD",
        cargo:
          formData.descriptionOfGoods || formData.cargoType || "General Cargo",
        weight: Number(formData.weight) || 0,
        mode: formData.mode,
        status: "CONFIRMED",
        date: formData.date || today,
        remarks: airRemarks || undefined,
      };

      const newManifest: Manifest & { qtyUnit?: QtyUnit } = {
        mawb:
          formData.mode === "Air" ? formData.air.step4.mawb || "N/A" : "N/A",
        shipper: formData.customer,
        origin: formData.origin,
        cutoff: formData.cutoff,
        hawb: formData.hawb || "N/A",
        date: formData.date || today,
        qty: Number(formData.qty) || 0,
        qtyUnit: formData.qtyUnit,
        weight: Number(formData.weight) || 0,
        dimensions: formatDim(formData.dims),
        markings: formData.selectedMarkings,
      };

      if (!animRefs.current[nextId])
        animRefs.current[nextId] = new Animated.Value(0);

      setJobBookings((prev) => [newJob, ...prev]);
      setLocalStatuses((prev) => ({ ...prev, [nextId]: newJob.status }));
      setLocalManifests((prev) => ({ ...prev, [nextId]: newManifest }));
      setLocalAirForms((prev) => ({ ...prev, [nextId]: formData.air }));
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const setEditDim = (idx: number, key: keyof Dim, value: string) => {
    setEditForm((f) => ({
      ...f,
      dims: f.dims.map((d, i) => (i === idx ? { ...d, [key]: value } : d)),
    }));
  };

  const setEditQty = (qty: string) => {
    const n = Math.max(1, Math.min(20, Number(qty) || 0));
    setEditForm((f) => {
      const rows = f.qtyUnit === "plt" ? 1 : Math.max(1, n);
      return {
        ...f,
        qty,
        dims: Array.from(
          { length: rows },
          (_, i) => f.dims[i] || { length: "", width: "", height: "" },
        ),
      };
    });
  };

  const setEditQtyUnit = (unit: QtyUnit) => {
    setEditForm((f) => {
      const rows =
        unit === "plt" ? 1 : Math.max(1, Math.min(20, Number(f.qty) || 1));
      return {
        ...f,
        qtyUnit: unit,
        dims: Array.from(
          { length: rows },
          (_, i) => f.dims[i] || { length: "", width: "", height: "" },
        ),
      };
    });
  };

  const openPOD = (jobId: string) => {
    setPodJobId(jobId);
    setPodPhase("capture");
    uploadProgress.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startUpload = () => {
    setPodPhase("uploading");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(uploadProgress, {
      toValue: 1,
      duration: 2800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setPodPhase("complete");
      if (podJobId)
        setLocalStatuses((prev) => ({ ...prev, [podJobId]: "DELIVERED" }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const closePOD = () => {
    setPodJobId(null);
    setPodPhase("idle");
    uploadProgress.setValue(0);
  };

  const getStatus = (job: Job): JobStatus =>
    localStatuses[job.id] ?? job.status;

  const filtered = jobBookings.filter((job) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      job.id.toLowerCase().includes(q) ||
      job.customer.toLowerCase().includes(q);
    const matchStatus = !filterStatus || getStatus(job) === filterStatus;
    return matchSearch && matchStatus;
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const strokeDash = uploadProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  const renderJob = ({ item: job }: { item: Job }) => {
    const anim = animRefs.current[job.id];
    if (!anim) return null;
    const maxH = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 540],
    });
    const manifest = getManifest(job.id);
    const status = getStatus(job);
    const isActive = status === "IN_TRANSIT" || status === "FOR_DISPATCH";
    const phase = (() => {
      const air = localAirForms[job.id];
      if (air) {
        if (air.step4.airlineRepVerified) return 4;
        if (air.step3.warehouseRepVerified) return 3;
        if (air.step2.repVerified) return 2;
        if (air.step1.pickupVerified) return 1;
      }
      if (status === "DELIVERED") return 4;
      if (status === "IN_TRANSIT" || status === "DELAYED") return 2;
      if (status === "FOR_DISPATCH") return 1;
      return 0;
    })();
    const nextLabel = phase >= 4 ? "Completed" : `Next: ${PHASE_LABELS[phase]}`;

    return (
      <View
        style={[
          styles.jobCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => toggleExpand(job.id)}
          style={({ pressed }) => [
            styles.jobHeader,
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={[styles.initials, { backgroundColor: colors.primary }]}>
            <Text style={styles.initialsText}>{job.driverInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.jobTitleRow}>
              <Text style={[styles.jobId, { color: colors.primary }]}>
                {job.id}
              </Text>
              <Text style={[styles.jobDate, { color: colors.mutedForeground }]}>
                {job.date}
              </Text>
            </View>
            <Text
              style={[styles.customerName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {job.customer}
            </Text>
            <View style={styles.routeRow}>
              <Icon name="map-pin" size={11} color={colors.mutedForeground} />
              <Text
                style={[styles.routeText, { color: colors.mutedForeground }]}
              >
                {job.origin} → {job.destination}
              </Text>
            </View>
            {job.mode === "Air" && (
              <View style={styles.airProgressBlock}>
                <Text style={[styles.airHawbText, { color: colors.mutedForeground }]}>HAWB {manifest.hawb}</Text>
                <View style={styles.milestoneDots}>
                  {PHASE_LABELS.map((label, idx) => {
                    const completed = idx < phase;
                    const isLast = idx === PHASE_LABELS.length - 1;
                    return (
                      <React.Fragment key={label}>
                        <View style={[styles.milestoneDot, { backgroundColor: completed ? "#E87722" : "#E2E8F0" }]} />
                        {!isLast && <View style={[styles.milestoneConnector, { backgroundColor: idx < phase ? "#E87722" : "#E2E8F0" }]} />}
                      </React.Fragment>
                    );
                  })}
                </View>
                <Text style={[styles.milestoneNext, { color: colors.primary }]}>{nextLabel}</Text>
              </View>
            )}
          </View>
          <View style={styles.jobHeaderRight}>
            <StatusBadge status={status} />
            <Icon
              name={expandedId === job.id ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </Pressable>

        <Animated.View style={{ maxHeight: maxH, overflow: "hidden" }}>
          <View style={[styles.expandBody, { borderTopColor: colors.border }]}>
            <Text
              style={[styles.expandSection, { color: colors.mutedForeground }]}
            >
              CARGO & DISPATCH
            </Text>
            <View style={styles.detailGrid}>
              <DetailItem label="Driver" value={job.driver} />
              <DetailItem label="Truck" value={job.truck} />
              <DetailItem label="Cargo" value={job.cargo} />
              <DetailItem label="Weight" value={`${job.weight} kg`} />
              <DetailItem label="Mode" value={job.mode} />
              <DetailItem label="Contact" value={job.contact} />
            </View>

            {job.remarks && (
              <View
                style={[
                  styles.remarksBox,
                  { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
                ]}
              >
                <Icon name="alert-triangle" size={13} color="#B45309" />
                <Text style={styles.remarksText}>{job.remarks}</Text>
              </View>
            )}

            {/* Manifest block */}
            <View
              style={[
                styles.manifestBlock,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.manifestHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.manifestMawb, { color: colors.primary }]}
                  >
                    {manifest.mawb}
                  </Text>
                  <Text
                    style={[
                      styles.manifestShipper,
                      { color: colors.foreground },
                    ]}
                  >
                    {manifest.shipper}
                  </Text>
                  <Text
                    style={[
                      styles.manifestOrigin,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {manifest.origin}
                  </Text>
                </View>
                <View
                  style={[styles.cutoffPill, { backgroundColor: "#FEF2F2" }]}
                >
                  <Text style={styles.cutoffLabel}>CUT-OFF</Text>
                  <Text style={styles.cutoffTime}>{manifest.cutoff}</Text>
                </View>
              </View>
              <View style={[styles.refRow, { borderColor: colors.border }]}>
                <View style={styles.refBlock}>
                  <Text
                    style={[styles.refLabel, { color: colors.mutedForeground }]}
                  >
                    HAWB NUMBER
                  </Text>
                  <Text style={[styles.refValue, { color: colors.foreground }]}>
                    {manifest.hawb}
                  </Text>
                  <Text
                    style={[styles.refSub, { color: colors.mutedForeground }]}
                  >
                    Nested Reference
                  </Text>
                </View>
                <View
                  style={[
                    styles.refDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.refBlock}>
                  <Text
                    style={[styles.refLabel, { color: colors.mutedForeground }]}
                  >
                    SYSTEM LOGS
                  </Text>
                  <Text style={[styles.refValue, { color: colors.foreground }]}>
                    {manifest.date}
                  </Text>
                  <Text style={[styles.refSub, { color: colors.primary }]}>
                    Auto-stamped
                  </Text>
                </View>
              </View>
              <View style={[styles.metricsRow, { borderColor: colors.border }]}>
                <MetricBlock
                  label="QTY"
                  value={`${manifest.qty} ${manifest.qtyUnit ?? "ctn"}`}
                  color="#3B82F6"
                />
                <View
                  style={[
                    styles.metricDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <MetricBlock
                  label="WEIGHT (KG)"
                  value={`${manifest.weight} kg`}
                  color="#8B5CF6"
                />
                <View
                  style={[
                    styles.metricDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <MetricBlock
                  label="DIMENSIONS"
                  value={manifest.dimensions}
                  color="#F59E0B"
                />
              </View>
              <View style={styles.specialBlock}>
                <View style={styles.specialHeader}>
                  <Icon name="alert-triangle" size={12} color="#B45309" />
                  <Text
                    style={[
                      styles.specialTitle,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    MARKINGS / LABELS
                  </Text>
                </View>
                <View style={styles.markingsList}>
                  {manifest.markings.map((m: string) => {
                    const cfg = MARKING_COLORS[m] ?? {
                      bg: "#F1F5F9",
                      text: "#475569",
                      iconName: "tag" as const,
                    };
                    return (
                      <View
                        key={m}
                        style={[
                          styles.markingChip,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Icon name={cfg.iconName} size={11} color={cfg.text} />
                        <Text style={[styles.markingText, { color: cfg.text }]}>
                          {m}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <ActionButton icon="phone" label="Call" color={colors.primary} />
              <ActionButton
                icon="navigation"
                label="Navigate"
                color="#60A5FA"
              />
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: colors.border }]}
                onPress={() => openBookingForEdit(job.id)}
                activeOpacity={0.7}
              >
                <Icon name="edit" size={14} color={colors.mutedForeground} />
                <Text
                  style={[
                    styles.editBtnText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Edit Details
                </Text>
              </TouchableOpacity>
            </View>

            {/* POD button — only for active jobs */}
            {isActive && (
              <TouchableOpacity
                style={[styles.podBtn, { backgroundColor: colors.primary }]}
                onPress={() => openPOD(job.id)}
                activeOpacity={0.8}
              >
                <Icon name="camera" size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.podBtnText}>Complete Delivery (POD)</Text>
              </TouchableOpacity>
            )}
            {status === "DELIVERED" && (
              <View
                style={[
                  styles.deliveredBadge,
                  { backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" },
                ]}
              >
                <Icon name="check-circle" size={15} color="#059669" />
                <Text style={[styles.deliveredText, { color: "#059669" }]}>
                  POD Documentation Submitted
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            MANAGE
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Job Bookings
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => openNewBooking()}
        >
          <Icon name="plus" size={16} color="#fff" strokeWidth={2.5} />
          <Text style={styles.newBtnText}>New Booking</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Icon name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by Job No or Customer..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Icon name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: !filterStatus
                ? colors.primary
                : colors.secondary,
              borderColor: !filterStatus ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setFilterStatus(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: !filterStatus ? "#fff" : colors.mutedForeground },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {JOB_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filterStatus === s ? colors.primary : colors.secondary,
                borderColor:
                  filterStatus === s ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilterStatus(filterStatus === s ? null : s)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filterStatus === s ? "#fff" : colors.mutedForeground },
              ]}
            >
              {s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="package" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No jobs found
            </Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <NewBookingForm
          visible={showModal}
          isEditMode={isEditMode}
          initialData={initialFormData}
          onSubmit={handleBookingSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* ── POD Sheet ── */}
      <Modal
        visible={podJobId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePOD}
      >
        <View style={[styles.podRoot, { backgroundColor: colors.background }]}>
          <View
            style={[styles.podHeader, { borderBottomColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.podTitle, { color: colors.foreground }]}>
                Proof of Delivery
              </Text>
              <Text style={[styles.podSub, { color: colors.mutedForeground }]}>
                {podJobId} · Photo Documentation
              </Text>
            </View>
            {podPhase !== "uploading" && (
              <TouchableOpacity onPress={closePOD}>
                <Icon name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.podBody}>
            {/* Camera frame */}
            {podPhase !== "complete" && (
              <View
                style={[
                  styles.cameraFrame,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.secondary,
                  },
                ]}
              >
                {/* Corner brackets */}
                {[
                  ["tl", 0, 0],
                  ["tr", undefined, 0],
                  ["bl", 0, undefined],
                  ["br", undefined, undefined],
                ].map(([key, top, right]) => (
                  <View
                    key={String(key)}
                    style={[
                      styles.corner,
                      { borderColor: colors.primary },
                      top === 0 ? { top: 8 } : { bottom: 8 },
                      right === 0 ? { right: 8 } : { left: 8 },
                    ]}
                  />
                ))}
                <Icon
                  name="camera"
                  size={48}
                  color={colors.primary + "60"}
                  strokeWidth={1}
                />
                <Text
                  style={[
                    styles.cameraLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {podPhase === "capture"
                    ? "Position document in frame"
                    : "Processing..."}
                </Text>
              </View>
            )}

            {/* Upload progress ring */}
            {podPhase === "uploading" && (
              <View style={styles.uploadRing}>
                <Svg width={80} height={80} viewBox="0 0 60 60">
                  <Circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke={colors.secondary}
                    strokeWidth="5"
                    fill="none"
                  />
                  <AnimatedCircle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke={colors.primary}
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${CIRC}`}
                    strokeDashoffset={strokeDash}
                    strokeLinecap="round"
                    rotation="-90"
                    origin="30, 30"
                  />
                </Svg>
                <View style={styles.uploadRingCenter}>
                  <Icon name="upload-cloud" size={22} color={colors.primary} />
                </View>
                <Text
                  style={[styles.uploadLabel, { color: colors.foreground }]}
                >
                  Uploading to cloud...
                </Text>
                <Text
                  style={[styles.uploadSub, { color: colors.mutedForeground }]}
                >
                  Secure storage · Encrypted
                </Text>
              </View>
            )}

            {/* Complete state */}
            {podPhase === "complete" && (
              <View style={styles.completeState}>
                <View
                  style={[styles.completeTick, { backgroundColor: "#ECFDF5" }]}
                >
                  <Icon name="check-circle" size={52} color="#059669" />
                </View>
                <Text
                  style={[styles.completeTitle, { color: colors.foreground }]}
                >
                  POD Submitted!
                </Text>
                <Text
                  style={[
                    styles.completeSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Documentation uploaded. Job status updated to{" "}
                  <Text style={{ color: "#059669", fontWeight: "700" }}>
                    DELIVERED
                  </Text>
                  .
                </Text>
              </View>
            )}

            <View style={styles.podActions}>
              {podPhase === "capture" && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.captureBtn,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Icon name="camera" size={18} color={colors.foreground} />
                    <Text
                      style={[
                        styles.captureBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Capture Photo / Signature
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.uploadBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={startUpload}
                  >
                    <Icon
                      name="upload-cloud"
                      size={18}
                      color="#fff"
                      strokeWidth={2.5}
                    />
                    <Text style={styles.uploadBtnText}>
                      Upload Documentation
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {podPhase === "complete" && (
                <TouchableOpacity
                  style={[styles.uploadBtn, { backgroundColor: "#059669" }]}
                  onPress={closePOD}
                >
                  <Icon name="check" size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.uploadBtnText}>Done — Close Sheet</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Shipment Info Modal ── */}
      <Modal
        visible={editJobId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditJobId(null)}
      >
        <View
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Edit Shipment Info
              </Text>
              <Text
                style={[styles.modalSub, { color: colors.mutedForeground }]}
              >
                {editJobId}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditJobId(null)}>
              <Icon name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <FormRow label="MAWB NUMBER">
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g. MNL-2024-0456"
                placeholderTextColor={colors.mutedForeground}
                value={editForm.mawb}
                onChangeText={(v) => setEditForm({ ...editForm, mawb: v })}
              />
            </FormRow>
            <FormRow label="HAWB NUMBER">
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g. HAWB-0789"
                placeholderTextColor={colors.mutedForeground}
                value={editForm.hawb}
                onChangeText={(v) => setEditForm({ ...editForm, hawb: v })}
              />
            </FormRow>

            <FormRow label="CUT-OFF TIME">
              <View
                style={[
                  styles.cutoffInputRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.cutoffInputValue, { color: "#B91C1C" }]}>
                  {editForm.cutoff}
                </Text>
                <View style={styles.cutoffBtns}>
                  {["1100H", "1300H", "1500H", "1700H"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.cutoffOption,
                        editForm.cutoff === t && {
                          backgroundColor: "#FEF2F2",
                          borderColor: "#F87171",
                        },
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setEditForm({ ...editForm, cutoff: t })}
                    >
                      <Text
                        style={[
                          styles.cutoffOptionText,
                          {
                            color:
                              editForm.cutoff === t
                                ? "#B91C1C"
                                : colors.mutedForeground,
                          },
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </FormRow>

            <FormRow label="CARGO METRICS">
              <View
                style={[
                  styles.metricsPanel,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.twoCol}>
                  <FormRow label="QTY" style={{ flex: 1 }}>
                    <TextInput
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="0"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      value={editForm.qty}
                      onChangeText={setEditQty}
                    />
                  </FormRow>
                  <FormRow label="UNIT" style={{ width: 100 }}>
                    <View
                      style={[
                        styles.unitToggle,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {(["ctn", "plt"] as QtyUnit[]).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.unitOption,
                            editForm.qtyUnit === u && {
                              backgroundColor: colors.primary,
                            },
                          ]}
                          onPress={() => setEditQtyUnit(u)}
                        >
                          <Text
                            style={[
                              styles.unitOptionText,
                              {
                                color:
                                  editForm.qtyUnit === u
                                    ? "#fff"
                                    : colors.foreground,
                              },
                            ]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </FormRow>
                </View>
                <FormRow label="WEIGHT (KG)" style={{ marginTop: 6 }}>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="0.0"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    value={editForm.weight}
                    onChangeText={(v) =>
                      setEditForm({ ...editForm, weight: v })
                    }
                  />
                </FormRow>
                <FormRow
                  label={`DIMENSIONS (L × W × H cm)${editForm.qtyUnit === "plt" ? "" : ` · ${editForm.dims.length} row${editForm.dims.length === 1 ? "" : "s"}`}`}
                  style={{ marginTop: 6 }}
                >
                  {editForm.dims.map((d, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dimRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.dimInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.foreground,
                          },
                        ]}
                        placeholder="L"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                        value={d.length}
                        onChangeText={(v) => setEditDim(i, "length", v)}
                      />
                      <Text
                        style={[styles.dimX, { color: colors.mutedForeground }]}
                      >
                        ×
                      </Text>
                      <TextInput
                        style={[
                          styles.dimInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.foreground,
                          },
                        ]}
                        placeholder="W"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                        value={d.width}
                        onChangeText={(v) => setEditDim(i, "width", v)}
                      />
                      <Text
                        style={[styles.dimX, { color: colors.mutedForeground }]}
                      >
                        ×
                      </Text>
                      <TextInput
                        style={[
                          styles.dimInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.foreground,
                          },
                        ]}
                        placeholder="H"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                        value={d.height}
                        onChangeText={(v) => setEditDim(i, "height", v)}
                      />
                      <Text
                        style={[
                          styles.dimUnit,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        cm
                      </Text>
                    </View>
                  ))}
                </FormRow>
              </View>
            </FormRow>

            <FormRow label="MARKINGS / LABELS">
              <View style={styles.markingsGrid}>
                {MARKINGS_OPTIONS.map((m) => {
                  const selected = editForm.customMarkings
                    .split(/[,;\n]/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .includes(m);
                  const cfg = MARKING_COLORS[m] ?? {
                    bg: "#F1F5F9",
                    text: "#475569",
                    iconName: "tag" as const,
                  };
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.markingToggle,
                        {
                          backgroundColor: selected ? cfg.bg : colors.card,
                          borderColor: selected
                            ? cfg.text + "60"
                            : colors.border,
                        },
                      ]}
                      onPress={() => toggleEditMarking(m)}
                    >
                      <Icon
                        name={cfg.iconName}
                        size={12}
                        color={selected ? cfg.text : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.markingToggleText,
                          {
                            color: selected ? cfg.text : colors.mutedForeground,
                          },
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    marginTop: 10,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Type or edit markings (comma-separated)"
                placeholderTextColor={colors.mutedForeground}
                value={editForm.customMarkings}
                onChangeText={(v) =>
                  setEditForm({ ...editForm, customMarkings: v })
                }
              />
            </FormRow>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setEditJobId(null)}
            >
              <Text style={[styles.cancelText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: "#E87722" }]}
              onPress={saveEdit}
            >
              <Text style={styles.submitText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function DetailItem({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function MetricBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.metricBlock}>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
}: {
  icon: "phone" | "navigation";
  label: string;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: color + "18", borderColor: color + "40" },
      ]}
    >
      <Icon name={icon} size={15} color={color} />
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FormRow({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  const colors = useColors();
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function CheckBox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[
        styles.checkRow,
        { borderColor: checked ? colors.primary : colors.border },
      ]}
    >
      <View
        style={[
          styles.checkBox,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : "transparent",
          },
        ]}
      >
        {checked && <Icon name="check" size={12} color="#fff" />}
      </View>
      <Text
        style={[
          styles.checkLabel,
          { color: checked ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MilitaryTimeInput({
  value,
  onChange,
  placeholder = "1300h",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const colors = useColors();
  return (
    <TextInput
      style={[
        styles.formInput,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.foreground,
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      value={value}
      onChangeText={(v) => onChange(formatMilitaryTime(v))}
      keyboardType="numeric"
      maxLength={5}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerSub: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 1.2 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" as const },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { maxHeight: 48, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  filterChipText: { fontSize: 12, fontWeight: "500" as const },
  jobCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  jobHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  jobHeaderRight: { alignItems: "flex-end", gap: 8 },
  initials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: "#fff", fontSize: 13, fontWeight: "700" as const },
  jobTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobId: { fontSize: 13, fontWeight: "700" as const },
  jobDate: { fontSize: 11 },
  customerName: { fontSize: 14, fontWeight: "600" as const, marginTop: 2 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  routeText: { fontSize: 12 },
  expandBody: { padding: 14, borderTopWidth: 1, gap: 12 },
  expandSection: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailItem: { width: "30%" },
  detailLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 13, fontWeight: "500" as const, marginTop: 2 },
  remarksBox: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  remarksText: { fontSize: 12, color: "#B45309", flex: 1 },
  manifestBlock: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  manifestHeaderRow: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  manifestMawb: { fontSize: 12, fontWeight: "700" as const, marginBottom: 2 },
  manifestShipper: { fontSize: 14, fontWeight: "600" as const },
  manifestOrigin: { fontSize: 12, marginTop: 2 },
  cutoffPill: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cutoffLabel: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: "#B91C1C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cutoffTime: { fontSize: 18, fontWeight: "700" as const, color: "#B91C1C" },
  refRow: { flexDirection: "row", borderTopWidth: 1 },
  refBlock: { flex: 1, padding: 12 },
  refDivider: { width: 1 },
  refLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refValue: { fontSize: 13, fontWeight: "700" as const, marginTop: 3 },
  refSub: { fontSize: 10, marginTop: 2 },
  metricsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    alignItems: "stretch",
  },
  metricBlock: { flex: 1, padding: 12, alignItems: "center" },
  metricLabel: {
    fontSize: 9,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: { fontSize: 14, fontWeight: "700" as const, marginTop: 3 },
  metricDivider: { width: 1 },
  specialBlock: { padding: 12, borderTopWidth: 1 },
  specialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  specialTitle: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  markingsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  markingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  markingText: { fontSize: 11, fontWeight: "600" as const },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600" as const },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontWeight: "600" as const },
  podBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  podBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" as const },
  deliveredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deliveredText: { fontSize: 13, fontWeight: "600" as const },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
  },
  modalBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" as const },
  modalSub: { fontSize: 13, marginTop: 2 },
  modalScroll: { flex: 1 },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" as const },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" as const },
  formLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    height: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 16,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  segmentControl: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentText: { fontSize: 13, fontWeight: "600" as const },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: { fontSize: 12, fontWeight: "500" as const, flex: 1 },
  cutoffInputRow: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 10 },
  cutoffInputValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  cutoffBtns: { flexDirection: "row", gap: 8 },
  cutoffOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cutoffOptionText: { fontSize: 12, fontWeight: "600" as const },
  markingsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  markingToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  markingToggleText: { fontSize: 12, fontWeight: "500" as const },
  metricsPanel: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
    overflow: "hidden",
  },
  unitOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  unitOptionText: { fontSize: 12, fontWeight: "700" as const },
  dimRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  dimInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    textAlign: "center",
  },
  dimX: { fontSize: 14, fontWeight: "700" as const },
  dimUnit: { fontSize: 12, fontWeight: "600" as const },
  // POD Sheet
  podRoot: { flex: 1 },
  podHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  podTitle: { fontSize: 20, fontWeight: "700" as const },
  podSub: { fontSize: 13, marginTop: 2 },
  podBody: {
    flex: 1,
    padding: 24,
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraFrame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    position: "relative",
  },
  corner: { position: "absolute", width: 20, height: 20, borderWidth: 2.5 },
  cameraLabel: { fontSize: 13 },
  uploadRing: { alignItems: "center", gap: 12 },
  uploadRingCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadLabel: { fontSize: 15, fontWeight: "600" as const },
  uploadSub: { fontSize: 12 },
  completeState: { alignItems: "center", gap: 14 },
  completeTick: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  completeTitle: { fontSize: 22, fontWeight: "700" as const },
  completeSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  podActions: { width: "100%", gap: 10 },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  captureBtnText: { fontSize: 15, fontWeight: "600" as const },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
  },
  uploadBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" as const },
  // Air-only progress milestones in collapsed job card
  airProgressBlock: { marginTop: 8 },
  airHawbText: { fontSize: 11, fontWeight: "600" as const, marginBottom: 6 },
  milestoneDots: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  milestoneDot: { width: 8, height: 8, borderRadius: 4 },
  milestoneConnector: { flex: 1, height: 2, marginHorizontal: 6 },
  milestoneNext: { fontSize: 11, fontWeight: "600" as const, marginTop: 8 },
});
