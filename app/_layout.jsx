import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Animated, Dimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import RakshaScreen from '../components/RakshaScreen';
import useVolumeHoldTrigger from '../hooks/useVolumeHoldTrigger';
import { sosBlast } from '../services/sosBlast';
import { generateIncidentReport } from '../services/generateIncidentReport';
import { auth } from '../config/firebase';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { createNewCase, updateCaseDetails } from '../services/caseManager';

export default function RootLayout() {
  const { isRakshaMode, isHolding, cancelRakshaMode } = useVolumeHoldTrigger();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');

  const [incidentReport, setIncidentReport] = useState(null);
  const [reportAddress, setReportAddress] = useState(null);
  const [realContacts, setRealContacts] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);

  useEffect(() => {
    if (isHolding) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  }, [isHolding]);

  // Run the SOS blast entirely in the background without blocking the UI
  useEffect(() => {
    if (isRakshaMode) {
      const newCaseId = 'RST-' + Date.now();
      setCurrentCaseId(newCaseId);

      const userId = auth?.currentUser?.uid;
      if (userId) {
        createNewCase(userId, {
          caseId: newCaseId,
          timestamp: new Date().toISOString(),
          location: { latitude: 0, longitude: 0, address: '' },
          recordings: [],
          report: '',
          status: 'active'
        });

        sosBlast()
          .then(res => {
            console.log('Background SOS Blast Completed:', res);
            setRealContacts(res.contacts || []);
            
            const updatedLocation = {
              latitude: res.location.lat,
              longitude: res.location.lng,
              address: ''
            };

            // update location
            updateCaseDetails(userId, newCaseId, { location: updatedLocation });

            // generate report in background
            generateIncidentReport({
              name: auth?.currentUser?.displayName || 'User',
              lat: res.location.lat,
              lng: res.location.lng,
              contacts: res.contactsNotified,
              caseId: newCaseId
            }).then(result => {
              setIncidentReport(result.report);
              setReportAddress(result.address);
              
              updatedLocation.address = result.address;
              updateCaseDetails(userId, newCaseId, { 
                report: result.report,
                location: updatedLocation,
                status: 'reviewed' // optional based on trigger end
              });
            });
          })
          .catch(err => console.error('SOS Blast Uncaught Error:', err));
      }
    } else {
      setCurrentCaseId(null);
      setIncidentReport(null);
      setReportAddress(null);
      setRealContacts([]);
    }
  }, [isRakshaMode]);

  const { segmentCount, isRecording, isUploading, currentSegmentSeconds } = useAudioCapture({
    caseId: currentCaseId,
    isActive: isRakshaMode && !!currentCaseId,
    intervalSeconds: 15
  });

  // Removed the early return to avoid unmounting the Stack which breaks Expo Router

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        {isHolding && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: 'transparent' }}>
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: '#DC2626',
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width] })
              }}
            />
          </View>
        )}
        {isRakshaMode && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: '#0F172A' }}>
            <RakshaScreen 
              incidentReport={incidentReport} 
              reportAddress={reportAddress} 
              contacts={realContacts} 
              onDeactivate={cancelRakshaMode} 
              segmentCount={segmentCount}
              isRecording={isRecording}
              isUploading={isUploading}
              currentSegmentSeconds={currentSegmentSeconds}
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}
