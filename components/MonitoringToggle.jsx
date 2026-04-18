import React from 'react';
import { View, Text, Switch, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import useBackgroundMonitoring from '../hooks/useBackgroundMonitoring';

export default function MonitoringToggle() {
    const { isMonitoring, toggleMonitoring } = useBackgroundMonitoring();

    // Non-Android platforms don't have this feature
    if (Platform.OS !== 'android') return null;

    const handleToggle = async () => {
        // ALWAYS fire the native toggle immediately so the service actually starts
        toggleMonitoring();

        // If turning ON, attempt to request the permission for visibility on Android 13+.
        // Never block or show annoying popups if the OS lies about the permission state.
        if (!isMonitoring && Platform.Version >= 33) {
            try {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            } catch (err) {
                console.warn('Silent permission error:', err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Background Sync</Text>
            <Switch
                trackColor={{ false: '#767577', true: '#E8855A' }}
                thumbColor={isMonitoring ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleToggle}
                value={isMonitoring}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F1F3F5',
        borderRadius: 20,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginRight: 6,
        fontWeight: '600',
    },
});
