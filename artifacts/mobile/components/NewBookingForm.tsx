import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  quantity: string;
  tliWarehouseRep: string;
  ylphWarehouseRep: string;
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
const CARGO_TYPES = ["Electronics", "Food Products", "Construction", "Clothing", "Medical Supplies", "Office Supplies", "Other"];
const MARKINGS_OPTIONS = ["FRAGILE", "HAZARDOUS", "THIS SIDE UP", "ROUTING SEAL", "PERISHABLE"];
const MARKING_COLORS: Record<string, { bg: string; text: string; iconName: "shield" | "alert-octagon" | "thermometer" | "arrow-up" | "heart" | "wind" | "tag" }> = {
  FRAGILE: { bg: "#EFF6FF", text: "#1D4ED8", iconName: "shield" },
  "THIS SIDE UP": { bg: "#F0FDF4", text: "#15803D", iconName: "arrow-up" },
  HAZARDOUS: { bg: "#FEF2F2", text: "#B91C1C", iconName: "alert-octagon" },
  PERISHABLE: { bg: "#F0FDF4", text: "#065F46", iconName: "thermometer" },
  "ROUTING SEAL": { bg: "#F5F3FF", text: "#6D28D9", iconName: "tag" },
};

const formatDim = (dims: Dim[]) => dims.filter((d) => d.length || d.width || d.height).map((d) => `${d.length || "0"}×${d.width || "0"}×${d.height || "0"} cm`).join(", ") || "";
const formatMilitaryTime = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length === 4 ? `${digits}h` : digits;
};

const emptyForm = (): FormState => ({
  customer: "", contact: "", origin: "", destination: "", weight: "", qty: "", qtyUnit: "ctn",
  dims: [{ length: "", width: "", height: "" }], mode: "Land", cargoType: "", remarks: "", hawb: "", cutoff: "1300H",
  selectedMarkings: [], descriptionOfGoods: "", date: "", airStep: 0,
  air: {
    step1: { goodPhysicalCondition: false, labelsMarking: false, remarks: "ok", remarksChecked: false, weather: "", ylphDriver: "", arrivalDate: "", arrivalTime: "", pickupVerified: false },
    step2: { goodPhysicalCondition: false, labelsMarking: false, remarks: "ok", remarksChecked: false, weather: "", date: "", time: "", quantity: "", tliWarehouseRep: "", ylphWarehouseRep: "", repVerified: false },
    step3: { goodPhysicalCondition: false, labelsMarking: false, remarks: "ok", remarksChecked: false, weather: "", date: "", time: "", quantity: "", warehouseRep: "", warehouseRepVerified: false },
    step4: { mawb: "", goodPhysicalCondition: false, labelsMarking: false, remarks: "ok", remarksChecked: false, weather: "", date: "", time: "", quantity: "", airlineRep: "", airlineRepVerified: false },
  },
});

const mergeInitialData = (initialData?: Partial<FormState>) => {
  const base = emptyForm();
  if (!initialData) return base;
  return {
    ...base,
    ...initialData,
    dims: initialData.dims?.length ? initialData.dims : base.dims,
    selectedMarkings: initialData.selectedMarkings ?? base.selectedMarkings,
    air: { ...base.air, ...initialData.air, step1: { ...base.air.step1, ...initialData.air?.step1 }, step2: { ...base.air.step2, ...initialData.air?.step2 }, step3: { ...base.air.step3, ...initialData.air?.step3 }, step4: { ...base.air.step4, ...initialData.air?.step4 } },
  };
};

