import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Barcode from "react-native-barcode-svg";
import * as Brightness from "expo-brightness";

import { Icon } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";

export type QtyUnit = "ctn" | "plt";

export interface Dim {
  length: string;
  width: string;
  height: string;
}

export interface AirStep1 {
  goodPhysicalCondition: boolean;
  labelsMarking: boolean;
  remarks: string;
  remarksChecked: boolean;
  weather: string;
  ylphDriver: string;
  arrivalDate: string;
  arrivalTime: string;
  arrivalTimestamp: string;
  pickupVerified: boolean;
}
export interface AirStep2 {
  goodPhysicalCondition: boolean;
  labelsMarking: boolean;
  remarks: string;
  remarksChecked: boolean;
  weather: string;
  date: string;
  time: string;
  timestamp: string;
  quantity: string;
  warehouseRep: string;
  repVerified: boolean;
}
export interface AirStep3 {
  goodPhysicalCondition: boolean;
  labelsMarking: boolean;
  remarks: string;
  remarksChecked: boolean;
  weather: string;
  date: string;
  time: string;
  timestamp: string;
  quantity: string;
  warehouseRep: string;
  warehouseRepVerified: boolean;
}
export interface AirStep4 {
  mawb: string;
  goodPhysicalCondition: boolean;
  labelsMarking: boolean;
  remarks: string;
  remarksChecked: boolean;
  weather: string;
  date: string;
  time: string;
  timestamp: string;
  quantity: string;
  airlineRep: string;
  airlineRepVerified: boolean;
}
export interface AirExportSteps {
  step1: AirStep1;
  step2: AirStep2;
  step3: AirStep3;
  step4: AirStep4;
}
export type AirStepKey = "step1" | "step2" | "step3" | "step4";

export interface FormState {
  customer: string;
  contact: string;
  origin: string;
  destination: string;
  weight: string;
  qty: string;
  qtyUnit: QtyUnit;
  dims: Dim[];
  mode: "Land" | "Air";
  cargoType: string;
  remarks: string;
  hawb: string;
  cutoff: string;
  selectedMarkings: string[];
  descriptionOfGoods: string;
  date: string;
  airStep: number;
  air: AirExportSteps;
}

