import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const { width, height } = Dimensions.get('window');

export default function FakeCallTab({ autoStart = false }) {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'incoming' | 'oncall'
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedDelay, setSelectedDelay] = useState('now'); // 'now' | '10' | '30'
  const [countdown, setCountdown] = useState(null); // null or number
  const [callTimer, setCallTimer] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for "Incoming call..."
  useEffect(() => {
    if (screen === 'incoming') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [screen]);

  // Read contacts from Firestore
  useEffect(() => {
    async function loadContacts() {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.contacts?.length > 0) {
            setContacts(data.contacts);
            setSelectedContact(data.contacts[0]);
          }
        }
      } catch (e) {
        console.log('Error loading contacts:', e);
      }
      setLoading(false);
    }
    loadContacts();
  }, []);

  // Handle autoStart
  useEffect(() => {
    if (autoStart && contacts.length > 0 && !loading) {
       setScreen('incoming');
    }
  }, [autoStart, contacts, loading]);

  // Handle Vibration for Incoming Screen
  useEffect(() => {
    if (screen === 'incoming') {
      // Vibrate every 2 seconds: [wait, vibrate, wait, vibrate...]
      const ONE_SECOND_IN_MS = 1000;
      const PATTERN = [
        0, 
        ONE_SECOND_IN_MS, 
        ONE_SECOND_IN_MS
      ];
      Vibration.vibrate(PATTERN, true);
    } else {
      Vibration.cancel();
    }
    return () => Vibration.cancel();
  }, [screen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  async function triggerFakeCall() {
    if (!selectedContact) return;

    const delay = selectedDelay === 'now' ? 0 :
                  selectedDelay === '10' ? 10 : 30;

    if (delay === 0) {
      setScreen('incoming');
      return;
    }

    // Start countdown
    setCountdown(delay);
    let remaining = delay;
    countdownRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        setScreen('incoming');
      }
    }, 1000);
  }

  async function cancelCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }

  async function answerCall() {
    setScreen('oncall');
    setCallTimer(0);

    // Start call timer
    timerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);

    // Log the fake call trigger in user's doc
    const uid = auth.currentUser?.uid;
    if (uid) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                fakeCalls: arrayUnion({
                    contactName: selectedContact.name,
                    contactPhone: selectedContact.phone,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (e) {
            console.log("Error logging fake call:", e);
        }
    }

    // Play audio
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/fake_call.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
      
      // Keep showing on call screen even after audio ends
      sound.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) {
              // Silent continuation
          }
      });
    } catch (e) {
      console.log('Audio error (silent):', e);
    }
  }

  async function endCall() {
    // Stop timer
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }

    // Stop and unload audio
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }

    setCallTimer(0);
    setScreen('setup');
  }

  if (screen === 'incoming') {
    return (
      <View style={styles.incomingContainer}>
        <View style={styles.incomingTop}>
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>{getInitials(selectedContact?.name)}</Text>
          </View>
          <Text style={styles.contactNameBig}>{selectedContact?.name}</Text>
          <Text style={styles.phoneNumberSmall}>{selectedContact?.phone}</Text>
          <Animated.Text style={[styles.incomingStatus, { opacity: pulseAnim }]}>
            Incoming call...
          </Animated.Text>
        </View>

        <View style={styles.incomingBottom}>
          <View style={styles.actionButtons}>
            <View style={styles.actionBtnWrapper}>
              <TouchableOpacity style={styles.declineBtn} onPress={endCall}>
                <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            <View style={styles.actionBtnWrapper}>
              <TouchableOpacity style={styles.answerBtn} onPress={answerCall}>
                <Ionicons name="call" size={32} color="white" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Answer</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (screen === 'oncall') {
    return (
      <View style={styles.onCallContainer}>
        <View style={styles.onCallTop}>
          <View style={[styles.initialsCircle, { marginTop: 100 }]}>
            <Text style={styles.initialsText}>{getInitials(selectedContact?.name)}</Text>
          </View>
          <Text style={styles.contactNameBig}>{selectedContact?.name}</Text>
          <Text style={styles.timerText}>{formatTimer(callTimer)}</Text>
        </View>

        <View style={styles.onCallBottom}>
           <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
             <Ionicons name="call" size={36} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
           </TouchableOpacity>
           <Text style={styles.actionLabel}>End Call</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Countdown Banner */}
      {countdown !== null && (
        <View style={styles.countdownBanner}>
          <Text style={styles.countdownText}>📞 Incoming call in {countdown} seconds...</Text>
          <TouchableOpacity onPress={cancelCountdown}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="call" size={40} color="#DC2626" />
          </View>
          <Text style={styles.title}>Fake Incoming Call</Text>
          <Text style={styles.subtitle}>Trigger a realistic fake call to escape uncomfortable situations</Text>
        </View>

        {/* Caller Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Who is calling?</Text>
          {loading ? (
              <ActivityIndicator color="#DC2626" size="small" style={{ marginVertical: 20 }} />
          ) : contacts.length > 0 ? (
            contacts.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.contactCard,
                  selectedContact?.name === contact.name && styles.selectedContactCard,
                ]}
                onPress={() => setSelectedContact(contact)}
              >
                <View style={styles.contactRow}>
                  <View style={[
                      styles.dot, 
                      selectedContact?.name === contact.name && styles.selectedDot
                  ]} />
                  <View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noContactsText}>Add contacts in your profile first</Text>
          )}
        </View>

        {/* Delay Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Call me in:</Text>
          <View style={styles.delayRow}>
            {['now', '10', '30'].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.delayBtn,
                  selectedDelay === val && styles.selectedDelayBtn,
                ]}
                onPress={() => setSelectedDelay(val)}
              >
                <Text
                  style={[
                    styles.delayBtnText,
                    selectedDelay === val && styles.highlightText,
                  ]}
                >
                  {val === 'now' ? 'Now' : `${val} sec`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Trigger Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.triggerBtn,
            !selectedContact && styles.disabledBtn,
          ]}
          disabled={!selectedContact}
          onPress={triggerFakeCall}
        >
          <Text style={styles.triggerBtnText}>📞 Trigger Fake Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  countdownBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 100,
  },
  countdownText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedContactCard: {
    borderColor: '#DC2626',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#475569',
    marginRight: 15,
  },
  selectedDot: {
    backgroundColor: '#DC2626',
  },
  contactName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactPhone: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  noContactsText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  delayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  delayBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedDelayBtn: {
    backgroundColor: '#DC2626',
  },
  delayBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  highlightText: {
    color: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#0F172A',
  },
  triggerBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  disabledBtn: {
    backgroundColor: '#475569',
  },
  triggerBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Incoming Screen Styles
  incomingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  incomingTop: {
    alignItems: 'center',
  },
  initialsCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  initialsText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  contactNameBig: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phoneNumberSmall: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 20,
  },
  incomingStatus: {
    color: '#94A3B8',
    fontSize: 14,
  },
  incomingBottom: {
    paddingBottom: 60,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
  },
  actionBtnWrapper: {
    alignItems: 'center',
  },
  declineBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  answerBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },

  // On Call Screen Styles
  onCallContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  onCallTop: {
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 24,
    marginTop: 10,
    fontFamily: 'monospace',
  },
  onCallBottom: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  endCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
});