export function NewBookingForm({ visible, isEditMode = false, initialData, onSubmit, onCancel }: { visible: boolean; isEditMode?: boolean; initialData?: Partial<FormState>; onSubmit: (data: FormState) => void; onCancel: () => void; }) {
  const colors = useColors();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [plateNumber, setPlateNumber] = useState("");
  const [airFieldsHeight] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    const next = isEditMode ? mergeInitialData(initialData) : emptyForm();
    setForm(next);
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
  const isStepLocked = (idx: number) => idx < operationalPhase;

  const setMode = (mode: "Land" | "Air") => {
    setForm((f) => ({ ...f, mode }));
    Animated.timing(airFieldsHeight, { toValue: mode === "Air" ? 1 : 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  };
  const updateAirStep = <S extends AirStepKey, K extends keyof AirExportSteps[S]>(stepKey: S, key: K, value: AirExportSteps[S][K]) => setForm((f) => ({ ...f, air: { ...f.air, [stepKey]: { ...f.air[stepKey], [key]: value } as AirExportSteps[S] } }));
  const toggleAirStep = <S extends AirStepKey>(stepKey: S, key: "goodPhysicalCondition" | "labelsMarking") => setForm((f) => ({ ...f, air: { ...f.air, [stepKey]: { ...f.air[stepKey], [key]: !f.air[stepKey][key] } as AirExportSteps[S] } }));
  const toggleRemarksChecked = (stepKey: AirStepKey) => setForm((f) => { const step = f.air[stepKey]; const checked = !step.remarksChecked; return { ...f, air: { ...f.air, [stepKey]: { ...step, remarksChecked: checked, remarks: checked ? (step.remarks === "ok" ? "" : step.remarks) : "ok" } as AirExportSteps[AirStepKey] } }; });
  const toggleMarking = (m: string) => setForm((f) => ({ ...f, selectedMarkings: f.selectedMarkings.includes(m) ? f.selectedMarkings.filter((x) => x !== m) : [...f.selectedMarkings, m] }));
  const setFormDim = (idx: number, key: keyof Dim, value: string) => setForm((f) => ({ ...f, dims: f.dims.map((d, i) => (i === idx ? { ...d, [key]: value } : d)) }));
  const setFormQty = (qty: string) => setForm((f) => { const n = Math.max(1, Math.min(20, Number(qty) || 0)); const rows = f.qtyUnit === "plt" ? 1 : Math.max(1, n); return { ...f, qty, dims: Array.from({ length: rows }, (_, i) => f.dims[i] || { length: "", width: "", height: "" }) }; });
  const setFormQtyUnit = (unit: QtyUnit) => setForm((f) => { const rows = unit === "plt" ? 1 : Math.max(1, Math.min(20, Number(f.qty) || 1)); return { ...f, qtyUnit: unit, dims: Array.from({ length: rows }, (_, i) => f.dims[i] || { length: "", width: "", height: "" }) }; });

  const save = () => onSubmit(form);

  const airHeight = airFieldsHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 2200] });

  return (
    <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.modalBadge, { backgroundColor: colors.primary }]}>
          <Icon name="plus" size={14} color="#fff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{isEditMode ? "Edit Booking" : "New Booking"}</Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{isEditMode ? "Edit booking details below" : "Fill in shipment details below"}</Text>
        </View>
        <TouchableOpacity onPress={onCancel}><Icon name="x" size={22} color={colors.foreground} /></TouchableOpacity>
      </View>
      <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        <FormRow label="CUSTOMER NAME *"><TextInput style={[styles.formInput, inputStyle(colors)]} value={form.customer} onChangeText={(v) => setForm({ ...form, customer: v })} /></FormRow>
        <FormRow label="CONTACT"><TextInput style={[styles.formInput, inputStyle(colors)]} value={form.contact} onChangeText={(v) => setForm({ ...form, contact: v })} /></FormRow>
        <View style={styles.twoCol}>
          <FormRow label="ORIGIN *" style={{ flex: 1 }}><TextInput style={[styles.formInput, inputStyle(colors)]} value={form.origin} onChangeText={(v) => setForm({ ...form, origin: v })} /></FormRow>
          <FormRow label="DESTINATION *" style={{ flex: 1 }}><TextInput style={[styles.formInput, inputStyle(colors)]} value={form.destination} onChangeText={(v) => setForm({ ...form, destination: v })} /></FormRow>
        </View>
        <FormRow label="TRANSPORT MODE"><View style={[styles.segmentControl, { backgroundColor: colors.secondary, borderColor: colors.border }]}>{TRANSPORT_MODES.map((mode) => <TouchableOpacity key={mode} style={[styles.segment, form.mode === mode && { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => setMode(mode)}><Icon name={mode === "Land" ? "truck" : "send"} size={14} color={form.mode === mode ? colors.primary : colors.mutedForeground} /><Text style={[styles.segmentText, { color: form.mode === mode ? colors.primary : colors.mutedForeground }]}>{mode === "Air" ? "Air Cargo" : "Land Cargo"}</Text></TouchableOpacity>)}</View></FormRow>
        <FormRow label="CARGO METRICS"><View style={[styles.metricsPanel, { backgroundColor: colors.secondary, borderColor: colors.border }]}><View style={styles.twoCol}><FormRow label="QTY" style={{ flex: 1 }}><TextInput style={[styles.formInput, inputStyle(colors)]} keyboardType="numeric" value={form.qty} onChangeText={setFormQty} /></FormRow><FormRow label="UNIT" style={{ width: 100 }}><View style={[styles.unitToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>{(["ctn", "plt"] as QtyUnit[]).map((u) => <TouchableOpacity key={u} style={[styles.unitOption, form.qtyUnit === u && { backgroundColor: colors.primary }]} onPress={() => setFormQtyUnit(u)}><Text style={[styles.unitOptionText, { color: form.qtyUnit === u ? "#fff" : colors.foreground }]}>{u}</Text></TouchableOpacity>)}</View></FormRow></View><FormRow label="WEIGHT (KG)" style={{ marginTop: 6 }}><TextInput style={[styles.formInput, inputStyle(colors)]} keyboardType="numeric" value={form.weight} onChangeText={(v) => setForm({ ...form, weight: v })} /></FormRow><FormRow label={`DIMENSIONS (L × W × H cm)${form.qtyUnit === "plt" ? "" : ` · ${form.dims.length} row${form.dims.length === 1 ? "" : "s"}`}`} style={{ marginTop: 6 }}>{form.dims.map((d, i) => <View key={i} style={[styles.dimRow, { backgroundColor: colors.card, borderColor: colors.border }]}><TextInput style={[styles.dimInput, inputStyle(colors), { marginBottom: 0 }]} value={d.length} onChangeText={(v) => setFormDim(i, "length", v)} /><Text style={[styles.dimX, { color: colors.mutedForeground }]}>×</Text><TextInput style={[styles.dimInput, inputStyle(colors), { marginBottom: 0 }]} value={d.width} onChangeText={(v) => setFormDim(i, "width", v)} /><Text style={[styles.dimX, { color: colors.mutedForeground }]}>×</Text><TextInput style={[styles.dimInput, inputStyle(colors), { marginBottom: 0 }]} value={d.height} onChangeText={(v) => setFormDim(i, "height", v)} /><Text style={[styles.dimUnit, { color: colors.mutedForeground }]}>cm</Text></View>)}</FormRow></View></FormRow>
        <FormRow label="HAWB NUMBER"><TextInput style={[styles.formInput, inputStyle(colors)]} value={form.hawb} onChangeText={(v) => setForm({ ...form, hawb: v })} /></FormRow>
        <Animated.View style={{ maxHeight: airHeight, overflow: "hidden" }}>
          <View style={[styles.airBlock, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.airBlockHeader}><Icon name="send" size={13} color={colors.primary} /><Text style={[styles.airBlockTitle, { color: colors.primary }]}>Air Export Cargo</Text></View>
            <View style={[styles.airHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.airHeaderTitle, { color: colors.primary }]}>AIR EXPORT CARGO MARSHALLING REPORT</Text><View style={styles.airHeaderGrid}><View style={styles.airHeaderCol}><FormRow label="Client"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.customer} onChangeText={(v) => setForm({ ...form, customer: v })} /></FormRow><FormRow label="HAWB"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.hawb} onChangeText={(v) => setForm({ ...form, hawb: v })} /></FormRow><FormRow label="Destination"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.destination} onChangeText={(v) => setForm({ ...form, destination: v })} /></FormRow><FormRow label="Description of Goods"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.descriptionOfGoods} onChangeText={(v) => setForm({ ...form, descriptionOfGoods: v })} /></FormRow></View><View style={styles.airHeaderCol}><FormRow label="Date"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} /></FormRow><FormRow label="Quantity"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.qty} onChangeText={setFormQty} /></FormRow><FormRow label="Dimension"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={formatDim(form.dims)} editable={false} /></FormRow><FormRow label="Actual Weight"><TextInput style={[styles.formInput, inputStyle(colors, true)]} value={form.weight} onChangeText={(v) => setForm({ ...form, weight: v })} /></FormRow></View></View></View>
            <View style={[styles.stepIndicator, { backgroundColor: colors.card, borderColor: colors.border }]}>{[{ label: "Pick up", role: "Client" }, { label: "Warehouse In", role: "WH In" }, { label: "Warehouse Out", role: "WH Out" }, { label: "Acceptance", role: "Airline Rep" }].map((s, idx) => { const active = form.airStep === idx; const complete = form.airStep > idx; const locked = isStepLocked(idx); return <TouchableOpacity key={idx} style={[styles.stepPill, active && { backgroundColor: colors.primary, borderColor: colors.primary }, complete && { borderColor: colors.primary }, locked && { opacity: 0.45 }]} disabled={locked} onPress={() => setForm({ ...form, airStep: idx })}><Text style={[styles.stepPillNumber, { color: active ? "#fff" : complete ? colors.primary : colors.mutedForeground }]}>{idx + 1}</Text><View style={styles.stepPillText}><Text style={[styles.stepPillLabel, { color: active ? "#fff" : complete ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>{s.label}</Text><Text style={[styles.stepPillRole, { color: active ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]} numberOfLines={1}>{s.role}</Text></View></TouchableOpacity>; })}</View>
            {form.airStep === 0 && <StepCard title="Step 1 · Pick up at Client" role="Driver" roleBg="#E8772220" roleText="#E87722"><View style={styles.stepCol}><FormRow label="ACCEPTANCE DETAILS"><CheckBox label="Good physical condition" checked={form.air.step1.goodPhysicalCondition} onToggle={() => toggleAirStep("step1", "goodPhysicalCondition")} disabled={isStepLocked(0)} /><CheckBox label="Labels/marking" checked={form.air.step1.labelsMarking} onToggle={() => toggleAirStep("step1", "labelsMarking")} disabled={isStepLocked(0)} /></FormRow><FormRow label="REMARKS" style={{ marginTop: 8 }}><CheckBox label="Add Remarks" checked={form.air.step1.remarksChecked} onToggle={() => toggleRemarksChecked("step1")} disabled={isStepLocked(0)} /><TextInput style={[styles.formInput, inputStyle(colors), { marginTop: 8, opacity: form.air.step1.remarksChecked && !isStepLocked(0) ? 1 : 0.6 }]} value={form.air.step1.remarks} onChangeText={(v) => updateAirStep("step1", "remarks", v)} editable={form.air.step1.remarksChecked && !isStepLocked(0)} /></FormRow><FormRow label="WEATHER CONDITION" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(0))]} value={form.air.step1.weather} onChangeText={(v) => updateAirStep("step1", "weather", v)} editable={!isStepLocked(0)} /></FormRow><FormRow label="YLPH DRIVER" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(0))]} value={form.air.step1.ylphDriver} onChangeText={(v) => updateAirStep("step1", "ylphDriver", v)} editable={!isStepLocked(0)} /></FormRow></View><View style={styles.stepCol}><FormRow label="ARRIVAL DATE"><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(0))]} value={form.air.step1.arrivalDate} onChangeText={(v) => updateAirStep("step1", "arrivalDate", v)} editable={!isStepLocked(0)} /></FormRow><FormRow label="ARRIVAL TIME" style={{ marginTop: 8 }}><MilitaryTimeInput value={form.air.step1.arrivalTime} onChange={(v) => updateAirStep("step1", "arrivalTime", v)} editable={!isStepLocked(0)} /></FormRow><FormRow label="PICKUP VERIFICATION" style={{ marginTop: 8 }}><View style={[styles.stampPanel, { backgroundColor: "#F5F7FA", borderColor: colors.border }]}><TouchableOpacity style={[styles.stampBtn, { backgroundColor: form.air.step1.pickupVerified ? "#059669" : colors.primary, opacity: isStepLocked(0) ? 0.6 : 1 }]} onPress={() => updateAirStep("step1", "pickupVerified", true)} disabled={form.air.step1.pickupVerified || isStepLocked(0)}><Text style={styles.stampBtnText}>{form.air.step1.pickupVerified ? "Pickup Confirmed" : "Confirm Pickup"}</Text></TouchableOpacity></View></FormRow></View></StepCard>}
            {form.airStep === 1 && <StepCard title="Step 2 · Warehouse In" role="WH In" roleBg="#0A1F4C20" roleText="#0A1F4C"><View style={styles.stepCol}><FormRow label="ACCEPTANCE DETAILS"><CheckBox label="Good physical condition" checked={form.air.step2.goodPhysicalCondition} onToggle={() => toggleAirStep("step2", "goodPhysicalCondition")} disabled={isStepLocked(1)} /><CheckBox label="Labels/marking" checked={form.air.step2.labelsMarking} onToggle={() => toggleAirStep("step2", "labelsMarking")} disabled={isStepLocked(1)} /></FormRow><FormRow label="REMARKS" style={{ marginTop: 8 }}><CheckBox label="Add Remarks" checked={form.air.step2.remarksChecked} onToggle={() => toggleRemarksChecked("step2")} disabled={isStepLocked(1)} /><TextInput style={[styles.formInput, inputStyle(colors), { marginTop: 8, opacity: form.air.step2.remarksChecked && !isStepLocked(1) ? 1 : 0.6 }]} value={form.air.step2.remarks} onChangeText={(v) => updateAirStep("step2", "remarks", v)} editable={form.air.step2.remarksChecked && !isStepLocked(1)} /></FormRow><FormRow label="WEATHER CONDITION" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(1))]} value={form.air.step2.weather} onChangeText={(v) => updateAirStep("step2", "weather", v)} editable={!isStepLocked(1)} /></FormRow></View><View style={styles.stepCol}><FormRow label="DATE"><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(1))]} value={form.air.step2.date} onChangeText={(v) => updateAirStep("step2", "date", v)} editable={!isStepLocked(1)} /></FormRow><FormRow label="TIME" style={{ marginTop: 8 }}><MilitaryTimeInput value={form.air.step2.time} onChange={(v) => updateAirStep("step2", "time", v)} editable={!isStepLocked(1)} /></FormRow><FormRow label="QUANTITY" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(1))]} value={form.air.step2.quantity} onChangeText={(v) => updateAirStep("step2", "quantity", v)} editable={!isStepLocked(1)} /></FormRow><FormRow label="DIGITAL STAMPS" style={{ marginTop: 8 }}><View style={[styles.stampPanel, { backgroundColor: "#F5F7FA", borderColor: colors.border }]}><TextInput style={[styles.formInput, inputStyle(colors), { opacity: form.air.step2.repVerified || isStepLocked(1) ? 0.6 : 1 }]} value={form.air.step2.tliWarehouseRep} onChangeText={(v) => updateAirStep("step2", "tliWarehouseRep", v)} editable={!form.air.step2.repVerified && !isStepLocked(1)} /><TextInput style={[styles.formInput, inputStyle(colors), { marginTop: 8, opacity: form.air.step2.repVerified || isStepLocked(1) ? 0.6 : 1 }]} value={form.air.step2.ylphWarehouseRep} onChangeText={(v) => updateAirStep("step2", "ylphWarehouseRep", v)} editable={!form.air.step2.repVerified && !isStepLocked(1)} /><TouchableOpacity style={[styles.stampBtn, { backgroundColor: form.air.step2.repVerified ? "#059669" : colors.primary, opacity: isStepLocked(1) ? 0.6 : 1 }]} onPress={() => updateAirStep("step2", "repVerified", true)} disabled={form.air.step2.repVerified || isStepLocked(1)}><Text style={styles.stampBtnText}>{form.air.step2.repVerified ? "Verified" : "Rep Login / Verify"}</Text></TouchableOpacity></View></FormRow></View></StepCard>}
            {form.airStep === 2 && <StepCard title="Step 3 · Warehouse Out" role="WH Out" roleBg="#0A1F4C20" roleText="#0A1F4C"><View style={styles.stepCol}><FormRow label="ACCEPTANCE DETAILS"><CheckBox label="Good physical condition" checked={form.air.step3.goodPhysicalCondition} onToggle={() => toggleAirStep("step3", "goodPhysicalCondition")} disabled={isStepLocked(2)} /><CheckBox label="Labels/marking" checked={form.air.step3.labelsMarking} onToggle={() => toggleAirStep("step3", "labelsMarking")} disabled={isStepLocked(2)} /></FormRow><FormRow label="REMARKS" style={{ marginTop: 8 }}><CheckBox label="Add Remarks" checked={form.air.step3.remarksChecked} onToggle={() => toggleRemarksChecked("step3")} disabled={isStepLocked(2)} /><TextInput style={[styles.formInput, inputStyle(colors), { marginTop: 8, opacity: form.air.step3.remarksChecked && !isStepLocked(2) ? 1 : 0.6 }]} value={form.air.step3.remarks} onChangeText={(v) => updateAirStep("step3", "remarks", v)} editable={form.air.step3.remarksChecked && !isStepLocked(2)} /></FormRow><FormRow label="WEATHER CONDITION" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(2))]} value={form.air.step3.weather} onChangeText={(v) => updateAirStep("step3", "weather", v)} editable={!isStepLocked(2)} /></FormRow></View><View style={styles.stepCol}><FormRow label="DATE"><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(2))]} value={form.air.step3.date} onChangeText={(v) => updateAirStep("step3", "date", v)} editable={!isStepLocked(2)} /></FormRow><FormRow label="TIME" style={{ marginTop: 8 }}><MilitaryTimeInput value={form.air.step3.time} onChange={(v) => updateAirStep("step3", "time", v)} editable={!isStepLocked(2)} /></FormRow><FormRow label="QUANTITY" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(2))]} value={form.air.step3.quantity} onChangeText={(v) => updateAirStep("step3", "quantity", v)} editable={!isStepLocked(2)} /></FormRow><FormRow label="RELEASE DIGITAL STAMP" style={{ marginTop: 8 }}><View style={[styles.stampPanel, { backgroundColor: "#F5F7FA", borderColor: colors.border }]}><TextInput style={[styles.formInput, inputStyle(colors), { opacity: form.air.step3.warehouseRepVerified || isStepLocked(2) ? 0.6 : 1 }]} value={form.air.step3.warehouseRep} onChangeText={(v) => updateAirStep("step3", "warehouseRep", v)} editable={!form.air.step3.warehouseRepVerified && !isStepLocked(2)} /><TouchableOpacity style={[styles.stampBtn, { backgroundColor: form.air.step3.warehouseRepVerified ? "#059669" : colors.primary, opacity: isStepLocked(2) ? 0.6 : 1 }]} onPress={() => updateAirStep("step3", "warehouseRepVerified", true)} disabled={form.air.step3.warehouseRepVerified || isStepLocked(2)}><Text style={styles.stampBtnText}>{form.air.step3.warehouseRepVerified ? "Stamped" : "Verify & Stamp"}</Text></TouchableOpacity></View></FormRow></View></StepCard>}
            {form.airStep === 3 && <StepCard title="Step 4 · Acceptance by YLPH Airlines Representative" role="Airline Rep" roleBg="#E8772220" roleText="#E87722"><View style={styles.stepCol}><FormRow label="MAWB"><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(3))]} value={form.air.step4.mawb} onChangeText={(v) => updateAirStep("step4", "mawb", v)} editable={!isStepLocked(3)} /></FormRow><FormRow label="ACCEPTANCE DETAILS" style={{ marginTop: 8 }}><CheckBox label="Good physical condition" checked={form.air.step4.goodPhysicalCondition} onToggle={() => toggleAirStep("step4", "goodPhysicalCondition")} disabled={isStepLocked(3)} /><CheckBox label="Labels/marking" checked={form.air.step4.labelsMarking} onToggle={() => toggleAirStep("step4", "labelsMarking")} disabled={isStepLocked(3)} /></FormRow></View><View style={styles.stepCol}><FormRow label="DATE"><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(3))]} value={form.air.step4.date} onChangeText={(v) => updateAirStep("step4", "date", v)} editable={!isStepLocked(3)} /></FormRow><FormRow label="TIME" style={{ marginTop: 8 }}><MilitaryTimeInput value={form.air.step4.time} onChange={(v) => updateAirStep("step4", "time", v)} editable={!isStepLocked(3)} /></FormRow><FormRow label="QUANTITY" style={{ marginTop: 8 }}><TextInput style={[styles.formInput, inputStyle(colors, false, isStepLocked(3))]} value={form.air.step4.quantity} onChangeText={(v) => updateAirStep("step4", "quantity", v)} editable={!isStepLocked(3)} /></FormRow><FormRow label="AIRLINE STAMP" style={{ marginTop: 8 }}><View style={[styles.stampPanel, { backgroundColor: "#F5F7FA", borderColor: colors.border }]}><TextInput style={[styles.formInput, inputStyle(colors), { opacity: form.air.step4.airlineRepVerified || isStepLocked(3) ? 0.6 : 1 }]} value={form.air.step4.airlineRep} onChangeText={(v) => updateAirStep("step4", "airlineRep", v)} editable={!form.air.step4.airlineRepVerified && !isStepLocked(3)} /><TouchableOpacity style={[styles.stampBtn, { backgroundColor: form.air.step4.airlineRepVerified ? "#059669" : colors.primary, opacity: isStepLocked(3) ? 0.6 : 1 }]} onPress={() => updateAirStep("step4", "airlineRepVerified", true)} disabled={form.air.step4.airlineRepVerified || isStepLocked(3)}><Text style={styles.stampBtnText}>{form.air.step4.airlineRepVerified ? "Stamped" : "Verify & Stamp"}</Text></TouchableOpacity></View></FormRow></View></StepCard>}
          </View>
        </Animated.View>

        {form.mode !== "Air" && (
          <>
            <FormRow label="TRUCKER APP NO.">
              <View style={[styles.autoFillRow, { backgroundColor: "#1A3A1A", borderColor: "#2D6A2D" }]}>
                <Icon name="check-circle" size={15} color="#4ADE80" />
                <Text style={[styles.autoFillText, { color: "#4ADE80" }]}>TRK-APP-20240001</Text>
                <Text style={styles.autoFillBadge}>Auto-filled</Text>
              </View>
            </FormRow>

            <FormRow label="VEHICLE PLATE NO.">
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontWeight: "700", letterSpacing: 2 }]}
                placeholder="ABC 1234"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={8}
                value={plateNumber}
                onChangeText={(v) => setPlateNumber(v.toUpperCase().replace(/[^A-Z0-9 ]/g, ""))}
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
                  style={[styles.cargoChip, { backgroundColor: form.cargoType === type ? colors.primary : colors.secondary, borderColor: form.cargoType === type ? colors.primary : colors.border }]}
                  onPress={() => setForm({ ...form, cargoType: type })}
                >
                  <Text style={[styles.cargoChipText, { color: form.cargoType === type ? "#fff" : colors.mutedForeground }]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </FormRow>

      </ScrollView>
      <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel}><Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={save}><Text style={styles.submitText}>{isEditMode ? "Save Changes" : "Submit Booking"}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function StepCard({ title, role, roleBg, roleText, children }: { title: string; role: string; roleBg: string; roleText: string; children: React.ReactNode }) {
  const colors = useColors();
  return <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.stepHeader, { borderBottomColor: colors.border }]}><Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text><View style={[styles.roleBadge, { backgroundColor: roleBg }]}><Text style={[styles.roleBadgeText, { color: roleText }]}>{role}</Text></View></View><View style={styles.stepBody}>{children}</View></View>;
}

