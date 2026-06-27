import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const STORAGE_KEY = "rare_roots_design_v10";

const emptyPlant = {
  id: "",
  name: "",
  category: "",
  qty: "",
  cost: "",
  price: "",
  status: "",
  health: "",
  location: "",
  origin: "",
  supplier: "",
  image: "",
  notes: "",
  lastWatered: "",
  nextWater: "",
  lastFertilized: "",
  nextFertilizer: "",
  sold: 0,
};

const starterPlants = [
  {
    id: "RR-001",
    name: "Caladium Mix Bulbs",
    category: "Caladium",
    qty: 100,
    cost: 3,
    price: 8,
    status: "Available",
    health: "Healthy",
    location: "Greenhouse A",
    origin: "Thailand",
    supplier: "Thai Import",
    image: "",
    notes: "Mixed tropical bulbs",
    lastWatered: "",
    nextWater: "",
    lastFertilized: "",
    nextFertilizer: "",
    sold: 0,
  },
  {
    id: "RR-002",
    name: "Philodendron Red Moon Variegated",
    category: "Philodendron",
    qty: 1,
    cost: 150,
    price: 300,
    status: "Acclimating",
    health: "Good",
    location: "Shade Rack",
    origin: "Thailand",
    supplier: "Rare Aroid Import",
    image: "",
    notes: "High value collector plant",
    lastWatered: "",
    nextWater: "",
    lastFertilized: "",
    nextFertilizer: "",
    sold: 0,
  },
];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [plants, setPlants] = useState(starterPlants);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyPlant);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [customerForm, setCustomerForm] = useState({ name: "", contact: "", wishlist: "", notes: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", category: "", notes: "" });
  const [saleCustomer, setSaleCustomer] = useState("");
  const [payment, setPayment] = useState("Cash");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [plants, sales, customers, expenses]);

  async function loadData() {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setPlants(data.plants || starterPlants);
      setSales(data.sales || []);
      setCustomers(data.customers || []);
      setExpenses(data.expenses || []);
    }
  }

  async function saveData() {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ plants, sales, customers, expenses })
    );
  }

  const inventoryCount = plants.reduce((s, p) => s + Number(p.qty || 0), 0);
  const inventoryValue = plants.reduce((s, p) => s + Number(p.qty || 0) * Number(p.price || 0), 0);
  const inventoryCost = plants.reduce((s, p) => s + Number(p.qty || 0) * Number(p.cost || 0), 0);
  const speciesCount = new Set(plants.map((p) => p.category)).size;
  const salesTotal = sales.reduce((s, x) => s + Number(x.price || 0), 0);
  const salesProfit = sales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const expenseTotal = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const netProfit = salesProfit - expenseTotal;
  const lowStock = plants.filter((p) => Number(p.qty) <= 1);

  const filteredPlants = plants.filter((p) =>
    `${p.name} ${p.category} ${p.location} ${p.status} ${p.origin}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function updateForm(key, value) {
    setForm({ ...form, [key]: value });
  }

  function savePlant() {
    if (!form.name || !form.qty || !form.price) {
      Alert.alert("Missing info", "Plant name, quantity, and price are required.");
      return;
    }

    const newPlant = {
      ...form,
      id: form.id || `RR-${Date.now().toString().slice(-5)}`,
      qty: Number(form.qty),
      cost: Number(form.cost || 0),
      price: Number(form.price),
      category: form.category || "Uncategorized",
      status: form.status || "Available",
      health: form.health || "Healthy",
      location: form.location || "Unassigned",
      origin: form.origin || "Unknown",
      supplier: form.supplier || "Unknown",
      sold: editingId ? plants.find((p) => p.id === editingId)?.sold || 0 : 0,
    };

    if (editingId) {
      setPlants(plants.map((p) => (p.id === editingId ? newPlant : p)));
    } else {
      setPlants([newPlant, ...plants]);
    }

    setForm(emptyPlant);
    setEditingId(null);
    setTab("Inventory");
  }

  function editPlant(plant) {
    setEditingId(plant.id);
    setForm({
      ...plant,
      qty: String(plant.qty),
      cost: String(plant.cost),
      price: String(plant.price),
    });
    setTab("Add Plant");
  }

  function sellPlant(plant) {
    if (plant.qty <= 0) return;

    const updated = plants.map((p) =>
      p.id === plant.id ? { ...p, qty: p.qty - 1, sold: p.sold + 1 } : p
    );

    setPlants(updated);
    setSales([
      {
        plant: plant.name,
        customer: saleCustomer || "Walk-in / Instagram",
        payment,
        price: plant.price,
        cost: plant.cost,
        profit: plant.price - plant.cost,
        date: new Date().toLocaleDateString(),
      },
      ...sales,
    ]);

    setSaleCustomer("");
    setPayment("Cash");
  }

  function addStock(plant) {
    setPlants(plants.map((p) => p.id === plant.id ? { ...p, qty: p.qty + 1 } : p));
  }

  function deletePlant(plant) {
    setPlants(plants.filter((p) => p.id !== plant.id));
  }

  function addCustomer() {
    if (!customerForm.name) return;
    setCustomers([{ ...customerForm, date: new Date().toLocaleDateString() }, ...customers]);
    setCustomerForm({ name: "", contact: "", wishlist: "", notes: "" });
  }

  function addExpense() {
    if (!expenseForm.title || !expenseForm.amount) return;
    setExpenses([
      { ...expenseForm, amount: Number(expenseForm.amount), date: new Date().toLocaleDateString() },
      ...expenses,
    ]);
    setExpenseForm({ title: "", amount: "", category: "", notes: "" });
  }

  const tabs = ["Dashboard", "Inventory", "Add Plant", "Sales", "Customers", "Expenses", "Care"];

  return (
    <ScrollView style={styles.app}>
      <StatusBar style="light" />

      <Text style={styles.logo}>🌿 Rare Roots Design</Text>
      <Text style={styles.subtitle}>Professional Plant Inventory v10</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map((item) => (
          <TouchableOpacity
            key={item}
            style={tab === item ? styles.activeTab : styles.tab}
            onPress={() => setTab(item)}
          >
            <Text style={styles.tabText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === "Dashboard" && (
        <>
          <View style={styles.grid}>
            <Metric title="Inventory Count" value={inventoryCount} />
            <Metric title="Inventory Value" value={`$${inventoryValue}`} />
            <Metric title="Species Count" value={speciesCount} />
            <Metric title="Sales" value={`$${salesTotal}`} />
            <Metric title="Net Profit" value={`$${netProfit}`} />
            <Metric title="Low Stock" value={lowStock.length} />
          </View>

          <Text style={styles.section}>Alerts</Text>
          {lowStock.map((p) => (
            <View key={p.id} style={styles.alert}>
              <Text style={styles.alertText}>⚠️ Low stock: {p.name}</Text>
            </View>
          ))}
        </>
      )}

      {tab === "Inventory" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Search plants..."
            value={search}
            onChangeText={setSearch}
          />

          <TextInput
            style={styles.input}
            placeholder="Customer name for next sale"
            value={saleCustomer}
            onChangeText={setSaleCustomer}
          />

          <TextInput
            style={styles.input}
            placeholder="Payment: Cash / Zelle / Card"
            value={payment}
            onChangeText={setPayment}
          />

          {filteredPlants.map((plant) => (
            <View key={plant.id} style={styles.plantCard}>
              {plant.image ? (
                <Image source={{ uri: plant.image }} style={styles.plantImage} />
              ) : (
                <View style={styles.emptyImage}>
                  <Text style={styles.emptyImageText}>📸 Plant Photo</Text>
                </View>
              )}

              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.badge}>{plant.id} • {plant.category}</Text>

              <Text>Qty: {plant.qty}</Text>
              <Text>Price: ${plant.price}</Text>
              <Text>Cost: ${plant.cost}</Text>
              <Text>Profit Each: ${plant.price - plant.cost}</Text>
              <Text>Status: {plant.status}</Text>
              <Text>Health: {plant.health}</Text>
              <Text>Location: {plant.location}</Text>
              <Text>Origin: {plant.origin}</Text>
              <Text>Supplier: {plant.supplier}</Text>
              <Text>Notes: {plant.notes}</Text>

              <View style={styles.row}>
                <Button label="Sell" color="#2faf62" onPress={() => sellPlant(plant)} />
                <Button label="+ Stock" color="#246ba3" onPress={() => addStock(plant)} />
                <Button label="Edit" color="#193322" onPress={() => editPlant(plant)} />
              </View>

              <View style={styles.row}>
                <Button label="Delete" color="#b83232" onPress={() => deletePlant(plant)} />
              </View>
            </View>
          ))}
        </>
      )}

      {tab === "Add Plant" && (
        <View style={styles.card}>
          <Text style={styles.section}>{editingId ? "Edit Plant" : "Add New Plant"}</Text>

          {[
            ["id", "SKU / Plant ID"],
            ["name", "Plant name"],
            ["category", "Category / Species"],
            ["qty", "Quantity"],
            ["cost", "Cost each"],
            ["price", "Selling price"],
            ["status", "Available / Acclimating / Reserved"],
            ["health", "Healthy / Good / Recovering"],
            ["location", "Greenhouse location"],
            ["origin", "Origin country"],
            ["supplier", "Supplier"],
            ["image", "Image URL"],
            ["notes", "Notes"],
            ["lastWatered", "Last watered"],
            ["nextWater", "Next watering"],
            ["lastFertilized", "Last fertilized"],
            ["nextFertilizer", "Next fertilizing"],
          ].map(([key, label]) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={label}
              value={String(form[key] || "")}
              onChangeText={(v) => updateForm(key, v)}
              keyboardType={["qty", "cost", "price"].includes(key) ? "numeric" : "default"}
            />
          ))}

          <TouchableOpacity style={styles.saveButton} onPress={savePlant}>
            <Text style={styles.buttonText}>{editingId ? "Save Changes" : "+ Add Plant"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === "Sales" && (
        <>
          <Text style={styles.section}>Sales History</Text>
          {sales.map((sale, i) => (
            <View key={i} style={styles.listCard}>
              <Text style={styles.plantName}>{sale.plant}</Text>
              <Text>Customer: {sale.customer}</Text>
              <Text>Payment: {sale.payment}</Text>
              <Text>Sold: ${sale.price}</Text>
              <Text>Profit: ${sale.profit}</Text>
              <Text>Date: {sale.date}</Text>
            </View>
          ))}
        </>
      )}

      {tab === "Customers" && (
        <>
          <Text style={styles.section}>Customers</Text>
          {["name", "contact", "wishlist", "notes"].map((key) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={key}
              value={customerForm[key]}
              onChangeText={(v) => setCustomerForm({ ...customerForm, [key]: v })}
            />
          ))}
          <TouchableOpacity style={styles.saveButton} onPress={addCustomer}>
            <Text style={styles.buttonText}>+ Add Customer</Text>
          </TouchableOpacity>

          {customers.map((c, i) => (
            <View key={i} style={styles.listCard}>
              <Text style={styles.plantName}>{c.name}</Text>
              <Text>Contact: {c.contact}</Text>
              <Text>Wishlist: {c.wishlist}</Text>
              <Text>Notes: {c.notes}</Text>
            </View>
          ))}
        </>
      )}

      {tab === "Expenses" && (
        <>
          <Text style={styles.section}>Expenses</Text>
          {["title", "amount", "category", "notes"].map((key) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={key}
              value={expenseForm[key]}
              onChangeText={(v) => setExpenseForm({ ...expenseForm, [key]: v })}
              keyboardType={key === "amount" ? "numeric" : "default"}
            />
          ))}
          <TouchableOpacity style={styles.saveButton} onPress={addExpense}>
            <Text style={styles.buttonText}>+ Add Expense</Text>
          </TouchableOpacity>

          {expenses.map((e, i) => (
            <View key={i} style={styles.listCard}>
              <Text style={styles.plantName}>{e.title}</Text>
              <Text>Amount: ${e.amount}</Text>
              <Text>Category: {e.category}</Text>
              <Text>Notes: {e.notes}</Text>
            </View>
          ))}
        </>
      )}

      {tab === "Care" && (
        <>
          <Text style={styles.section}>Care Schedule</Text>
          {plants.map((p) => (
            <View key={p.id} style={styles.listCard}>
              <Text style={styles.plantName}>{p.name}</Text>
              <Text>Health: {p.health}</Text>
              <Text>Last Watered: {p.lastWatered || "Not logged"}</Text>
              <Text>Next Water: {p.nextWater || "Not set"}</Text>
              <Text>Last Fertilized: {p.lastFertilized || "Not logged"}</Text>
              <Text>Next Fertilizer: {p.nextFertilizer || "Not set"}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function Metric({ title, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Button({ label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.smallButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: "#06140d", padding: 18 },
  logo: { color: "#dcffd9", fontSize: 30, fontWeight: "900", marginTop: 40 },
  subtitle: { color: "#9ccc9a", marginBottom: 16 },
  tabs: { marginBottom: 16 },
  tab: { backgroundColor: "#193322", padding: 11, borderRadius: 14, marginRight: 8 },
  activeTab: { backgroundColor: "#2faf62", padding: 11, borderRadius: 14, marginRight: 8 },
  tabText: { color: "white", fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metric: { backgroundColor: "#13291d", width: "48%", padding: 14, borderRadius: 18, marginBottom: 10 },
  metricTitle: { color: "#9ccc9a", fontWeight: "800" },
  metricValue: { color: "white", fontSize: 21, fontWeight: "900", marginTop: 6 },
  section: { color: "#dcffd9", fontSize: 22, fontWeight: "900", marginBottom: 12 },
  input: { backgroundColor: "white", padding: 13, borderRadius: 14, marginBottom: 10 },
  card: { backgroundColor: "#13291d", padding: 16, borderRadius: 18, marginBottom: 18 },
  plantCard: { backgroundColor: "white", padding: 16, borderRadius: 20, marginBottom: 16 },
  listCard: { backgroundColor: "white", padding: 16, borderRadius: 18, marginBottom: 12 },
  plantName: { fontSize: 19, fontWeight: "900", color: "#0f1f17", marginBottom: 6 },
  badge: { backgroundColor: "#dcffd9", padding: 7, borderRadius: 10, alignSelf: "flex-start", marginBottom: 8, fontWeight: "900" },
  plantImage: { width: "100%", height: 210, borderRadius: 16, marginBottom: 12 },
  emptyImage: { height: 210, borderRadius: 16, marginBottom: 12, backgroundColor: "#d8ffd6", alignItems: "center", justifyContent: "center" },
  emptyImageText: { fontSize: 18, fontWeight: "900", color: "#0f1f17" },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallButton: { flex: 1, padding: 11, borderRadius: 11, alignItems: "center" },
  saveButton: { backgroundColor: "#2faf62", padding: 15, borderRadius: 14, alignItems: "center", marginBottom: 14 },
  buttonText: { color: "white", fontWeight: "900" },
  alert: { backgroundColor: "#fff3d1", padding: 12, borderRadius: 12, marginBottom: 8 },
  alertText: { color: "#7a4a00", fontWeight: "900" },
});
