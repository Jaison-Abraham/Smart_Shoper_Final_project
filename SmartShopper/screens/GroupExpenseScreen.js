import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function GroupExpenseScreen() {
  const [groups, setGroups] = useState([]);
  const navigation = useNavigation();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupData);
    });

    return () => unsubscribe();
  }, []);
  const handleDeleteGroup = (groupId, groupName) => {
    Alert.alert(
      "Delete Group",
      `You are about to delete the group "${groupName}". This will remove all its data. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "groups", groupId));
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete the group.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Groups</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddGroup")}>
          <Text style={styles.addButton}>+ Add Group</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.innerContainer}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupItem}
              onPress={() =>
                navigation.navigate("GroupDetails", { group: item })
              }
              onLongPress={() => handleDeleteGroup(item.id, item.name)} // <--- added
            >
              <Text style={styles.groupName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  innerContainer: {
    padding: Platform.OS === "ios" ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    fontSize: 16,
    color: "#007AFF",
  },
  groupItem: {
    padding: 16,
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
    borderRadius: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500",
  },
});
