import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const GroceryListScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const user = auth.currentUser;
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "groceryItems"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(list);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddItem = async () => {
    if (!itemName.trim() || !quantity.trim()) {
      Alert.alert("Missing Info", "Please enter both item name and quantity.");
      return;
    }

    await addDoc(collection(db, "users", user.uid, "groceryItems"), {
      name: itemName.trim(),
      quantity: quantity.trim(),
      purchased: false,
    });

    setItemName("");
    setQuantity("");
    setShowModal(true);
    setTimeout(() => setShowModal(false), 2000);
  };

  const togglePurchased = async (item) => {
    await updateDoc(doc(db, "users", user.uid, "groceryItems", item.id), {
      purchased: !item.purchased,
    });
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "groceryItems", id));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, item.purchased && styles.purchasedItem]}
      onPress={() => togglePurchased(item)}
      onLongPress={() => deleteItem(item.id)}
    >
      <Text style={[styles.itemText, item.purchased && styles.purchasedText]}>
        {item.name} - {item.quantity}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : 20}
        style={styles.wrapper}
      >
        <SafeAreaView style={styles.inner}>
          <Text style={styles.title}>Grocery List</Text>

          <View style={styles.inputCard}>
            <TextInput
              placeholder="Item name"
              value={itemName}
              onChangeText={setItemName}
              style={styles.input}
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              style={styles.input}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Text style={styles.addButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: tabBarHeight, flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
          />
        </SafeAreaView>

        <Modal
          transparent
          visible={showModal}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>Item added successfully!</Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

export default GroceryListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    marginVertical: 20,
  },
  inputCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    borderRadius: 4,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
    marginTop: 20,
  },
  itemContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  purchasedItem: {
    backgroundColor: "#d4edda",
  },
  purchasedText: {
    textDecorationLine: "line-through",
    color: "#6c757d",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    elevation: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    color: "#155724",
    fontWeight: "600",
  },
});
