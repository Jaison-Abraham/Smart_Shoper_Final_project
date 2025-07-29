import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function ExpenseTrackerScreen() {
  const user = auth.currentUser;
  const navigation = useNavigation();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [owedToYou, setOwedToYou] = useState(0);

  useEffect(() => {
    if (!user) return;

    const expenseRef = collection(db, "users", user.uid, "personalExpenses");
    const q = query(expenseRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExpenses(data);
      const totalValue = data.reduce((sum, e) => sum + (e.amount || 0), 0);
      setTotal(totalValue);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;

    const unsubscribeFns = [];

    const fetchGroupBalances = async () => {
      const groupsQuery = query(
        collection(db, "groups"),
        where("members", "array-contains", user.email)
      );

      const groupSnap = await getDocs(groupsQuery);

      groupSnap.forEach((groupDoc) => {
        const groupId = groupDoc.id;
        const expensesRef = collection(db, "groups", groupId, "expenses");

        const unsubscribe = onSnapshot(expensesRef, (snap) => {
          let owe = 0;
          let owed = 0;

          snap.forEach((doc) => {
            const exp = doc.data();
            const splits = exp.splits || {};
            const amount = exp.amount || 0;
            const paidBy = exp.paidBy;

            const yourShare = splits[user.email] || 0;

            if (paidBy === user.email) {
              owed += amount - yourShare;
            } else {
              owe += yourShare;
            }
          });

          setYouOwe(owe);
          setOwedToYou(owed);
        });

        unsubscribeFns.push(unsubscribe);
      });
    };

    fetchGroupBalances();

    return () => unsubscribeFns.forEach((unsub) => unsub());
  }, [user]);

  const handleAddExpense = async () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return Alert.alert("Invalid Input", "Amount must be a positive number");
    }

    try {
      await addDoc(collection(db, "users", user.uid, "personalExpenses"), {
        description,
        amount: amountNumber,
        timestamp: new Date(),
      });

      setDescription("");
      setAmount("");
    } catch (err) {
      Alert.alert("Error", "Failed to add expense.");
    }
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <Text style={styles.expenseText}>{item.description}</Text>
      <Text style={styles.expenseText}>${item.amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>You Owe</Text>
          <Text style={styles.cardValue}>${youOwe.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Owed to You</Text>
          <Text style={styles.cardValue}>${owedToYou.toFixed(2)}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Add Personal Expense</Text>
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <TextInput
        placeholder="Amount ($)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="Add Expense" onPress={handleAddExpense} />

      <Text style={styles.totalText}>
        Total Personal Expenses: ${total.toFixed(2)}
      </Text>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={styles.sharedButton}
        onPress={() => navigation.navigate("GroupExpense")}
      >
        <Text style={styles.sharedButtonText}>Go to Shared Expenses</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#f0f4ff",
    padding: 15,
    borderRadius: 10,
    width: "48%",
  },
  cardTitle: {
    fontSize: 16,
    color: "#555",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  totalText: {
    fontWeight: "600",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },

  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  expenseText: {
    fontSize: 15,
  },

  sharedButton: {
    position: "absolute",
    bottom: 10,
    left: 16,
    right: 16,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
  },

  sharedButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