function MilitaryTimeInput({ value, onChange, placeholder = "1300h", editable = true }: { value: string; onChange: (v: string) => void; placeholder?: string; editable?: boolean }) {
  const colors = useColors();
  return <TextInput style={[styles.formInput, inputStyle(colors, false, !editable)]} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} value={value} onChangeText={(v) => onChange(formatMilitaryTime(v))} keyboardType="numeric" maxLength={5} editable={editable} />;
}

function CheckBox({ label, checked, onToggle, disabled }: { label: string; checked: boolean; onToggle: () => void; disabled?: boolean }) {
  const colors = useColors();
  return <TouchableOpacity onPress={disabled ? undefined : onToggle} activeOpacity={disabled ? 1 : 0.8} style={[styles.checkRow, { borderColor: checked ? colors.primary : colors.border, opacity: disabled ? 0.5 : 1 }]}><View style={[styles.checkBox, { borderColor: checked ? colors.primary : colors.border, backgroundColor: checked ? colors.primary : "transparent" }]}>{checked && <Icon name="check" size={12} color="#fff" />}</View><Text style={[styles.checkLabel, { color: checked ? colors.foreground : colors.mutedForeground }]}>{label}</Text></TouchableOpacity>;
}

function FormRow({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  const colors = useColors();
  return <View style={[{ gap: 6 }, style]}><Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{label}</Text>{children}</View>;
}

const inputStyle = (colors: ReturnType<typeof useColors>, card = true, dimmed = false) => ({ backgroundColor: card ? colors.card : colors.background, borderColor: colors.border, color: colors.foreground, opacity: dimmed ? 0.6 : 1 });

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12, borderBottomWidth: 1 },
  modalBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700" as const },
  modalSub: { fontSize: 13, marginTop: 2 },
  modalScroll: { flex: 1 },
  modalFooter: { flexDirection: "row", gap: 12, padding: 20, borderTopWidth: 1 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600" as const },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" as const },
  formLabel: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  formInput: { height: 56, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, marginBottom: 16 },
  formTextarea: { height: 56, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, marginBottom: 16, textAlignVertical: "top" as const },
  cargoChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  cargoChipText: { fontSize: 12, fontWeight: "600" as const },
  autoFillRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  autoFillText: { fontSize: 13, fontWeight: "700" as const, letterSpacing: 0.5 },
  autoFillBadge: { fontSize: 9, fontWeight: "700" as const, color: "#4ADE80", borderWidth: 1, borderColor: "#4ADE80", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: "uppercase" as const },
  twoCol: { flexDirection: "row", gap: 10 },
  segmentControl: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden", padding: 3, gap: 3 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "transparent" },
  segmentText: { fontSize: 13, fontWeight: "600" as const },
  metricsPanel: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  unitToggle: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 3, gap: 3, overflow: "hidden" },
  unitOption: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8 },
  unitOptionText: { fontSize: 12, fontWeight: "700" as const },
  dimRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  dimInput: { flex: 1, height: 56, paddingHorizontal: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, fontSize: 14, textAlign: "center" },
  dimX: { fontSize: 14, fontWeight: "700" as const },
  dimUnit: { fontSize: 12, fontWeight: "600" as const },
  airBlock: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  airBlockHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  airBlockTitle: { fontSize: 13, fontWeight: "700" as const },
  airHeaderCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  airHeaderTitle: { fontSize: 13, fontWeight: "700" as const, textAlign: "center", letterSpacing: 0.5 },
  airHeaderGrid: { flexDirection: "row", gap: 10 },
  airHeaderCol: { flex: 1, gap: 8 },
  stepIndicator: { width: "100%", flexDirection: "row", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, padding: 0, overflow: "hidden" },
  stepPill: { width: "25%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 4, paddingVertical: 8, borderRadius: 0, borderWidth: 0, borderColor: "transparent" },
  stepPillNumber: { width: 22, height: 22, borderRadius: 11, textAlign: "center", lineHeight: 22, fontSize: 12, fontWeight: "700" as const },
  stepPillText: { flex: 1 },
  stepPillLabel: { fontSize: 10, fontWeight: "600" as const },
  stepPillRole: { fontSize: 9, fontWeight: "500" as const, marginTop: 1 },
  stepCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  stepHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1 },
  stepTitle: { fontSize: 13, fontWeight: "700" as const },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: "700" as const },
  stepBody: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 0, padding: 12 },
  stepCol: { width: "48%", gap: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkLabel: { fontSize: 12, fontWeight: "500" as const, flex: 1 },
  stampPanel: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  stampBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  stampBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" as const },
});