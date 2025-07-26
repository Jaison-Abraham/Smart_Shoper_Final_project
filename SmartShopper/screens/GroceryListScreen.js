import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
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
  const user = auth.currentUser;
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "groceryItems"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(list);
      }
    );
    return () => unsub();
  }, []);

  const handleAddItem = async () => {
    if (!itemName || !quantity) return;
    await addDoc(collection(db, "users", user.uid, "groceryItems"), {
      name: itemName,
      quantity,
      purchased: false,
    });
    setItemName("");
    setQuantity("");
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
      style={[styles.itemContainer, item.purchased && styles.purchased]}
      onPress={() => togglePurchased(item)}
      onLongPress={() => deleteItem(item.id)}
    >
      <Text>
        {item.name} - {item.quantity}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Grocery List</Text>
      <TextInput
        placeholder="Item name"
        value={itemName}
        onChangeText={setItemName}
        style={styles.input}
      />
      <TextInput
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        style={styles.input}
      />
      <Button title="Add Item" onPress={handleAddItem} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
      />
    </SafeAreaView>
  );
};

export default GroceryListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 5 },
  itemContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
    borderRadius: 5,
  },
  purchased: {
    backgroundColor: "#d3ffd3",
    textDecorationLine: "line-through",
  },
});
