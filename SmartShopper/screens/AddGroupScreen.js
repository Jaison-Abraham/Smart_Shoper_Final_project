import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

export default function AddGroupScreen({ navigation }) {
  const currentUser = auth.currentUser;
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([
    { email: currentUser.email, name: currentUser.displayName || "You" },
  ]);
  const [friendEmail, setFriendEmail] = useState("");

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return;

    if (
      members.find((m) => m.email === friendEmail) ||
      friendEmail === currentUser.email
    ) {
      Alert.alert("Duplicate", "This email is already in the group.");
      return;
    }

    const q = query(collection(db, "users"), where("email", "==", friendEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      Alert.alert("Not Found", "No user found with this email.");
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    setMembers((prev) => [
      ...prev,
      { email: friendEmail, name: userData.name || friendEmail },
    ]);
    setFriendEmail("");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Missing Info", "Please enter a group name.");
      return;
    }

    const emailsOnly = members.map((m) => m.email);

    try {
      await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        members: emailsOnly,
        createdAt: new Date(),
      });
      Alert.alert("Success", "Group created!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Could not create group.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>
      <View style={styles.innerContainer}>
        <TextInput
          placeholder="Group Name"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
        />

        <Text style={styles.friendCount}>
          Friends added: {members.length - 1}
        </Text>

        <View style={styles.row}>
          <TextInput
            placeholder="Friend's Email"
            value={friendEmail}
            onChangeText={setFriendEmail}
            style={[styles.input, { flex: 1, marginRight: 10 }]}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Group Members:</Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item.email}
          renderItem={({ item }) => (
            <Text style={styles.member}>{item.name}</Text>
          )}
        />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: "#FF3B30" }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: "#34C759" }]}
          onPress={handleCreateGroup}
        >
          <Text style={styles.footerButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  innerContainer: {
    padding: Platform.OS === "ios" ? 20 : 0,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  friendCount: {
    marginVertical: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
  },
  member: {
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    gap: 10,
    padding: Platform.OS === "ios" ? 20 : 0,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  footerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
