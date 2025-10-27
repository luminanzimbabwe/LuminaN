// DriverMap.native.js 
import React, { useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DriverMap = ({ selectedDriver, mapRegion, drivers, mapRef }) => {
    

    if (!selectedDriver) return null;

    return (
        <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT} 
                style={styles.map}
                region={mapRegion}
                showsUserLocation={false}
            >
                {/* Selected Driver Marker */}
                <Marker
                    coordinate={{ 
                        latitude: selectedDriver.lat, 
                        longitude: selectedDriver.lon 
                    }}
                    title={selectedDriver.name}
                    description={`Status: ${selectedDriver.status}`}
                    
                >
                    <MaterialCommunityIcons 
                        name="truck-fast" 
                        size={30} 
                        color={selectedDriver.status === 'En Route' ? '#007AFF' : '#FF9800'} 
                    />
                </Marker>
                
                {/* Other Drivers Markers */}
                {drivers.map(driver => {
                    if (driver.id !== selectedDriver.id) {
                        return (
                            <Marker
                                key={driver.id}
                                coordinate={{ latitude: driver.lat, longitude: driver.lon }}
                                title={driver.name}
                                pinColor='#4CAF50'
                            />
                        );
                    }
                    return null;
                })}
            </MapView>
            
            {/* Map Overlay for details */}
            <View style={styles.mapOverlay}>
                <Text style={styles.overlayTitle}>
                    {selectedDriver.name}
                </Text>
                <Text style={styles.overlayText}>
                    Status: {selectedDriver.status}
                </Text>
                <Text style={styles.overlayTextSmall}>
                    Lat: {selectedDriver.lat.toFixed(4)}, Lon: {selectedDriver.lon.toFixed(4)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: { flex: 1, margin: 10, borderRadius: 15, overflow: 'hidden', elevation: 3, backgroundColor: 'white' },
    map: { ...StyleSheet.absoluteFillObject },
    mapOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 10,
        alignItems: 'flex-end',
    },
    overlayTitle: {
        color: 'white',
        fontWeight: '900',
        fontSize: 16,
        marginBottom: 4,
    },
    overlayText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    overlayTextSmall: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 2,
    },
});

export default DriverMap;