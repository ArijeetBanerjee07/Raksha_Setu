import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootIndex() {
  return <Redirect href="/onboarding" />;
}
