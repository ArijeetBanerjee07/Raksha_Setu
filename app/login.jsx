import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { requestSafetyPermissionsAsync } from '../utils/permissions';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if(!email || !password) {
      setErrorMsg("Please enter both email and password!");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Ask for safety permissions
      const hasPermissions = await requestSafetyPermissionsAsync();
      if (!hasPermissions) {
        setErrorMsg("Location and Microphone permissions are required to use Raksha securely.");
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
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
        <Text style={styles.title}>Welcome Back! 🍳</Text>
        <Text style={styles.subText}>Log in to access your daily recipes.</Text>

        {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}

        <View style={styles.contactCard}>
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Log In</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => router.replace('/signup')} 
          disabled={loading}
        >
           <Text style={styles.switchButtonText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FAF7F5',
    flexGrow: 1,
    paddingTop: 80,
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
  loginButton: {
    backgroundColor: '#E8855A',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  switchButton: {
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#E8855A',
    fontSize: 16,
    fontWeight: '600'
  }
});
