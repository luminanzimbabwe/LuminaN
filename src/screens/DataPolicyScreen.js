import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const DataPolicyScreen = ({ navigation }) => {
  const handleBack = () => navigation.goBack();

  const handleContact = () => {
    Linking.openURL('mailto:sales@gaslt.co.zw?subject=Data Policy Inquiry');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={NEON.PRIMARY_GLOW} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Data Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark-outline" size={40} color={NEON.PRIMARY_GLOW} />
          <Text style={styles.introTitle}>Your Data, Our Priority</Text>
          <Text style={styles.introText}>
            At GasLT Gas Delivery, we are committed to protecting your privacy and ensuring secure delivery of gas services.
            This policy outlines how we collect, use, and safeguard your information.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Information We Collect</Text>
          </View>
          <Text style={styles.sectionText}>
            • Personal details: Name, email, phone number, delivery address{'\n'}
            • Location data for accurate gas delivery routing{'\n'}
            • Payment information (processed securely through certified providers){'\n'}
            • Usage data to improve our delivery services{'\n'}
            • Device information for app optimization
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          </View>
          <Text style={styles.sectionText}>
            • Process and deliver gas orders efficiently{'\n'}
            • Provide customer support and respond to inquiries{'\n'}
            • Improve our services and develop new features{'\n'}
            • Ensure safety and compliance with gas delivery regulations{'\n'}
            • Send important updates about your deliveries
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Data Security</Text>
          </View>
          <Text style={styles.sectionText}>
            We employ industry-standard encryption and security measures to protect your data:{'\n'}
            • End-to-end encryption for all communications{'\n'}
            • Secure payment processing{'\n'}
            • Regular security audits and updates{'\n'}
            • Restricted access to personal information{'\n'}
            • Safe storage of delivery addresses and preferences
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="share-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Data Sharing</Text>
          </View>
          <Text style={styles.sectionText}>
            We do not sell your personal information. Data may be shared only:{'\n'}
            • With delivery partners for order fulfillment{'\n'}
            • With payment processors for transaction security{'\n'}
            • When required by law or to protect safety{'\n'}
            • With your explicit consent for service improvements
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Data Retention</Text>
          </View>
          <Text style={styles.sectionText}>
            • Account data retained while active{'\n'}
            • Delivery history kept for 3 years for support{'\n'}
            • Payment data retained per regulatory requirements{'\n'}
            • Inactive accounts deleted after 2 years{'\n'}
            • You can request data deletion anytime
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Your Rights</Text>
          </View>
          <Text style={styles.sectionText}>
            You have the right to:{'\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate information{'\n'}
            • Request data deletion{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Data portability{'\n'}
            • Lodge complaints with authorities
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame-outline" size={24} color={NEON.SECONDARY_GLOW} />
            <Text style={styles.sectionTitle}>Gas Delivery Safety</Text>
          </View>
          <Text style={styles.sectionText}>
            Your safety is paramount in gas delivery:{'\n'}
            • Certified delivery personnel{'\n'}
            • Safety inspections before each delivery{'\n'}
            • Emergency response protocols{'\n'}
            • Real-time tracking for transparency{'\n'}
            • Quality assurance for all gas products
          </Text>
        </View>

        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={30} color={NEON.PRIMARY_GLOW} />
          <Text style={styles.contactTitle}>Questions About Your Data?</Text>
          <Text style={styles.contactText}>
            Contact our privacy team for any concerns or requests regarding your personal information.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactButtonText}>Contact Privacy Team</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: December 2024{'\n'}
            luminantechnologies - developer
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: NEON.SEPARATOR,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introCard: {
    backgroundColor: NEON.CARD_BG,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NEON.PRIMARY_GLOW,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: NEON.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: NEON.CARD_BG,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 234, 251, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
    marginLeft: 10,
  },
  sectionText: {
    fontSize: 14,
    color: NEON.TEXT_SECONDARY,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: NEON.CARD_BG,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NEON.PRIMARY_GLOW,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 14,
    color: NEON.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: NEON.PRIMARY_GLOW,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: NEON.BACKGROUND,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: NEON.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DataPolicyScreen;
