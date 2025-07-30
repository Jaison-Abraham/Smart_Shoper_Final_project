import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function GroupDetailsScreen() {
  const {
    params: { group },
  } = useRoute();
  const navigation = useNavigation();
  const currentUser = auth.currentUser;

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [emailToNameMap, setEmailToNameMap] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: group.name,
      headerBackTitle: "Back",
    });

    const expensesRef = collection(db, "groups", group.id, "expenses");

    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const newExpenses = [];
      snapshot.forEach((doc) => {
        newExpenses.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(newExpenses);
      calculateBalances(newExpenses);
    });

    fetchUserNames();

    return () => unsubscribe();
  }, []);

  const fetchUserNames = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const map = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      map[data.email] = data.name || data.email;
    });
    setEmailToNameMap(map);
  };

  const calculateBalances = (expenses) => {
    const balanceMap = {};

    group.members.forEach((email) => {
      balanceMap[email] = 0;
    });

    expenses.forEach((exp) => {
      const total = exp.amount;
      const paidBy = exp.paidBy;
      const splits = exp.splits;

      Object.entries(splits).forEach(([email, share]) => {
        if (email === paidBy) {
          balanceMap[email] += total - share;
        } else {
          balanceMap[email] -= share;
        }
      });
    });

    setBalances(balanceMap);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            await deleteDoc(doc(db, "groups", group.id, "expenses", id));
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle}>{item.description}</Text>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.metaText}>
        Paid by: {emailToNameMap[item.paidBy] || item.paidBy}
      </Text>

      <Text style={styles.metaText}>Split:</Text>
      {Object.entries(item.splits).map(([email, share]) => (
        <Text key={email} style={styles.splitText}>
          {emailToNameMap[email] || email}: ${share.toFixed(2)}
        </Text>
      ))}

      {item.paidBy === currentUser.email && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AddGroupExpense", {
                group,
                editExpense: item,
              })
            }
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={[styles.actionText, { color: "#FF3B30" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.innerContainer}>
        <Text style={styles.sectionTitle}>Group Balances</Text>
        {Object.entries(balances).map(([email, balance]) => (
          <Text key={email} style={styles.balanceText}>
            {emailToNameMap[email] || email}:{" "}
            {balance < 0
              ? `You owe $${Math.abs(balance).toFixed(2)}`
              : `You are owed $${balance.toFixed(2)}`}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Expenses</Text>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpense}
          scrollEnabled={false}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddGroupExpense", { group })}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  innerContainer: {
    padding: Platform.OS === "ios" ? 20 : 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    color: "#333",
  },
  balanceText: {
    fontSize: 16,
    marginVertical: 6,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    color: "#444",
  },
  expenseCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  amount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
  },
  metaText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 2,
  },
  splitText: {
    fontSize: 14,
    color: "#374151",
    paddingLeft: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563EB",
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});
