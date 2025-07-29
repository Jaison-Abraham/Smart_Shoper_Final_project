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
      <Text style={styles.expenseTitle}>{item.description}</Text>
      <Text>${item.amount.toFixed(2)}</Text>
      <Text>Paid by: {emailToNameMap[item.paidBy] || item.paidBy}</Text>
      <Text>Split:</Text>
      {Object.entries(item.splits).map(([email, share]) => (
        <Text key={email}>
          - {emailToNameMap[email] || email}: ${share.toFixed(2)}
        </Text>
      ))}

      {item.paidBy === currentUser.email && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              navigation.navigate("AddGroupExpense", {
                group,
                editExpense: item,
              })
            }
          >
            <Ionicons name="create-outline" size={20} color="blue" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  balanceText: {
    fontSize: 16,
    marginVertical: 4,
  },
  expenseCard: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  iconBtn: {
    marginRight: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
});
