import { useState, useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';

export default function useVolumeHoldTrigger() {
  const [isHolding, setIsHolding] = useState(false);
  const [isRakshaMode, setIsRakshaMode] = useState(false);
  
  const holdTimerRef = useRef(null);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  
  // For the volume spam workaround 
  const volumeDropCountRef = useRef(0);
  const volumeTimeoutRef = useRef(null);

  const startHold = () => {
    if (holdTimerRef.current) return;
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      setIsRakshaMode(true);
      setIsHolding(false);
    }, 4000); // 4 seconds continuous hold requirement
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
  };

  const isSettingVolumeRef = useRef(false);

  useEffect(() => {
    let isSubscribed = true;

    // Supress UI volume indicator so it acts as a stealth trigger
    VolumeManager.showNativeVolumeUI({ enabled: false });

    // Actual Native Volume Listener 
    // Triggers "Raksha Mode" if volume button is pressed down repeatedly (4 times)
    const volumeListener = VolumeManager.addVolumeListener((result) => {
      // Ignore volume changes that we programmatically triggered ourselves
      if (isSettingVolumeRef.current) {
        isSettingVolumeRef.current = false;
        return;
      }

      volumeDropCountRef.current += 1;
      setIsHolding(true); // show progress bar instantly in stealth mode // show progress bar instantly in stealth mode
      
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      
      volumeTimeoutRef.current = setTimeout(() => {
        volumeDropCountRef.current = 0;
        setIsHolding(false);
      }, 1500); // User has 1.5 seconds between volume clicks
      
      // If triggered 4 times rapid-fire via hardware buttons, activate mode
      if (volumeDropCountRef.current >= 4) {
        setIsRakshaMode(true);
        setIsHolding(false);
        volumeDropCountRef.current = 0;
      }

      // CRITICAL FIX: If the user spams the button, the volume eventually hits 0% or 100%.
      // Android stops firing Volume events if it hits the maximum or minimum limit!
      // We must invisibly bounce the volume back to the middle (50%) to keep the button fully active.
      if (result.volume <= 0.1 || result.volume >= 0.9) {
        isSettingVolumeRef.current = true;
        VolumeManager.setVolume(0.5);
      }
    });

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App resumed
      }
    });

    // Fallback: 3-tap on header mechanism for Expo Go
    const onFallbackTap = DeviceEventEmitter.addListener('HEADER_TAP', () => {
      tapCountRef.current += 1;
      
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      
      tapTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 1000);

      if (tapCountRef.current >= 3) {
        setIsRakshaMode(true);
        tapCountRef.current = 0;
      }
    });

    // Fallback: Hold on header mechanism (also triggered by the UI backup)
    const onFallbackHoldStart = DeviceEventEmitter.addListener('HEADER_HOLD_START', startHold);
    const onFallbackHoldEnd = DeviceEventEmitter.addListener('HEADER_HOLD_END', cancelHold);

    return () => {
      isSubscribed = false;
      if (volumeListener) volumeListener.remove();
      appStateListener.remove();
      onFallbackTap.remove();
      onFallbackHoldStart.remove();
      onFallbackHoldEnd.remove();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, []);

  const cancelRakshaMode = () => {
    setIsRakshaMode(false);
  };

  return { isHolding, isRakshaMode, cancelRakshaMode };
}
