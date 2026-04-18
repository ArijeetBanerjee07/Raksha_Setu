import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, SafeAreaView, Animated } from 'react-native';

export default function RakshaScreen({ 
  incidentReport, 
  reportAddress, 
  contacts, 
  onDeactivate,
  segmentCount = 0,
  isRecording = false,
  isUploading = false,
  currentSegmentSeconds = 0
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Directly stop the service without a PIN prompt
  const handleDeactivate = () => {
    if (onDeactivate) {
      onDeactivate();
    }
  };

  const actualContacts = Array.isArray(contacts) && contacts.length > 0 ? contacts : [];

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* TOP CARD */}
        <View style={styles.topCard}>
          <Text style={styles.topCardTitle}>Raksha Active</Text>
          <Text style={styles.topCardSubtitle}>SMS sent • Help coming</Text>
        </View>

        {/* INCIDENT REPORT CARD */}
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>INCIDENT REPORT</Text>
          
          {!incidentReport ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#A3A3A3" />
              <Text style={styles.loadingText}>Generating secure report...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.reportText}>{incidentReport}</Text>
              
              {actualContacts.length > 0 && (
                <View style={styles.contactsSection}>
                  <Text style={styles.sectionLabel}>Contacts notified:</Text>
                  {actualContacts.map((c, i) => (
                    <Text key={i} style={styles.contactLine}>
                      {c.name || 'Contact'} ({c.phone?.startsWith('+') ? c.phone : `+91 ${c.phone}`})
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* RECORDING STATUS CARD */}
      <View style={styles.recordingCard}>
        <View style={styles.recordingHeader}>
          {isRecording && (
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
          )}
          <Text style={styles.recordingText}>
            {isRecording ? 'Recording active' : 'Audio secured'}
          </Text>
        </View>
        <Text style={styles.recordingSuccess}>
          {segmentCount} {segmentCount === 1 ? 'recording' : 'recordings'} secured <Text style={{color: '#22c55e'}}>✓</Text>
        </Text>
        <Text style={styles.recordingSegment}>
          Segment duration: {formatTime(currentSegmentSeconds)}
        </Text>
        {isUploading && (
          <Text style={styles.recordingUploading}>Uploading...</Text>
        )}
      </View>

      {/* BOTTOM BUTTONS */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.policeButton, !incidentReport && styles.disabledButton]}
          disabled={!incidentReport}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.policeButtonText}>Show this to police officer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.stopButton} onPress={handleDeactivate}>
          <Text style={styles.stopButtonText}>I am safe — tap to stop</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalText}>{incidentReport}</Text>
          </ScrollView>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#404040',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 40,
  },
  topCard: {
    backgroundColor: '#7A1F21',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9E2A2B',
  },
  topCardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  topCardSubtitle: {
    color: '#E5E5E5',
    fontSize: 15,
  },
  reportCard: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 12,
    padding: 24,
    backgroundColor: 'transparent',
  },
  reportTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#A3A3A3',
    marginLeft: 10,
    fontSize: 16,
  },
  reportText: {
    color: '#D4D4D4',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactsSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#D4D4D4',
    fontSize: 17,
    marginBottom: 8,
  },
  contactLine: {
    color: '#D4D4D4',
    fontSize: 17,
    marginBottom: 6,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  policeButton: {
    backgroundColor: '#0F5132',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  policeButtonText: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  stopButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  stopButtonText: {
    color: '#B3B3B3',
    fontSize: 17,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalScroll: {
    padding: 24,
    paddingTop: 60,
  },
  modalText: {
    color: '#FFF',
    fontSize: 28,
    lineHeight: 40,
  },
  closeModalBtn: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#A3A3A3',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recordingCard: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
    marginRight: 10,
  },
  recordingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingSuccess: {
    color: '#22c55e',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  recordingSegment: {
    color: '#A3A3A3',
    fontSize: 14,
    marginBottom: 2,
  },
  recordingUploading: {
    color: '#A3A3A3',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  }
});
