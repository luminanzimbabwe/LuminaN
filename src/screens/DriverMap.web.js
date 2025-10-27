// DriverMap.web.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';



const DriverMap = ({ selectedDriver, mapRegion, drivers }) => {
    return (
        <View style={styles.webMapContainer}>
            <Text style={styles.webMapText}>
                ⚠️ Map View Unavailable on Web Preview
            </Text>
            <Text style={styles.webMapDetail}>
                Tracking: {selectedDriver?.name || 'N/A'}
            </Text>
            <Text style={styles.webMapDetail}>
                Lat: {selectedDriver?.lat.toFixed(4) || 'N/A'}
            </Text>
            <Text style={styles.webMapDetail}>
                Lon: {selectedDriver?.lon.toFixed(4) || 'N/A'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    webMapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C8E6C9',
        margin: 10,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    webMapText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 10,
    },
    webMapDetail: {
        fontSize: 14,
        color: '#388E3C',
    }
});

export default DriverMap;