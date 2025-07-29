import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

export default function AddGroupScreen({ navigation }) {
  const currentUser = auth.currentUser;
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([
    { email: currentUser.email, name: currentUser.displayName || "You" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
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
    setModalVisible(false);
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

      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.addFriendButton}
      >
        <Text style={styles.addFriendText}>+ Add Friend</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Group Members:</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <Text style={styles.member}>{item.name}</Text>
        )}
      />

      <Button title="Create Group" onPress={handleCreateGroup} />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Friend's Email</Text>
            <TextInput
              placeholder="Email"
              value={friendEmail}
              onChangeText={setFriendEmail}
              style={styles.modalInput}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                color="red"
                onPress={() => setModalVisible(false)}
              />
              <Button title="Add" onPress={handleAddFriend} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: "#ccc",
  },
  addFriendButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addFriendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  member: {
    padding: 8,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
