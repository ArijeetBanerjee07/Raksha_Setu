import { useState, useEffect } from 'react';
import { NativeModules, NativeEventEmitter, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sosBlast } from '../services/sosBlast'; // Note: adjust to your actual path!

const { MonitoringModule, VolumeKeyModule } = NativeModules;

export default function useBackgroundMonitoring() {
    const [isMonitoring, setIsMonitoring] = useState(false);

    useEffect(() => {
        // Android Only Feature
        if (Platform.OS !== 'android') return;

        let isSubscribed = true;

        const init = async () => {
            // Restore state from JS layer
            const storedState = await AsyncStorage.getItem('raksha_monitoring_enabled');

            // Sync native state with JS state
            if (storedState === 'true') {
                setIsMonitoring(true);
                if (MonitoringModule?.startMonitoring) {
                    await MonitoringModule.startMonitoring();
                }
            } else {
                setIsMonitoring(false);
            }
        };

        init();

        // Event listener for Background Volume Trigger
        const eventEmitter = new NativeEventEmitter(VolumeKeyModule);
        const volumeSubscription = eventEmitter.addListener('volumeHoldDetected', async () => {
            console.log('NATIVE HOLD DEVICE TRIGGER INITIATED');

            const victimName = "User (Auto SOS)";
            // Fire your sos blast immediately from JS side.
            await sosBlast(victimName);
        });

        return () => {
            isSubscribed = false;
            volumeSubscription.remove();
        };
    }, []);

    const toggleMonitoring = async () => {
        if (Platform.OS !== 'android') return;
        try {
            const newState = !isMonitoring;

            if (newState) {
                await MonitoringModule?.startMonitoring();
            } else {
                await MonitoringModule?.stopMonitoring();
            }

            await AsyncStorage.setItem('raksha_monitoring_enabled', String(newState));
            setIsMonitoring(newState);
        } catch (error) {
            console.error('Failed to toggle monitoring:', error);
        }
    };

    return { isMonitoring, toggleMonitoring };
}