const TRANSPORT_MODES = ["Land", "Air"] as const;
const CARGO_TYPES = [
  "Electronics",
  "Food Products",
  "Construction",
  "Clothing",
  "Medical Supplies",
  "Office Supplies",
  "Other",
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

const formatDim = (dims: Dim[]) =>
  dims
    .filter((d) => d.length || d.width || d.height)
    .map((d) => `${d.length || "0"}×${d.width || "0"}×${d.height || "0"} cm`)
    .join(", ") || "";
const formatMilitaryTime = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length === 4 ? `${digits}h` : digits;
};
const formatTimestamp = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
};
const timestampToDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const timestampToTime = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}${m}H`;
};
const dateTimeToTimestamp = (date: string, time: string) => {
  if (!date || !time) return "";
  const digits = time.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 4) return "";
  const h = parseInt(digits.slice(0, 2), 10);
  const m = parseInt(digits.slice(2, 4), 10);
  const d = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

const emptyForm = (): FormState => ({
  customer: "",
  contact: "",
  origin: "",
  destination: "",
  weight: "",
  qty: "",
  qtyUnit: "ctn",
  dims: [{ length: "", width: "", height: "" }],
  mode: "Land",
  cargoType: "",
  remarks: "",
  hawb: "",
  cutoff: "1300H",
  selectedMarkings: [],
  descriptionOfGoods: "",
  date: "",
  airStep: 0,
  air: {
    step1: {
      goodPhysicalCondition: false,
      labelsMarking: false,
      remarks: "Ok",
      remarksChecked: false,
      weather: "",
      ylphDriver: "",
      arrivalDate: "",
      arrivalTime: "",
      arrivalTimestamp: "",
      pickupVerified: false,
    },
    step2: {
      goodPhysicalCondition: false,
      labelsMarking: false,
      remarks: "Ok",
      remarksChecked: false,
      weather: "",
      date: "",
      time: "",
      timestamp: "",
      quantity: "",
      warehouseRep: "",
      repVerified: false,
    },
    step3: {
      goodPhysicalCondition: false,
      labelsMarking: false,
      remarks: "Ok",
      remarksChecked: false,
      weather: "",
      date: "",
      time: "",
      timestamp: "",
      quantity: "",
      warehouseRep: "",
      warehouseRepVerified: false,
    },
    step4: {
      mawb: "",
      goodPhysicalCondition: false,
      labelsMarking: false,
      remarks: "Ok",
      remarksChecked: false,
      weather: "",
      date: "",
      time: "",
      timestamp: "",
      quantity: "",
      airlineRep: "",
      airlineRepVerified: false,
    },
  },
});

const mergeInitialData = (initialData?: Partial<FormState>) => {
  const base = emptyForm();
  if (!initialData) return base;
  const s1: Partial<AirStep1> = initialData.air?.step1 ?? {};
  const s2: Partial<AirStep2> = initialData.air?.step2 ?? {};
  const s3: Partial<AirStep3> = initialData.air?.step3 ?? {};
  const s4: Partial<AirStep4> = initialData.air?.step4 ?? {};
  const step1Timestamp =
    s1.arrivalTimestamp ||
    dateTimeToTimestamp(s1.arrivalDate || "", s1.arrivalTime || "");
  const step2Timestamp =
    s2.timestamp ||
    dateTimeToTimestamp(s2.date || "", s2.time || "");
  const step3Timestamp =
    s3.timestamp ||
    dateTimeToTimestamp(s3.date || "", s3.time || "");
  const step4Timestamp =
    s4.timestamp ||
    dateTimeToTimestamp(s4.date || "", s4.time || "");
  return {
    ...base,
    ...initialData,
    dims: initialData.dims?.length ? initialData.dims : base.dims,
    selectedMarkings: initialData.selectedMarkings ?? base.selectedMarkings,
    air: {
      ...base.air,
      ...initialData.air,
      step1: {
        ...base.air.step1,
        ...s1,
        arrivalTimestamp: step1Timestamp,
      },
      step2: {
        ...base.air.step2,
        ...s2,
        timestamp: step2Timestamp,
      },
      step3: {
        ...base.air.step3,
        ...s3,
        timestamp: step3Timestamp,
      },
      step4: {
        ...base.air.step4,
        ...s4,
        timestamp: step4Timestamp,
      },
    },
  };
};

export function NewBookingForm({
  visible,
  isEditMode = false,
  initialData,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  isEditMode?: boolean;
  initialData?: Partial<FormState>;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [plateNumber, setPlateNumber] = useState("");
  const [airFieldsHeight] = useState(() => new Animated.Value(0));
  const [barcodeModal, setBarcodeModal] = useState(false);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const next = isEditMode ? mergeInitialData(initialData) : emptyForm();
    const nextAirStep =
      next.mode === "Air"
        ? (() => {
            if (next.air.step4.airlineRepVerified) return 3;
            if (next.air.step3.warehouseRepVerified) return 3;
            if (next.air.step2.repVerified) return 2;
            if (next.air.step1.pickupVerified) return 1;
            return 0;
          })()
        : next.airStep;
    setForm({ ...next, airStep: nextAirStep });
    setPlateNumber("");
    airFieldsHeight.setValue(next.mode === "Air" ? 1 : 0);
  }, [visible, isEditMode, initialData, airFieldsHeight]);

  const operationalPhase = useMemo(() => {
    if (form.air.step4.airlineRepVerified) return 4;
    if (form.air.step3.warehouseRepVerified) return 3;
    if (form.air.step2.repVerified) return 2;
    if (form.air.step1.pickupVerified) return 1;
    return 0;
  }, [form.air]);
  const isAirStepEditable = (idx: number) =>
    idx === operationalPhase && operationalPhase < 4;

  const setMode = (mode: "Land" | "Air") => {
    setForm((f) => ({ ...f, mode }));
    Animated.timing(airFieldsHeight, {
      toValue: mode === "Air" ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };
  const updateAirStep = <
    S extends AirStepKey,
    K extends keyof AirExportSteps[S],
  >(
    stepKey: S,
    key: K,
    value: AirExportSteps[S][K],
  ) =>
    setForm((f) => ({
      ...f,
      air: {
        ...f.air,
        [stepKey]: { ...f.air[stepKey], [key]: value } as AirExportSteps[S],
      },
    }));
  const toggleAirStep = <S extends AirStepKey>(
    stepKey: S,
    key: "goodPhysicalCondition" | "labelsMarking",
  ) =>
    setForm((f) => ({
      ...f,
      air: {
        ...f.air,
        [stepKey]: {
          ...f.air[stepKey],
          [key]: !f.air[stepKey][key],
        } as AirExportSteps[S],
      },
    }));
  const toggleRemarksChecked = (stepKey: AirStepKey) =>
    setForm((f) => {
      const step = f.air[stepKey];
      const checked = !step.remarksChecked;
      return {
        ...f,
        air: {
          ...f.air,
          [stepKey]: {
            ...step,
            remarksChecked: checked,
            remarks: checked
              ? step.remarks === "Ok"
                ? ""
                : step.remarks
              : "Ok",
          } as AirExportSteps[AirStepKey],
        },
      };
    });
  const setAirStepTimestamp = (stepKey: AirStepKey, timestamp: string) =>
    setForm((f) => {
      const step = f.air[stepKey];
      const next = { ...step } as any;
      if (stepKey === "step1") {
        next.arrivalTimestamp = timestamp;
        next.arrivalDate = timestampToDate(timestamp);
        next.arrivalTime = timestampToTime(timestamp);
      } else {
        next.timestamp = timestamp;
        next.date = timestampToDate(timestamp);
        next.time = timestampToTime(timestamp);
      }
      return {
        ...f,
        air: { ...f.air, [stepKey]: next as AirExportSteps[AirStepKey] },
      };
    });
  const toggleMarking = (m: string) =>
    setForm((f) => ({
      ...f,
      selectedMarkings: f.selectedMarkings.includes(m)
        ? f.selectedMarkings.filter((x) => x !== m)
        : [...f.selectedMarkings, m],
    }));
  const setFormDim = (idx: number, key: keyof Dim, value: string) =>
    setForm((f) => ({
      ...f,
      dims: f.dims.map((d, i) => (i === idx ? { ...d, [key]: value } : d)),
    }));
  const setFormQty = (qty: string) =>
    setForm((f) => {
      const n = Math.max(1, Math.min(20, Number(qty) || 0));
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
  const setFormQtyUnit = (unit: QtyUnit) =>
    setForm((f) => {
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

  const save = () => onSubmit(form);

  const openBarcode = async () => {
    if (!form.air.step4.mawb) return;
    setBarcodeModal(true);
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status === "granted") {
        const current = await Brightness.getBrightnessAsync();
        setOriginalBrightness(current);
        await Brightness.setBrightnessAsync(1);
      }
    } catch {
      // ignore brightness errors
    }
  };

  const closeBarcode = () => {
    setBarcodeModal(false);
    if (originalBrightness !== null) {
      Brightness.setBrightnessAsync(originalBrightness).catch(() => {});
      setOriginalBrightness(null);
    }
  };

  const confirmVerify = (onConfirm: () => void) => {
    Alert.alert(
      "Confirm Verification",
      "Please review all the information before confirming. Once verified, this step will become read-only and cannot be edited.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: onConfirm },
      ],
      { cancelable: true }
    );
  };

  const airHeight = airFieldsHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2200],
  });

  return (
    <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.modalBadge, { backgroundColor: colors.primary }]}>
          <Icon name="plus" size={14} color="#fff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {isEditMode ? "Edit Booking" : "New Booking"}
          </Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            {isEditMode
              ? "Edit booking details below"
              : "Fill in shipment details below"}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Icon name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.modalScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        <FormRow label="CUSTOMER NAME *">
          <TextInput
            style={[styles.formInput, inputStyle(colors)]}
            value={form.customer}
            onChangeText={(v) => setForm({ ...form, customer: v })}
          />
        </FormRow>
        <FormRow label="CONTACT">
          <TextInput
            style={[styles.formInput, inputStyle(colors)]}
            value={form.contact}
            onChangeText={(v) => setForm({ ...form, contact: v })}
          />
        </FormRow>
        <View style={styles.twoCol}>
          <FormRow label="ORIGIN *" style={{ flex: 1 }}>
            <TextInput
              style={[styles.formInput, inputStyle(colors)]}
              value={form.origin}
              onChangeText={(v) => setForm({ ...form, origin: v })}
            />
          </FormRow>
          <FormRow label="DESTINATION *" style={{ flex: 1 }}>
            <TextInput
              style={[styles.formInput, inputStyle(colors)]}
              value={form.destination}
              onChangeText={(v) => setForm({ ...form, destination: v })}
            />
          </FormRow>
        </View>
        <FormRow label="TRANSPORT MODE">
          <View
            style={[
              styles.segmentControl,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            {TRANSPORT_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.segment,
                  form.mode === mode && {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setMode(mode)}
              >
                <Icon
                  name={mode === "Land" ? "truck" : "send"}
                  size={14}
                  color={
                    form.mode === mode ? colors.primary : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        form.mode === mode
                          ? colors.primary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {mode === "Air" ? "Air Cargo" : "Land Cargo"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormRow>
        <FormRow label="CARGO METRICS">
          <View
            style={[
              styles.metricsPanel,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <View style={styles.twoCol}>
              <FormRow label="QTY" style={{ flex: 1 }}>
                <TextInput
                  style={[styles.formInput, inputStyle(colors)]}
                  keyboardType="numeric"
                  value={form.qty}
                  onChangeText={setFormQty}
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
                        form.qtyUnit === u && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => setFormQtyUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitOptionText,
                          {
                            color:
                              form.qtyUnit === u ? "#fff" : colors.foreground,
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
                style={[styles.formInput, inputStyle(colors)]}
                keyboardType="numeric"
                value={form.weight}
                onChangeText={(v) => setForm({ ...form, weight: v })}
              />
            </FormRow>
            <FormRow
              label={`DIMENSIONS (L × W × H cm)${form.qtyUnit === "plt" ? "" : ` · ${form.dims.length} row${form.dims.length === 1 ? "" : "s"}`}`}
              style={{ marginTop: 6 }}
            >
              {form.dims.map((d, i) => (
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
                      inputStyle(colors),
                      { marginBottom: 0 },
                    ]}
                    value={d.length}
                    onChangeText={(v) => setFormDim(i, "length", v)}
                  />
                  <Text
                    style={[styles.dimX, { color: colors.mutedForeground }]}
                  >
                    ×
                  </Text>
                  <TextInput
                    style={[
                      styles.dimInput,
                      inputStyle(colors),
                      { marginBottom: 0 },
                    ]}
                    value={d.width}
                    onChangeText={(v) => setFormDim(i, "width", v)}
                  />
                  <Text
                    style={[styles.dimX, { color: colors.mutedForeground }]}
                  >
                    ×
                  </Text>
                  <TextInput
                    style={[
                      styles.dimInput,
                      inputStyle(colors),
                      { marginBottom: 0 },
                    ]}
                    value={d.height}
                    onChangeText={(v) => setFormDim(i, "height", v)}
                  />
                  <Text
                    style={[styles.dimUnit, { color: colors.mutedForeground }]}
                  >
                    cm
                  </Text>
                </View>
              ))}
            </FormRow>
          </View>
        </FormRow>
        <FormRow label="HAWB NUMBER">
          <TextInput
            style={[styles.formInput, inputStyle(colors)]}
            value={form.hawb}
            onChangeText={(v) => setForm({ ...form, hawb: v })}
          />
        </FormRow>
        <Animated.View style={{ maxHeight: airHeight, overflow: "hidden" }}>
          <View
            style={[
              styles.airBlock,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <View style={styles.airBlockHeader}>
              <Icon name="send" size={13} color={colors.primary} />
              <Text style={[styles.airBlockTitle, { color: colors.primary }]}>
                Air Export Cargo
              </Text>
            </View>
            <View
              style={[
                styles.airHeaderCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.airHeaderTitle, { color: colors.primary }]}>
                AIR EXPORT CARGO MARSHALLING REPORT
              </Text>
              <View style={styles.airHeaderGrid}>
                <View style={styles.airHeaderCol}>
                  <FormRow label="Client">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={form.customer}
                      onChangeText={(v) => setForm({ ...form, customer: v })}
                    />
                  </FormRow>
                  <FormRow label="HAWB">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={form.hawb}
                      onChangeText={(v) => setForm({ ...form, hawb: v })}
                    />
                  </FormRow>
                  <FormRow label="Destination">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={form.destination}
                      onChangeText={(v) => setForm({ ...form, destination: v })}
                    />
                  </FormRow>
                  <FormRow label="Description of Goods">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={form.descriptionOfGoods}
                      onChangeText={(v) =>
                        setForm({ ...form, descriptionOfGoods: v })
                      }
                    />
                  </FormRow>
                </View>
                <View style={styles.airHeaderCol}>
                  <FormRow label="Date">
                    <DatePickerField
                      value={form.date}
                      onChange={(v) => setForm({ ...form, date: v })}
                      editable={true}
                    />
                  </FormRow>
                  <FormRow label="Quantity">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={form.qty}
                      onChangeText={setFormQty}
                    />
                  </FormRow>
                  <FormRow label="Dimension">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={formatDim(form.dims)}
                      editable={false}
                    />
                  </FormRow>
                  <FormRow label="Actual Weight">
                    <TextInput
                      style={[styles.formInput, inputStyle(colors, true)]}
                      value={form.weight}
                      onChangeText={(v) => setForm({ ...form, weight: v })}
                    />
                  </FormRow>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.stepIndicator,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {[
                { label: "Pick up", role: "Client" },
                { label: "Warehouse In", role: "WH In" },
                { label: "Warehouse Out", role: "WH Out" },
                { label: "Acceptance", role: "Airline Rep" },
              ].map((s, idx) => {
                const active = form.airStep === idx;
                const complete = form.airStep > idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.stepPill,
                      active && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      complete && { borderColor: colors.primary },
                    ]}
                    onPress={() => setForm({ ...form, airStep: idx })}
                  >
                    <Text
                      style={[
                        styles.stepPillNumber,
                        {
                          color: active
                            ? "#fff"
                            : complete
                              ? colors.primary
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                    <View style={styles.stepPillText}>
                      <Text
                        style={[
                          styles.stepPillLabel,
                          {
                            color: active
                              ? "#fff"
                              : complete
                                ? colors.foreground
                                : colors.mutedForeground,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {s.label}
                      </Text>
                      <Text
                        style={[
                          styles.stepPillRole,
                          {
                            color: active
                              ? "rgba(255,255,255,0.8)"
                              : colors.mutedForeground,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {s.role}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {form.airStep === 0 && (
              <StepCard
                title="Step 1 · Pick up at Client"
                role="Driver"
                roleBg="#E8772220"
                roleText="#E87722"
                footer={
                  <TouchableOpacity
                    style={[
                      styles.stampBtn,
                      {
                        marginTop: 12,
                        backgroundColor: form.air.step1.pickupVerified
                          ? "#059669"
                          : colors.primary,
                        opacity:
                          !isAirStepEditable(0) ||
                          !form.air.step1.arrivalTimestamp
                            ? 0.6
                            : 1,
                      },
                    ]}
                    onPress={() =>
                      confirmVerify(() =>
                        updateAirStep(
                          "step1",
                          "pickupVerified",
                          !form.air.step1.pickupVerified,
                        )
                      )
                    }
                    disabled={
                      !isAirStepEditable(0) || !form.air.step1.arrivalTimestamp
                    }
                  >
                    <Text style={styles.stampBtnText}>
                      {form.air.step1.pickupVerified
                        ? "Pickup Confirmed"
                        : "Confirm Pickup"}
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.stepCol}>
                  <StepFormRow
                    label="Date & Time"
                    style={{ marginBottom: 12 }}
                  >
                    <DateTimePickerField
                      value={form.air.step1.arrivalTimestamp}
                      onChange={(timestamp) =>
                        setAirStepTimestamp("step1", timestamp)
                      }
                      editable={isAirStepEditable(0)}
                      error={
                        !form.air.step1.arrivalTimestamp &&
                        isAirStepEditable(0)
                      }
                    />
                  </StepFormRow>
                  <FormRow label="DESCRIPTION OF GOODS">
                    <TextInput
                      style={[
                        styles.formInput,
                        inputStyle(colors, false, true),
                      ]}
                      value={form.descriptionOfGoods}
                      editable={false}
                    />
                  </FormRow>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <StepFormRow label="QUANTITY" style={{ width: "48%" }}>
                      <TextInput
                        style={[
                          styles.formInput,
                          inputStyle(colors, false, !isAirStepEditable(0)),
                        ]}
                        keyboardType="numeric"
                        value={form.qty}
                        onChangeText={setFormQty}
                        editable={isAirStepEditable(0)}
                      />
                    </StepFormRow>
                    <StepFormRow label="DIMENSIONS" style={{ width: "48%" }}>
                      <TextInput
                        style={[
                          styles.formInput,
                          inputStyle(colors, false, true),
                        ]}
                        value={formatDim(form.dims)}
                        editable={false}
                      />
                    </StepFormRow>
                  </View>
                  <StepFormRow label="WEATHER CONDITION">
                    <TextInput
                      style={[
                        styles.formInput,
                        inputStyle(colors, false, !isAirStepEditable(0)),
                      ]}
                      value={form.air.step1.weather}
                      onChangeText={(v) => updateAirStep("step1", "weather", v)}
                      editable={isAirStepEditable(0)}
                    />
                  </StepFormRow>
                  <StepFormRow label="YLPH DRIVER">
                    <TextInput
                      style={[
                        styles.formInput,
                        inputStyle(colors, false, !isAirStepEditable(0)),
                      ]}
                      value={form.air.step1.ylphDriver}
                      onChangeText={(v) =>
                        updateAirStep("step1", "ylphDriver", v)
                      }
                      editable={isAirStepEditable(0)}
                    />
                  </StepFormRow>
                </View>
                <View style={styles.stepCol}>
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Acceptance Details
                  </Text>
                  <CheckBox
                    label="Good physical condition"
                    checked={form.air.step1.goodPhysicalCondition}
                    onToggle={() =>
                      toggleAirStep("step1", "goodPhysicalCondition")
                    }
                    disabled={!isAirStepEditable(0)}
                  />
                  <CheckBox
                    label="Labels/marking"
                    checked={form.air.step1.labelsMarking}
                    onToggle={() => toggleAirStep("step1", "labelsMarking")}
                    disabled={!isAirStepEditable(0)}
                  />
                  <CheckBox
                    label="Add Remarks"
                    checked={form.air.step1.remarksChecked}
                    onToggle={() => toggleRemarksChecked("step1")}
                    disabled={!isAirStepEditable(0)}
                  />
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        marginTop: 8,
                        opacity:
                          form.air.step1.remarksChecked && isAirStepEditable(0)
                            ? 1
                            : 0.6,
                      },
                    ]}
                    value={form.air.step1.remarks}
                    onChangeText={(v) => updateAirStep("step1", "remarks", v)}
                    editable={form.air.step1.remarksChecked && isAirStepEditable(0)}
                    placeholder="Enter remarks..."
                  />
                </View>
              </StepCard>
            )}
            {form.airStep === 1 && (
              <StepCard
                title="Step 2 · Warehouse In"
                role="WH In"
                roleBg="#0A1F4C20"
                roleText="#0A1F4C"
                footer={
                  <TouchableOpacity
                    style={[
                      styles.stampBtn,
                      {
                        marginTop: 8,
                        backgroundColor: form.air.step2.repVerified
                          ? "#059669"
                          : colors.primary,
                        opacity:
                          !isAirStepEditable(1) || !form.air.step2.timestamp
                            ? 0.6
                            : 1,
                      },
                    ]}
                    onPress={() =>
                      confirmVerify(() =>
                        updateAirStep(
                          "step2",
                          "repVerified",
                          !form.air.step2.repVerified,
                        )
                      )
                    }
                    disabled={
                      !isAirStepEditable(1) || !form.air.step2.timestamp
                    }
                  >
                    <Text style={styles.stampBtnText}>
                      {form.air.step2.repVerified
                        ? "Verified"
                        : "Verify & Stamp"}
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.stepCol}>
                  <StepFormRow
                    label="Date & Time"
                    style={{ marginBottom: 12 }}
                  >
                    <DateTimePickerField
                      value={form.air.step2.timestamp}
                      onChange={(timestamp) =>
                        setAirStepTimestamp("step2", timestamp)
                      }
                      editable={isAirStepEditable(1)}
                      error={
                        !form.air.step2.timestamp && isAirStepEditable(1)
                      }
                    />
                  </StepFormRow>
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Acceptance Details
                  </Text>
                  <CheckBox
                    label="Good physical condition"
                    checked={form.air.step2.goodPhysicalCondition}
                    onToggle={() =>
                      toggleAirStep("step2", "goodPhysicalCondition")
                    }
                    disabled={!isAirStepEditable(1)}
                  />
                  <CheckBox
                    label="Labels/marking"
                    checked={form.air.step2.labelsMarking}
                    onToggle={() => toggleAirStep("step2", "labelsMarking")}
                    disabled={!isAirStepEditable(1)}
                  />
                  <CheckBox
                    label="Add Remarks"
                    checked={form.air.step2.remarksChecked}
                    onToggle={() => toggleRemarksChecked("step2")}
                    disabled={!isAirStepEditable(1)}
                  />
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        marginTop: 8,
                        opacity:
                          form.air.step2.remarksChecked && isAirStepEditable(1)
                            ? 1
                            : 0.6,
                      },
                    ]}
                    value={form.air.step2.remarks}
                    onChangeText={(v) => updateAirStep("step2", "remarks", v)}
                    editable={form.air.step2.remarksChecked && isAirStepEditable(1)}
                    placeholder="Enter remarks..."
                  />
                  <StepFormRow label="WEATHER CONDITION" style={{ marginTop: 12 }}>
                    <TextInput
                      style={[
                        styles.formInput,
                        inputStyle(colors, false, !isAirStepEditable(1)),
                      ]}
                      value={form.air.step2.weather}
                      onChangeText={(v) => updateAirStep("step2", "weather", v)}
                      editable={isAirStepEditable(1)}
                      placeholder="Enter weather condition..."
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </StepFormRow>
                </View>
                <View style={styles.stepCol}>
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Digital Stamp
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        opacity:
                          form.air.step2.repVerified || !isAirStepEditable(1)
                            ? 0.6
                            : 1,
                      },
                    ]}
                    value={form.air.step2.warehouseRep}
                    onChangeText={(v) =>
                      updateAirStep("step2", "warehouseRep", v)
                    }
                    editable={!form.air.step2.repVerified && isAirStepEditable(1)}
                    placeholder="Input your full name to stamp"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </StepCard>
            )}
            {form.airStep === 2 && (
              <StepCard
                title="Step 3 · Warehouse Out"
                role="WH Out"
                roleBg="#0A1F4C20"
                roleText="#0A1F4C"
                footer={
                  <TouchableOpacity
                    style={[
                      styles.stampBtn,
                      {
                        marginTop: 8,
                        backgroundColor: form.air.step3.warehouseRepVerified
                          ? "#059669"
                          : colors.primary,
                        opacity:
                          !isAirStepEditable(2) || !form.air.step3.timestamp
                            ? 0.6
                            : 1,
                      },
                    ]}
                    onPress={() =>
                      confirmVerify(() =>
                        updateAirStep(
                          "step3",
                          "warehouseRepVerified",
                          !form.air.step3.warehouseRepVerified,
                        )
                      )
                    }
                    disabled={
                      !isAirStepEditable(2) || !form.air.step3.timestamp
                    }
                  >
                    <Text style={styles.stampBtnText}>
                      {form.air.step3.warehouseRepVerified
                        ? "Stamped"
                        : "Verify & Stamp"}
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.stepCol}>
                  <StepFormRow
                    label="Date & Time"
                    style={{ marginBottom: 12 }}
                  >
                    <DateTimePickerField
                      value={form.air.step3.timestamp}
                      onChange={(timestamp) =>
                        setAirStepTimestamp("step3", timestamp)
                      }
                      editable={isAirStepEditable(2)}
                      error={
                        !form.air.step3.timestamp && isAirStepEditable(2)
                      }
                    />
                  </StepFormRow>
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Acceptance Details
                  </Text>
                  <CheckBox
                    label="Good physical condition"
                    checked={form.air.step3.goodPhysicalCondition}
                    onToggle={() =>
                      toggleAirStep("step3", "goodPhysicalCondition")
                    }
                    disabled={!isAirStepEditable(2)}
                  />
                  <CheckBox
                    label="Labels/marking"
                    checked={form.air.step3.labelsMarking}
                    onToggle={() => toggleAirStep("step3", "labelsMarking")}
                    disabled={!isAirStepEditable(2)}
                  />
                  <CheckBox
                    label="Add Remarks"
                    checked={form.air.step3.remarksChecked}
                    onToggle={() => toggleRemarksChecked("step3")}
                    disabled={!isAirStepEditable(2)}
                  />
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        marginTop: 8,
                        opacity:
                          form.air.step3.remarksChecked && isAirStepEditable(2)
                            ? 1
                            : 0.6,
                      },
                    ]}
                    value={form.air.step3.remarks}
                    onChangeText={(v) => updateAirStep("step3", "remarks", v)}
                    editable={form.air.step3.remarksChecked && isAirStepEditable(2)}
                    placeholder="Enter remarks..."
                  />
                  <StepFormRow label="WEATHER CONDITION" style={{ marginTop: 12 }}>
                    <TextInput
                      style={[
                        styles.formInput,
                        inputStyle(colors, false, !isAirStepEditable(1)),
                      ]}
                      value={form.air.step2.weather}
                      onChangeText={(v) => updateAirStep("step2", "weather", v)}
                      editable={isAirStepEditable(1)}
                      placeholder="Enter weather condition..."
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </StepFormRow>
                </View>
                <View style={styles.stepCol}>
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Release Digital Stamp
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        opacity:
                          form.air.step3.warehouseRepVerified || !isAirStepEditable(2)
                            ? 0.6
                            : 1,
                      },
                    ]}
                    value={form.air.step3.warehouseRep}
                    onChangeText={(v) =>
                      updateAirStep("step3", "warehouseRep", v)
                    }
                    editable={
                      !form.air.step3.warehouseRepVerified && isAirStepEditable(2)
                    }
                    placeholder="Input your full name to stamp"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </StepCard>
            )}
            {form.airStep === 3 && (
              <StepCard
                title="Step 4 · Acceptance by YLPH Airlines Representative"
                role="Airline Rep"
                roleBg="#E8772220"
                roleText="#E87722"
                footer={
                  <TouchableOpacity
                    style={[
                      styles.stampBtn,
                      {
                        marginTop: 8,
                        backgroundColor: form.air.step4.airlineRepVerified
                          ? "#059669"
                          : colors.primary,
                        opacity:
                          !isAirStepEditable(3) || !form.air.step4.timestamp
                            ? 0.6
                            : 1,
                      },
                    ]}
                    onPress={() =>
                      confirmVerify(() =>
                        updateAirStep(
                          "step4",
                          "airlineRepVerified",
                          !form.air.step4.airlineRepVerified,
                        )
                      )
                    }
                    disabled={
                      !isAirStepEditable(3) || !form.air.step4.timestamp
                    }
                  >
                    <Text style={styles.stampBtnText}>
                      {form.air.step4.airlineRepVerified
                        ? "Stamped"
                        : "Verify & Stamp"}
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.stepCol}>
                  <StepFormRow
                    label="Date & Time"
                    style={{ marginBottom: 12 }}
                  >
                    <DateTimePickerField
                      value={form.air.step4.timestamp}
                      onChange={(timestamp) =>
                        setAirStepTimestamp("step4", timestamp)
                      }
                      editable={isAirStepEditable(3)}
                      error={
                        !form.air.step4.timestamp && isAirStepEditable(3)
                      }
                    />
                  </StepFormRow>
                  <View
                    style={[
                      styles.cargoTagCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cargoTagHeader}>
                      <Icon name="tag" size={16} color={colors.primary} />
                      <Text
                        style={[
                          styles.cargoTagHeaderText,
                          { color: colors.foreground },
                        ]}
                      >
                        Master Air Waybill
                      </Text>
                    </View>
                    <View style={styles.cargoTagBody}>
                      <View style={styles.cargoTagInputCol}>
                        <Text
                          style={[
                            styles.cargoTagLabel,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          MAWB
                        </Text>
                        <TextInput
                          style={[
                            styles.cargoTagInput,
                            inputStyle(colors, false, !isAirStepEditable(3)),
                          ]}
                          value={form.air.step4.mawb}
                          onChangeText={(v) =>
                            updateAirStep("step4", "mawb", v)
                          }
                          editable={isAirStepEditable(3)}
                        />
                      </View>
                      <View
                        style={[
                          styles.cargoTagDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <View style={styles.cargoTagBarcodeCol}>
                        {form.air.step4.mawb ? (
                          <TouchableOpacity
                            onPress={openBarcode}
                            activeOpacity={0.8}
                            style={styles.cargoTagBarcodePanel}
                          >
                            <View style={styles.cargoTagBarcodeWrapper}>
                              <Barcode
                                value={form.air.step4.mawb}
                                format="CODE128"
                                height={48}
                                maxWidth={120}
                                singleBarWidth={2}
                                lineColor="#000000"
                                backgroundColor="#FFFFFF"
                                onError={() => {}}
                              />
                            </View>
                            <Text style={styles.cargoTagBarcodeValue}>
                              {form.air.step4.mawb}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.cargoTagPlaceholder}>
                            <Icon
                              name="tag"
                              size={28}
                              color={colors.mutedForeground}
                            />
                            <Text
                              style={[
                                styles.cargoTagPlaceholderText,
                                { color: colors.mutedForeground },
                              ]}
                            >
                              Awaiting MAWB
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: "#64748B", marginTop: 12 },
                    ]}
                  >
                    Acceptance Details
                  </Text>
                  <CheckBox
                    label="Good physical condition"
                    checked={form.air.step4.goodPhysicalCondition}
                    onToggle={() =>
                      toggleAirStep("step4", "goodPhysicalCondition")
                    }
                    disabled={!isAirStepEditable(3)}
                  />
                  <CheckBox
                    label="Labels/marking"
                    checked={form.air.step4.labelsMarking}
                    onToggle={() => toggleAirStep("step4", "labelsMarking")}
                    disabled={!isAirStepEditable(3)}
                  />
                  <CheckBox
                    label="Add Remarks"
                    checked={form.air.step4.remarksChecked}
                    onToggle={() => toggleRemarksChecked("step4")}
                    disabled={!isAirStepEditable(3)}
                  />
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        marginTop: 8,
                        opacity:
                          form.air.step4.remarksChecked && isAirStepEditable(3)
                            ? 1
                            : 0.6,
                      },
                    ]}
                    value={form.air.step4.remarks}
                    onChangeText={(v) => updateAirStep("step4", "remarks", v)}
                    editable={form.air.step4.remarksChecked && isAirStepEditable(3)}
                    placeholder="Enter remarks..."
                  />
                  <StepFormRow label="WEATHER CONDITION" style={{ marginTop: 12 }}>
                    <TextInput
                      style={[
                        styles.formInput,
                        inputStyle(colors, false, !isAirStepEditable(1)),
                      ]}
                      value={form.air.step2.weather}
                      onChangeText={(v) => updateAirStep("step2", "weather", v)}
                      editable={isAirStepEditable(1)}
                      placeholder="Enter weather condition..."
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </StepFormRow>
                </View>
                <View style={styles.stepCol}>
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Airline Stamp
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      inputStyle(colors),
                      {
                        opacity:
                          form.air.step4.airlineRepVerified || !isAirStepEditable(3)
                            ? 0.6
                            : 1,
                      },
                    ]}
                    value={form.air.step4.airlineRep}
                    onChangeText={(v) =>
                      updateAirStep("step4", "airlineRep", v)
                    }
                    editable={
                      !form.air.step4.airlineRepVerified && isAirStepEditable(3)
                    }
                    placeholder="Input your full name to stamp"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </StepCard>
            )}
          </View>
        </Animated.View>

        {form.mode !== "Air" && (
          <>
            <FormRow label="TRUCKER APP NO.">
              <View
                style={[
                  styles.autoFillRow,
                  { backgroundColor: "#1A3A1A", borderColor: "#2D6A2D" },
                ]}
              >
                <Icon name="check-circle" size={15} color="#4ADE80" />
                <Text style={[styles.autoFillText, { color: "#4ADE80" }]}>
                  TRK-APP-20240001
                </Text>
                <Text style={styles.autoFillBadge}>Auto-filled</Text>
              </View>
            </FormRow>

            <FormRow label="VEHICLE PLATE NO.">
              <TextInput
                style={[
                  styles.formInput,
                  inputStyle(colors),
                  { fontWeight: "700", letterSpacing: 2 },
                ]}
                placeholder="ABC 1234"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={8}
                value={plateNumber}
                onChangeText={(v) =>
                  setPlateNumber(v.toUpperCase().replace(/[^A-Z0-9 ]/g, ""))
                }
              />
            </FormRow>
          </>
        )}

        <FormRow label="CARGO TYPE">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CARGO_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.cargoChip,
                    {
                      backgroundColor:
                        form.cargoType === type
                          ? colors.primary
                          : colors.secondary,
                      borderColor:
                        form.cargoType === type
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, cargoType: type })}
                >
                  <Text
                    style={[
                      styles.cargoChipText,
                      {
                        color:
                          form.cargoType === type
                            ? "#fff"
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </FormRow>
      </ScrollView>
      <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: colors.foreground }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={save}
        >
          <Text style={styles.submitText}>
            {isEditMode ? "Save Changes" : "Submit Booking"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={barcodeModal}
        transparent={false}
        animationType="fade"
        onRequestClose={closeBarcode}
      >
        <View
          style={[
            styles.barcodeModalRoot,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.barcodeModalHeader}>
            <TouchableOpacity
              onPress={closeBarcode}
              style={styles.barcodeModalClose}
            >
              <Icon name="x" size={28} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.barcodeModalBody}>
            <Barcode
              value={form.air.step4.mawb}
              format="CODE128"
              height={140}
              maxWidth={Dimensions.get("window").width - 48}
              singleBarWidth={3}
              lineColor={colors.foreground}
              backgroundColor={colors.background}
              onError={() => {}}
            />
            <Text
              style={[
                styles.barcodeModalLabel,
                { color: colors.mutedForeground },
              ]}
            >
              MAWB
            </Text>
            <Text
              style={[
                styles.barcodeModalValue,
                { color: colors.foreground },
              ]}
            >
              {form.air.step4.mawb}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StepCard({
  title,
  role,
  roleBg,
  roleText,
  children,
  footer,
}: {
  title: string;
  role: string;
  roleBg: string;
  roleText: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.stepCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.stepHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
          <Text style={[styles.roleBadgeText, { color: roleText }]}>
            {role}
          </Text>
        </View>
      </View>
      <View style={styles.stepBody}>{children}</View>
      {footer && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          {footer}
        </View>
      )}
    </View>
  );
}

function DatePickerField({
  value,
  onChange,
  editable = true,
  placeholder = "YYYY-MM-DD",
}: {
  value: string;
  onChange: (v: string) => void;
  editable?: boolean;
  placeholder?: string;
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  const parsed = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.formInput,
          inputStyle(colors, true, !editable),
          { justifyContent: "center" },
        ]}
        onPress={() => editable && setShow(true)}
        disabled={!editable}
        activeOpacity={editable ? 0.8 : 1}
      >
        <Text
          style={{
            color: value ? colors.foreground : colors.mutedForeground,
          }}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={parsed}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate && event.type !== "dismissed") {
              const y = selectedDate.getFullYear();
              const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
              const d = String(selectedDate.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            }
          }}
        />
      )}
    </>
  );
}

function DateTimePickerField({
  value,
  onChange,
  editable = true,
  error = false,
}: {
  value: string;
  onChange: (timestamp: string) => void;
  editable?: boolean;
  error?: boolean;
}) {
  const colors = useColors();
  const [mode, setMode] = useState<"date" | "time" | null>(null);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const parsed = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const display = useMemo(() => {
    if (value) return formatTimestamp(value);
    if (!editable) return "Not yet recorded";
    return "Select Date & Time";
  }, [value, editable]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setMode(null);
      setPendingDate(null);
      return;
    }
    if (selectedDate) {
      setPendingDate(selectedDate);
      setMode("time");
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setMode(null);
    if (event.type === "dismissed" || !selectedDate || !pendingDate) {
      setPendingDate(null);
      return;
    }
    const combined = new Date(pendingDate);
    combined.setHours(selectedDate.getHours());
    combined.setMinutes(selectedDate.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    onChange(combined.toISOString());
    setPendingDate(null);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.formInput,
          inputStyle(colors, false, !editable),
          {
            justifyContent: "center",
            borderColor: error ? colors.destructive : undefined,
          },
        ]}
        onPress={() => editable && setMode("date")}
        disabled={!editable}
        activeOpacity={editable ? 0.8 : 1}
      >
        <Text
          style={{
            color: value
              ? colors.foreground
              : !editable
                ? colors.mutedForeground
                : colors.mutedForeground,
          }}
        >
          {display}
        </Text>
      </TouchableOpacity>
      {error && (
        <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>
          Date & Time is required
        </Text>
      )}
      {mode === "date" && (
        <DateTimePicker
          value={pendingDate || parsed}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      {mode === "time" && pendingDate && (
        <DateTimePicker
          value={pendingDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </>
  );
}

function CheckBox({
  label,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onToggle}
      activeOpacity={disabled ? 1 : 0.8}
      style={[
        styles.checkRow,
        {
          borderColor: checked ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
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

function FormRow({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function WorkflowCard({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: any;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: "#FFFFFF", borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.sectionTitle, { color: "#64748B" }]}>{title}</Text>
      {children}
    </View>
  );
}

const StepFormRow = ({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) => (
  <FormRow label={label} style={[{ marginBottom: 0 }, style]}>
    {children}
  </FormRow>
);

const inputStyle = (
  colors: ReturnType<typeof useColors>,
  _card = true,
  dimmed = false,
) => ({
  backgroundColor: colors.input,
  borderColor: colors.border,
  color: colors.foreground,
  opacity: dimmed ? 0.6 : 1,
});

const styles = StyleSheet.create({
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
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    height: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  formTextarea: {
    height: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    textAlignVertical: "top" as const,
  },
  cargoChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cargoChipText: { fontSize: 12, fontWeight: "600" as const },
  autoFillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  autoFillText: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  autoFillBadge: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: "#4ADE80",
    borderWidth: 1,
    borderColor: "#4ADE80",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "uppercase" as const,
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
  airBlock: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  airBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  airBlockTitle: { fontSize: 13, fontWeight: "700" as const },
  airHeaderCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  airHeaderTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  airHeaderGrid: { flexDirection: "row", gap: 10 },
  airHeaderCol: { flex: 1, gap: 8 },
  stepIndicator: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 0,
    overflow: "hidden",
  },
  stepPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
  stepPillNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 12,
    fontWeight: "700" as const,
    marginRight: 6,
  },
  stepPillText: { flex: 1 },
  stepPillLabel: { fontSize: 10, fontWeight: "600" as const },
  stepPillRole: { fontSize: 9, fontWeight: "500" as const, marginTop: 1 },
  stepCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  stepTitle: { fontSize: 13, fontWeight: "700" as const },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: "700" as const },
  stepBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
  },
  stepCol: { flex: 1 },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  stampBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  stampBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" as const },
  cargoTagCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  cargoTagHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cargoTagHeaderText: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  cargoTagBody: { flexDirection: "row", gap: 16, alignItems: "stretch" },
  cargoTagInputCol: { flex: 1, gap: 8, justifyContent: "center" },
  cargoTagLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  cargoTagInput: {
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  cargoTagDivider: { width: 1, marginVertical: 4 },
  cargoTagBarcodeCol: {
    flex: 1.4,
    justifyContent: "center",
    alignItems: "center",
  },
  cargoTagBarcodePanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  cargoTagBarcodeWrapper: {
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
  },
  cargoTagBarcodeValue: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#0A1F4C",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  cargoTagPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  cargoTagPlaceholderText: { fontSize: 12, fontWeight: "600" as const, textAlign: "center" },
  barcodeModalRoot: { flex: 1, padding: 24 },
  barcodeModalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 20,
  },
  barcodeModalClose: { padding: 8 },
  barcodeModalBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  barcodeModalLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  barcodeModalValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    textAlign: "center",
  },
});
