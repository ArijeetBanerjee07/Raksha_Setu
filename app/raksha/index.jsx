import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, Linking, Animated, 
  ScrollView 
} from 'react-native';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RakshaDashboard() {
  const [cases, setCases] = useState([]);
  const [fakeCalls, setFakeCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'fake'
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!auth?.currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let userCases = data.cases || [];
        let userFakeCalls = data.fakeCalls || [];
        
        // sort cases by timestamp descending
        userCases.sort((a, b) => {
          const dateA = new Date(a.timestamp || 0).getTime();
          const dateB = new Date(b.timestamp || 0).getTime();
          return dateB - dateA;
        });

        // sort fake calls by timestamp descending
        userFakeCalls.sort((a, b) => {
          const dateA = new Date(a.timestamp || 0).getTime();
          const dateB = new Date(b.timestamp || 0).getTime();
          return dateB - dateA;
        });

        setCases(userCases);
        setFakeCalls(userFakeCalls);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cases: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCaseSelect = (item) => {
    setSelectedCase(item);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleBackToList = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedCase(null));
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown Date';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const openMaps = (lat, lng) => {
    if (lat && lng) {
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => handleCaseSelect(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.caseId}>ID: {item.caseId}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status?.toUpperCase() || 'ACTIVE'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color="#94A3B8" />
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>
        {(item.location?.address || item.location?.latitude) ? (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color="#94A3B8" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location?.address || `${item.location?.latitude}, ${item.location?.longitude}`}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderFakeCallItem = ({ item }) => (
    <View style={styles.fakeCallCard}>
      <View style={styles.fakeCallIconWrapper}>
        <Ionicons name="call" size={24} color="#DC2626" />
      </View>
      <View style={styles.fakeCallInfo}>
        <Text style={styles.fakeCallName}>{item.contactName}</Text>
        <Text style={styles.fakeCallPhone}>{item.contactPhone}</Text>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color="#94A3B8" />
          <Text style={styles.fakeCallTime}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
    </View>
  );

  const renderDetailView = () => {
    if (!selectedCase) return null;

    return (
      <Animated.View style={[styles.detailContainer, { opacity: fadeAnim }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#E8855A" />
             <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selectedCase.caseId}</Text>
          <View style={{width: 60}} />
        </View>

        <ScrollView style={styles.detailScroll} contentContainerStyle={{paddingBottom: 40}}>
          {/* Status & Timestamp */}
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Incident Details</Text>
            <Text style={styles.detailInfoText}>
              <Text style={{fontWeight: 'bold', color: '#FFF'}}>Status: </Text>
              {selectedCase.status?.toUpperCase() || 'ACTIVE'}
            </Text>
            <Text style={styles.detailInfoText}>
               <Text style={{fontWeight: 'bold', color: '#FFF'}}>Time: </Text>
               {formatDate(selectedCase.timestamp)}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.detailCard}>
             <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Location</Text>
                <TouchableOpacity onPress={() => openMaps(selectedCase.location?.latitude, selectedCase.location?.longitude)}>
                  <Ionicons name="map-outline" size={24} color="#E8855A" />
                </TouchableOpacity>
             </View>
             {selectedCase.location?.address ? (
               <Text style={styles.paragraphText}>{selectedCase.location.address}</Text>
             ) : (
               <Text style={styles.paragraphText}>Location not fully resolved or GPS only: {selectedCase.location?.latitude}, {selectedCase.location?.longitude}</Text>
             )}
          </View>

          {/* Report */}
          <View style={styles.detailCard}>
             <View style={styles.rowBetween}>
               <Text style={styles.sectionTitle}>AI Case Report</Text>
               <Ionicons name="document-text-outline" size={24} color="#E8855A" />
             </View>
             <Text style={styles.paragraphText}>
               {selectedCase.report || "No report generated yet."}
             </Text>
          </View>

          {/* Audio Recordings */}
          <View style={styles.detailCard}>
             <View style={styles.rowBetween}>
               <Text style={styles.sectionTitle}>Audio Evidences</Text>
               <Ionicons name="mic-outline" size={24} color="#E8855A" />
             </View>
             {selectedCase.recordings && selectedCase.recordings.length > 0 ? (
               selectedCase.recordings.map((url, idx) => (
                 <TouchableOpacity 
                   key={idx} 
                   style={styles.recordingRow}
                   onPress={() => Linking.openURL(url)}
                 >
                   <Ionicons name="play-circle-outline" size={24} color="#FFF" />
                   <Text style={styles.recordingText}>Play Segment {idx + 1}</Text>
                 </TouchableOpacity>
               ))
             ) : (
               <Text style={styles.paragraphText}>No recordings secured for this case.</Text>
             )}
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!selectedCase ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="arrow-back" size={24} color="#E8855A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Raksha Dashboard</Text>
            <View style={{width: 32}} />
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'cases' && styles.tabBtnActive]}
              onPress={() => setActiveTab('cases')}
            >
              <Ionicons name="alert-circle" size={20} color={activeTab === 'cases' ? 'white' : '#94A3B8'} />
              <Text style={[styles.tabText, activeTab === 'cases' && styles.tabTextActive]}>Cases</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'fake' && styles.tabBtnActive]}
              onPress={() => setActiveTab('fake')}
            >
              <Ionicons name="call" size={20} color={activeTab === 'fake' ? 'white' : '#94A3B8'} />
              <Text style={[styles.tabText, activeTab === 'fake' && styles.tabTextActive]}>Fake Calls</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#E8855A" size="large" />
              <Text style={{marginTop: 10, color: '#A3A3A3'}}>Loading...</Text>
            </View>
          ) : activeTab === 'cases' ? (
            cases.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="shield-checkmark-outline" size={60} color="#475569" />
                <Text style={styles.emptyText}>No emergency cases found.</Text>
              </View>
            ) : (
              <FlatList
                data={cases}
                keyExtractor={item => item.caseId}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )
          ) : (
            fakeCalls.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="call-outline" size={60} color="#475569" />
                <Text style={styles.emptyText}>No fake call history.</Text>
              </View>
            ) : (
              <FlatList
                data={fakeCalls}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderFakeCallItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )
          )}
        </>
      ) : (
        renderDetailView()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E8855A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  badge: {
    backgroundColor: 'rgba(232, 133, 90, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#E8855A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 8,
    flex: 1,
  },
  
  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 80,
  },
  backText: {
    color: '#E8855A',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  detailScroll: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailInfoText: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  paragraphText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 24,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  recordingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0F172A',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    marginHorizontal: 4,
  },
  tabBtnActive: {
    backgroundColor: '#E8855A',
  },
  tabText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tabTextActive: {
    color: 'white',
  },
  fakeCallCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fakeCallIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fakeCallInfo: {
    flex: 1,
  },
  fakeCallName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fakeCallPhone: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 4,
  },
  fakeCallTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 4,
  }
});
