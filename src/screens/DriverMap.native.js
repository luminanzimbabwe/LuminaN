// DriverMap.native.js
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { Marker, AnimatedRegion, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DriverMap = ({ selectedDriver, mapRegion, drivers, mapRef }) => {
  if (!selectedDriver) return null;

  // Animated region for smooth movement
  const coordinate = useRef(
    new AnimatedRegion({
      latitude: selectedDriver.lat,
      longitude: selectedDriver.lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    })
  ).current;

  useEffect(() => {
    coordinate.timing({
      latitude: selectedDriver.lat,
      longitude: selectedDriver.lon,
      duration: 1500, // smooth transition
      useNativeDriver: false,
    }).start();

    // Optional: recenter map automatically
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedDriver.lat,
          longitude: selectedDriver.lon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        800
      );
    }
  }, [selectedDriver.lat, selectedDriver.lon]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={false}
        customMapStyle={darkMapStyle} // Dark theme
      >
        {/* Selected Driver Marker */}
        <Marker.Animated coordinate={coordinate} title={selectedDriver.name}>
          <MaterialCommunityIcons
            name="truck-fast"
            size={35}
            color={selectedDriver.status === 'En Route' ? '#00eaff' : '#FF9800'}
          />
        </Marker.Animated>

        {/* Other drivers */}
        {drivers.map(driver => {
          if (driver.id !== selectedDriver.id) {
            return (
              <Marker
                key={driver.id}
                coordinate={{ latitude: driver.lat, longitude: driver.lon }}
                title={driver.name}
                pinColor="#4CAF50"
              />
            );
          }
          return null;
        })}
      </MapView>

      {/* Overlay */}
      <View style={styles.mapOverlay}>
        <Text style={styles.overlayTitle}>{selectedDriver.name}</Text>
        <Text style={styles.overlayText}>Status: {selectedDriver.status}</Text>
        <Text style={styles.overlayTextSmall}>
          Lat: {selectedDriver.lat.toFixed(4)}, Lon: {selectedDriver.lon.toFixed(4)}
        </Text>
      </View>
    </View>
  );
};

// Dark map style (Google Maps)
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f2f2f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];

const styles = StyleSheet.create({
  mapContainer: { flex: 1, margin: 10, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 7,
  },
  overlayTitle: {
    color: '#00eaff',
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 4,
  },
  overlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  overlayTextSmall: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
});

export default DriverMap;
