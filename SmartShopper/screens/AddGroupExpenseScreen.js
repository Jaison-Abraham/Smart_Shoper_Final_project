import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import {
  addDoc, updateDoc, doc, collection, serverTimestamp
} from 'firebase/firestore';

export default function AddGroupExpenseScreen() {
  const navigation = useNavigation();
  const { group, editExpense } = useRoute().params;
  const currentUser = auth.currentUser;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [customSplits, setCustomSplits] = useState({});

  useEffect(() => {
    if (editExpense) {
      setDescription(editExpense.description);
      setAmount(editExpense.amount.toString());
      const splits = editExpense.splits;
      const isEqualSplit = Object.values(splits).every(
        share => share === splits[group.members[0]]
      );
      setSplitType(isEqualSplit ? 'equal' : 'custom');
      setCustomSplits(splits);
    } else {
      const initialSplits = {};
      group.members.forEach(member => {
        initialSplits[member] = '';
      });
      setCustomSplits(initialSplits);
    }
  }, []);

  const handleAddExpense = async () => {
    if (!description || !amount) {
      return Alert.alert('Error', 'Please fill all fields.');
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return Alert.alert('Invalid Amount', 'Amount must be a positive number.');
    }

    let splits = {};

    if (splitType === 'equal') {
      const share = parseFloat((amt / group.members.length).toFixed(2));
      group.members.forEach(member => {
        splits[member] = share;
      });
    } else {
      let totalSplit = 0;
      group.members.forEach(member => {
        const val = parseFloat(customSplits[member]);
        if (isNaN(val) || val < 0) {
          return Alert.alert('Invalid Share', `Invalid share for ${member}`);
        }
        totalSplit += val;
        splits[member] = val;
      });

      if (parseFloat(totalSplit.toFixed(2)) !== parseFloat(amt.toFixed(2))) {
        return Alert.alert('Mismatch', 'Custom shares must total the amount.');
      }
    }

    try {
      if (editExpense) {
        // Update existing expense
        await updateDoc(
          doc(db, 'groups', group.id, 'expenses', editExpense.id),
          {
            description,
            amount: amt,
            paidBy: currentUser.email,
            splits,
            updatedAt: serverTimestamp()
          }
        );
        Alert.alert('Success', 'Expense updated.');
      } else {
        // Add new expense
        await addDoc(collection(db, 'groups', group.id, 'expenses'), {
          description,
          amount: amt,
          paidBy: currentUser.email,
          splits,
          createdAt: serverTimestamp()
        });
        Alert.alert('Success', 'Expense added.');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Expense error:', error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const handleCustomSplitChange = (email, value) => {
    const updated = { ...customSplits, [email]: value };
    setCustomSplits(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{editExpense ? 'Edit' : 'Add'} Expense</Text>

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />

        <TextInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              splitType === 'equal' && styles.activeBtn
            ]}
            onPress={() => setSplitType('equal')}
          >
            <Text style={splitType === 'equal' && styles.activeText}>
              Split Equally
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              splitType === 'custom' && styles.activeBtn
            ]}
            onPress={() => setSplitType('custom')}
          >
            <Text style={splitType === 'custom' && styles.activeText}>
              Custom Share
            </Text>
          </TouchableOpacity>
        </View>

        {splitType === 'custom' &&
          group.members.map(member => (
            <View key={member} style={styles.customInputRow}>
              <Text>{member}</Text>
              <TextInput
                style={styles.splitInput}
                placeholder="$0.00"
                keyboardType="numeric"
                value={customSplits[member]?.toString()}
                onChangeText={(value) =>
                  handleCustomSplitChange(member, value)
                }
              />
            </View>
          ))}

        <TouchableOpacity style={styles.addBtn} onPress={handleAddExpense}>
          <Text style={styles.btnText}>
            {editExpense ? 'Update Expense' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 12
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginBottom: 16
  },
  switchBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#eee'
  },
  activeBtn: {
    backgroundColor: '#007AFF'
  },
  activeText: {
    color: 'white', fontWeight: '600'
  },
  customInputRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10
  },
  splitInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 8, width: 100, textAlign: 'right'
  },
  addBtn: {
    backgroundColor: '#007AFF', padding: 14,
    borderRadius: 10, marginTop: 20
  },
  btnText: {
    color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600'
  }
});
