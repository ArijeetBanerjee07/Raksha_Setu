import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { requestSafetyPermissionsAsync } from '../utils/permissions';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [c1Name, setC1Name] = useState('');
  const [c1Phone, setC1Phone] = useState('');
  
  const [c2Name, setC2Name] = useState('');
  const [c2Phone, setC2Phone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignUp = async () => {
    if(!email || !password || !username || !c1Name || !c1Phone || !c2Name || !c2Phone) {
      setErrorMsg("Please fill in all blanks!");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Ask for safety permissions
      const hasPermissions = await requestSafetyPermissionsAsync();
      if (!hasPermissions) {
        setErrorMsg("Location and Microphone permissions are required to create an account.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Save additional user info and preferred contacts into Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username.trim(),
        email: email.trim(),
        contacts: [
          { name: c1Name.trim(), phone: c1Phone.trim() },
          { name: c2Name.trim(), phone: c2Phone.trim() }
        ]
      });

      // Navigate straight to the Cooking Recipes homepage once verified
      router.replace('/(tabs)');

    } catch (error) {
       setErrorMsg(error.message);
    } finally {
       setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={{flex: 1}} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Join Daily Recipes! 🍳</Text>
        <Text style={styles.subText}>Sign up to access all our meals.</Text>

        {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Text style={styles.sectionTitle}>Account Details</Text>
        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

        <Text style={styles.sectionTitle}>Emergency Protection Contacts</Text>
        <Text style={styles.stealthText}>These two trusted contacts will be notified during Raksha initialization.</Text>
        
        <View style={styles.contactCard}>
          <Text style={styles.cardTitle}>Contact 1</Text>
          <TextInput style={styles.input} placeholder="Name" value={c1Name} onChangeText={setC1Name} />
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={c1Phone} onChangeText={setC1Phone} />
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.cardTitle}>Contact 2</Text>
          <TextInput style={styles.input} placeholder="Name" value={c2Name} onChangeText={setC2Name} />
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={c2Phone} onChangeText={setC2Phone} />
        </View>

        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={handleSignUp} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ padding: 18, alignItems: 'center', marginTop: 10 }} 
          onPress={() => router.replace('/login')} 
          disabled={loading}
        >
           <Text style={{ color: '#E8855A', fontSize: 16, fontWeight: '600' }}>Already have an account? Log In</Text>
        </TouchableOpacity>

        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FAF7F5',
    flexGrow: 1,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E8855A',
    marginBottom: 8,
    textAlign: 'center'
  },
  subText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  stealthText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8855A',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    color: '#333'
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600'
  },
  signupButton: {
    backgroundColor: '#E8855A',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  }
});
