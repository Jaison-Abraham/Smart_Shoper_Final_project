import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            Alert.alert("No profile data found.");
          }
        } catch (error) {
          Alert.alert("Error fetching user data", error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{userData?.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userData?.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{userData?.phone}</Text>

        <Text style={styles.label}>Date of Birth</Text>
        <Text style={styles.value}>{userData?.dob}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>
          {userData?.address?.street}, {userData?.address?.city} -{" "}
          {userData?.address?.pin}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
    backgroundColor: "#F5F7FA",
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#222",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#888",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
