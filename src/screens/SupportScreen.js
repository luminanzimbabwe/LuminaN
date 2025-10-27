import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
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

const SupportScreen = ({ navigation }) => {
  const handleBack = () => navigation.goBack();

  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    });
  };

  const handleEmail = (email) => {
    const url = `mailto:${email}?subject=Gas Delivery App Support`;
    Linking.openURL(url);
  };

  const handleWhatsApp = (phoneNumber) => {
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to contact support');
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={NEON.PRIMARY_GLOW} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Ionicons name="help-circle-outline" size={40} color={NEON.PRIMARY_GLOW} />
          <Text style={styles.introTitle}>How Can We Help?</Text>
          <Text style={styles.introText}>
            Get instant support for your gas delivery needs. Our team is here to assist you 24/7 with any questions or issues.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Phone Support</Text>
          </View>
          <Text style={styles.sectionText}>
            Call our support team for immediate assistance with technical issues, delivery problems, or account questions.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCall('0785748130/29')}
          >
            <Ionicons name="call" size={20} color={NEON.TEXT_PRIMARY} />
            <Text style={styles.contactButtonText}>Call: 0785748130/29</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>WhatsApp Support</Text>
          </View>
          <Text style={styles.sectionText}>
            Chat with us on WhatsApp for quick responses to your inquiries. Available 24/7 for urgent matters.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleWhatsApp('+263 77 288 6728')}
          >
            <Ionicons name="logo-whatsapp" size={20} color={NEON.TEXT_PRIMARY} />
            <Text style={styles.contactButtonText}>WhatsApp: 0785748130/29</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Email Support</Text>
          </View>
          <Text style={styles.sectionText}>
            Send us an email for detailed inquiries, feedback, or non-urgent support requests. We typically respond within 24 hours.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleEmail('sales@gaslt.co.zw')}
          >
            <Ionicons name="mail" size={20} color={NEON.TEXT_PRIMARY} />
            <Text style={styles.contactButtonText}>Email: sales@gaslt.co.zw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Common Issues</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>• App not loading or crashing?</Text>
            <Text style={styles.faqAnswer}>Try restarting the app or clearing cache. Contact support if issue persists.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>• Delivery not received?</Text>
            <Text style={styles.faqAnswer}>Check delivery status in app. Contact us immediately if delayed.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>• Payment issues?</Text>
            <Text style={styles.faqAnswer}>Verify payment details. Our team can help resolve transaction problems.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>• Account locked?</Text>
            <Text style={styles.faqAnswer}>Reset password or contact support for account recovery assistance.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Support Hours</Text>
          </View>
          <Text style={styles.sectionText}>
            • Phone & WhatsApp: 24/7 Available{'\n'}
            • Email: Monday - Friday, 8:00 AM - 6:00 PM CAT{'\n'}
            • Emergency Gas Delivery: Always available
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color={NEON.PRIMARY_GLOW} />
            <Text style={styles.sectionTitle}>Service Areas</Text>
          </View>
          <Text style={styles.sectionText}>
            We provide gas delivery services across Zimbabwe, with focus on major cities including Mabvazuva and surrounding areas. Contact us to confirm service availability in your location.
          </Text>
        </View>

        <View style={styles.emergencyCard}>
          <Ionicons name="warning-outline" size={30} color={NEON.SECONDARY_GLOW} />
          <Text style={styles.emergencyTitle}>Emergency Gas Supply</Text>
          <Text style={styles.emergencyText}>
            For urgent gas supply needs or safety concerns, call our emergency line immediately.
          </Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => handleCall('0785748130/29')}
          >
            <Ionicons name="call" size={20} color={NEON.TEXT_PRIMARY} />
            <Text style={styles.emergencyButtonText}>Emergency: 0785748130/29</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LuminaN Gas Delivery{'\n'}
            Safe, Reliable, Efficient{'\n'}
            ❤️...Made with care in the heart of zimre park...!
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
    marginBottom: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON.PRIMARY_GLOW,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  contactButtonText: {
    color: NEON.BACKGROUND,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  faqItem: {
    marginBottom: 15,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
    marginBottom: 5,
  },
  faqAnswer: {
    fontSize: 14,
    color: NEON.TEXT_SECONDARY,
    lineHeight: 18,
  },
  emergencyCard: {
    backgroundColor: NEON.CARD_BG,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NEON.SECONDARY_GLOW,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEON.TEXT_PRIMARY,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  emergencyText: {
    fontSize: 14,
    color: NEON.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON.SECONDARY_GLOW,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: NEON.TEXT_PRIMARY,
    fontWeight: 'bold',
    marginLeft: 10,
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

export default SupportScreen;
