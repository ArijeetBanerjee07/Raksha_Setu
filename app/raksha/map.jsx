import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Animated, TouchableOpacity, 
  ActivityIndicator, Dimensions, Linking 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { sosBlast } from '../../services/sosBlast';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

export default function RakshaMapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  
  const [selectedPlace, setSelectedPlace] = useState(null);
  const sheetAnim = useRef(new Animated.Value(height)).current;
  const webviewRef = useRef(null);

  // 1. Get Live Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let initialLoc = await Location.getCurrentPositionAsync({});
      setLocation(initialLoc.coords);
    })();
  }, []);

  // 3. UI Interactions
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_PRESS') {
        setSelectedPlace(data.payload);
        Animated.spring(sheetAnim, {
          toValue: height - 250,
          useNativeDriver: true,
        }).start();
      } else if (data.type === 'LOADED') {
        setLoadingPlaces(false);
      } else if (data.type === 'MAP_CLICK') {
        closeSheet();
      }
    } catch (e) {
      console.log('Webview message error', e);
    }
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedPlace(null));
  };

  const handleSOSBlast = async () => {
    let victimName = "User";
    try {
        const currentUser = auth.currentUser;
        if(currentUser?.uid) {
            const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if(docSnap.exists() && docSnap.data().username) {
                victimName = docSnap.data().username;
            }
        }
    } catch(e) {}
    sosBlast(victimName);
  };

  // Generate HTML for Leaflet Map
  const generateMapHTML = (lat, lng) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
              body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #0F172A; }
              #map { height: 100%; width: 100%; }
              /* Dark mode trick for OSM Map Tiles */
              .leaflet-layer,
              .leaflet-control-zoom-in, .leaflet-control-zoom-out,
              .leaflet-control-attribution {
                filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
              }
              
              .pulse {
                width: 16px; height: 16px;
                border-radius: 50%;
                background: #E8855A;  
                transform: scale(1);
                animation: pulse 2s infinite;
              }
              .pulse-inner {
                width: 8px; height: 8px; border-radius: 50%;
                background: #fff; position: absolute;
                top: 4px; left: 4px;
              }

              @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(232, 133, 90, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(232, 133, 90, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(232, 133, 90, 0); }
              }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
            const lat = ${lat};
            const lng = ${lng};
            const map = L.map('map', {zoomControl: false}).setView([lat, lng], 14);

            // Fetch free map tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            // Send close sheet event when clicking map background
            map.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
            });

            // Draw User Location
            const pulseIcon = L.divIcon({
                className: 'pulse-icon',
                html: '<div class="pulse"><div class="pulse-inner"></div></div>',
                iconSize: [16, 16]
            });
            L.marker([lat, lng], {icon: pulseIcon}).addTo(map);

            // Fetch Overpass Safe Places
            async function fetchPlaces() {
              try {
                const query = \`
                    [out:json][timeout:15];
                    (
                      node["amenity"="police"](around:3500, \${lat}, \${lng});
                      node["amenity"="hospital"](around:3500, \${lat}, \${lng});
                      way["amenity"="police"](around:3500, \${lat}, \${lng});
                      way["amenity"="hospital"](around:3500, \${lat}, \${lng});
                    );
                    out center;
                \`;

                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: query
                });

                const data = await response.json();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));

                if (data && data.elements) {
                    data.elements.forEach(el => {
                      const centerLat = el.lat || el.center?.lat;
                      const centerLon = el.lon || el.center?.lon;
                      if(!centerLat || !centerLon) return;

                      const category = el.tags?.amenity || 'safezone';
                      const name = el.tags?.name || (category === 'police' ? 'Police Station' : 'Hospital');
                      const phone = el.tags?.phone || (category === 'police' ? '100' : '108');
                      const address = el.tags?.['addr:full'] || el.tags?.['addr:street'] || 'Address unavailable';
                      
                      const placeData = {
                        id: el.id.toString(),
                        name, latitude: centerLat, longitude: centerLon, phone, category, address
                      };

                      const color = category === 'hospital' ? '#E11D48' : '#2563EB';
                      const svgIcon = L.divIcon({
                        html: \`<svg width="28" height="28" viewBox="0 0 24 24" fill="\${color}" xmlns="http://www.w3.org/2000/svg">
                                 <path stroke="#FFF" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                               </svg>\`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 28],
                        className: ''
                      });

                       const marker = L.marker([centerLat, centerLon], {icon: svgIcon}).addTo(map);
                       marker.on('click', () => {
                          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_PRESS', payload: placeData }));
                       });
                    });
                }
              } catch(e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
              }
            }
            fetchPlaces();
          </script>
      </body>
      </html>
    `;
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        {errorMsg ? (
           <View style={styles.errorCard}>
             <Ionicons name="location-outline" size={40} color="#E8855A" />
             <Text style={styles.errorTitle}>Location Denied</Text>
             <Text style={styles.errorText}>Please enable location in Settings to view nearby safe places.</Text>
           </View>
        ) : (
           <>
             <ActivityIndicator size="large" color="#E8855A" />
             <Text style={styles.loadingText}>Securing location...</Text>
           </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHTML(location.latitude, location.longitude) }}
        style={styles.map}
        onMessage={handleMessage}
        scrollEnabled={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />

      {/* Loading Overlay */}
      {loadingPlaces && (
        <View style={styles.topLoadingBar}>
           <ActivityIndicator size="small" color="#fff" />
           <Text style={styles.topLoadingText}>Downloading Map Tiles...</Text>
        </View>
      )}

      {/* Panic FAB */}
      <TouchableOpacity style={styles.panicFab} onPress={handleSOSBlast} activeOpacity={0.7}>
        <Ionicons name="flash" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Place Detail Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
        {selectedPlace && (
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
               <Text style={styles.placeName}>{selectedPlace.name}</Text>
               <TouchableOpacity onPress={closeSheet}>
                 <Ionicons name="close-circle" size={28} color="#94A3B8" />
               </TouchableOpacity>
            </View>
            
            <View style={styles.placeInfoRow}>
              <Ionicons name="location" size={18} color="#94A3B8" />
              <Text style={styles.placeAddress} numberOfLines={2}>
                {selectedPlace.address}
              </Text>
            </View>
            
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {haversineKm(location.latitude, location.longitude, selectedPlace.latitude, selectedPlace.longitude).toFixed(1)} km away
              </Text>
            </View>

            <View style={styles.actionRow}>
               <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => Linking.openURL(`tel:${selectedPlace.phone}`)}
               >
                 <Ionicons name="call" size={20} color="#fff" />
                 <Text style={styles.actionTx}>Call Now</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#E8855A' }]}
                  onPress={handleSOSBlast}
               >
                 <Ionicons name="navigate-circle" size={20} color="#fff" />
                 <Text style={styles.actionTx}>Share Location</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  map: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
  },
  topLoadingBar: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLoadingText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  errorText: {
    color: '#94A3B8',
    textAlign: 'center',
  },
  panicFab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 250,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 10,
  },
  placeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeAddress: {
    color: '#CBD5E1',
    marginLeft: 6,
    flex: 1,
  },
  distanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  distanceText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  actionTx: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  }
});
