// screens/EditProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// --- NEON COLOR PALETTE ---
const NEON = {
  BACKGROUND: '#0A0E27',
  CARD_BG: 'rgba(1, 10, 40, 0.7)',
  PRIMARY_GLOW: '#00EAFB',
  SECONDARY_GLOW: '#FF44AA',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A0A8C0',
  SEPARATOR: 'rgba(50, 60, 100, 0.5)',
};

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile } = useAuth();
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation(user.location || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        location: location.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        website: website.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={NEON.PRIMARY_GLOW} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
            <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your exact location"
              placeholderTextColor={NEON.TEXT_SECONDARY}
              value={location}
              onChangeText={setLocation}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={NEON.TEXT_SECONDARY}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself"
              placeholderTextColor={NEON.TEXT_SECONDARY}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={NEON.TEXT_SECONDARY}
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NEON.BACKGROUND,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: NEON.PRIMARY_GLOW,
    borderRadius: 20,
  },
  saveButtonText: {
    color: NEON.BACKGROUND,
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: NEON.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: NEON.CARD_BG,
    borderWidth: 1,
    borderColor: NEON.PRIMARY_GLOW,
    borderRadius: 8,
    padding: 12,
    color: NEON.TEXT_PRIMARY,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;

