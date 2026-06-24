import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
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
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { StatusBadge } from "@/components/StatusBadge";
import { JOBS, Job, JobStatus } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const TRANSPORT_MODES = ["Land", "Air"] as const;
const CARGO_TYPES = ["Electronics", "Food Products", "Construction", "Clothing", "Medical Supplies", "Office Supplies", "Other"];
const JOB_STATUSES: JobStatus[] = ["IN_TRANSIT", "PENDING", "DELIVERED", "DELAYED", "FOR_DISPATCH", "CONFIRMED"];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const animRefs = useRef<Record<string, Animated.Value>>({});
  const [filterStatus, setFilterStatus] = useState<JobStatus | null>(null);

  const [form, setForm] = useState({
    customer: "",
    contact: "",
    origin: "",
    destination: "",
    weight: "",
    mode: "Land" as "Land" | "Air",
    cargoType: "",
    remarks: "",
  });

  JOBS.forEach((job) => {
    if (!animRefs.current[job.id]) {
      animRefs.current[job.id] = new Animated.Value(0);
    }
  });

  const toggleExpand = useCallback(
    (id: string) => {
      const isOpen = expandedId === id;
      if (!isOpen && expandedId) {
        Animated.timing(animRefs.current[expandedId], {
          toValue: 0, duration: 200, useNativeDriver: false,
        }).start();
      }
      setExpandedId(isOpen ? null : id);
      Animated.timing(animRefs.current[id], {
        toValue: isOpen ? 0 : 1, duration: 250, useNativeDriver: false,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [expandedId]
  );

  const filtered = JOBS.filter((job) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      job.id.toLowerCase().includes(q) ||
      job.customer.toLowerCase().includes(q) ||
      job.origin.toLowerCase().includes(q) ||
      job.destination.toLowerCase().includes(q);
    const matchStatus = !filterStatus || job.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const renderJob = ({ item: job }: { item: Job }) => {
    const anim = animRefs.current[job.id];
    if (!anim) return null;
    const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 160] });

    return (
      <View style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          onPress={() => toggleExpand(job.id)}
          style={({ pressed }) => [styles.jobHeader, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.jobHeaderLeft}>
            <View style={[styles.initials, { backgroundColor: "#0F172A" }]}>
              <Text style={styles.initialsText}>{job.driverInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.jobTitleRow}>
                <Text style={[styles.jobId, { color: colors.primary }]}>{job.id}</Text>
                <Text style={[styles.jobDate, { color: colors.mutedForeground }]}>{job.date}</Text>
              </View>
              <Text style={[styles.customerName, { color: colors.foreground }]} numberOfLines={1}>
                {job.customer}
              </Text>
              <Text style={[styles.routeText, { color: colors.mutedForeground }]}>
                <Feather name="map-pin" size={10} color={colors.mutedForeground} />{" "}
                {job.origin} → {job.destination}
              </Text>
            </View>
          </View>
          <View style={styles.jobHeaderRight}>
            <StatusBadge status={job.status} />
            <Feather
              name={expandedId === job.id ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </Pressable>

        <Animated.View style={{ maxHeight: maxH, overflow: "hidden" }}>
          <View style={[styles.expandBody, { borderTopColor: colors.border }]}>
            <View style={styles.detailGrid}>
              <DetailItem label="Driver" value={job.driver} />
              <DetailItem label="Truck" value={job.truck} />
              <DetailItem label="Cargo" value={job.cargo} />
              <DetailItem label="Weight" value={`${job.weight} kg`} />
              <DetailItem label="Mode" value={job.mode} />
              <DetailItem label="Contact" value={job.contact} />
            </View>
            {job.remarks && (
              <View style={[styles.remarksBox, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
                <Feather name="alert-triangle" size={12} color="#B45309" />
                <Text style={styles.remarksText}>{job.remarks}</Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <ActionButton icon="phone" label="Call" color={colors.primary} />
              <ActionButton icon="navigation" label="Navigate" color="#3B82F6" />
              <ActionButton icon="camera" label="POD" color="#8B5CF6" />
            </View>
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
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Manage</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Bookings</Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => { setShowModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New Booking</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by Job No or Customer..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: !filterStatus ? colors.primary : colors.secondary, borderColor: !filterStatus ? colors.primary : colors.border }]}
          onPress={() => setFilterStatus(null)}
        >
          <Text style={[styles.filterChipText, { color: !filterStatus ? "#fff" : colors.mutedForeground }]}>All</Text>
        </TouchableOpacity>
        {JOB_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, { backgroundColor: filterStatus === s ? colors.primary : colors.secondary, borderColor: filterStatus === s ? colors.primary : colors.border }]}
            onPress={() => setFilterStatus(filterStatus === s ? null : s)}
          >
            <Text style={[styles.filterChipText, { color: filterStatus === s ? "#fff" : colors.mutedForeground }]}>
              {s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No jobs found</Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={[styles.modalBadge, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Booking</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                Fill in shipment details below
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <FormRow label="CUSTOMER NAME *">
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Enter name"
                placeholderTextColor={colors.mutedForeground}
                value={form.customer}
                onChangeText={(v) => setForm({ ...form, customer: v })}
              />
            </FormRow>

            <FormRow label="CONTACT">
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="+63 900 000 0000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={form.contact}
                onChangeText={(v) => setForm({ ...form, contact: v })}
              />
            </FormRow>

            <View style={styles.twoCol}>
              <FormRow label="ORIGIN *" style={{ flex: 1 }}>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. Cebu City"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.origin}
                  onChangeText={(v) => setForm({ ...form, origin: v })}
                />
              </FormRow>
              <FormRow label="DESTINATION *" style={{ flex: 1 }}>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. Manila"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.destination}
                  onChangeText={(v) => setForm({ ...form, destination: v })}
                />
              </FormRow>
            </View>

            <View style={styles.twoCol}>
              <FormRow label="WEIGHT (KG)" style={{ flex: 1 }}>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. 500 kg"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={form.weight}
                  onChangeText={(v) => setForm({ ...form, weight: v })}
                />
              </FormRow>
              <FormRow label="TRANSPORT MODE" style={{ flex: 1 }}>
                <View style={[styles.segmentControl, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  {TRANSPORT_MODES.map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.segment, form.mode === mode && { backgroundColor: colors.card }]}
                      onPress={() => setForm({ ...form, mode })}
                    >
                      <Text style={[styles.segmentText, { color: form.mode === mode ? colors.primary : colors.mutedForeground }]}>
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FormRow>
            </View>

            <FormRow label="CARGO TYPE">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {CARGO_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.cargoChip,
                        { backgroundColor: form.cargoType === type ? colors.primary : colors.secondary, borderColor: form.cargoType === type ? colors.primary : colors.border },
                      ]}
                      onPress={() => setForm({ ...form, cargoType: type })}
                    >
                      <Text style={[styles.cargoChipText, { color: form.cargoType === type ? "#fff" : colors.mutedForeground }]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </FormRow>

            <FormRow label="REMARKS">
              <TextInput
                style={[styles.formTextarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Special instructions..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                value={form.remarks}
                onChangeText={(v) => setForm({ ...form, remarks: v })}
              />
            </FormRow>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowModal(false);
              }}
            >
              <Text style={styles.submitText}>Create Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color + "18", borderColor: color + "40" }]}>
      <Feather name={icon} size={15} color={color} />
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FormRow({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  const colors = useColors();
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  headerSub: { fontSize: 12, fontWeight: "500" as const, textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  newBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" as const },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { maxHeight: 48, marginBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start" },
  filterChipText: { fontSize: 12, fontWeight: "500" as const },
  jobCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  jobHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  jobHeaderLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  jobHeaderRight: { alignItems: "flex-end", gap: 8 },
  initials: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  initialsText: { color: "#fff", fontSize: 13, fontWeight: "700" as const },
  jobTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobId: { fontSize: 13, fontWeight: "700" as const },
  jobDate: { fontSize: 11 },
  customerName: { fontSize: 14, fontWeight: "600" as const, marginTop: 2 },
  routeText: { fontSize: 12, marginTop: 3 },
  expandBody: { padding: 14, borderTopWidth: 1 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 10 },
  detailItem: { width: "30%" },
  detailLabel: { fontSize: 10, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: "500" as const, marginTop: 2 },
  remarksBox: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 10, alignItems: "flex-start" },
  remarksText: { fontSize: 12, color: "#B45309", flex: 1 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: "600" as const },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
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
  formInput: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 14 },
  formTextarea: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  twoCol: { flexDirection: "row", gap: 10 },
  segmentControl: { flexDirection: "row", borderRadius: 8, borderWidth: 1, overflow: "hidden", padding: 2 },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  segmentText: { fontSize: 13, fontWeight: "600" as const },
  cargoChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  cargoChipText: { fontSize: 12, fontWeight: "500" as const },
});
