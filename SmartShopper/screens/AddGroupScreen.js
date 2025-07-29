import React, { useState } from 'react';
import { SafeAreaView, View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default function AddGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const user = auth.currentUser;

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        members: [user.email],
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Group created');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Enter Group Name:</Text>
      <TextInput
        value={groupName}
        onChangeText={setGroupName}
        placeholder="e.g., Roommates"
        style={styles.input}
      />
      <Button title="Create Group" onPress={handleCreateGroup} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    padding: 10, marginBottom: 12, borderRadius: 8,
  }
});
