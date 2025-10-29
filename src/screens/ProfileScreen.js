import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Linking,
    Animated,
    Platform, 
    TextInput,
    Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiDeleteAccount, apiRefreshToken, setApiToken, apiGetCurrentUser } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- NEON COLOR PALETTE ---
const NEON = {
    BACKGROUND: '#0A0E27',
    CARD_BG: 'rgba(1, 10, 40, 0.7)', // Slightly transparent dark blue
    PRIMARY_GLOW: '#00EAFB', // Bright Cyan
    SECONDARY_GLOW: '#FF44AA', // Bright Magenta/Pink for danger/accents
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#A0A8C0',
    SEPARATOR: 'rgba(50, 60, 100, 0.5)',
};

// --- COMPANY DATA ---
const COMPANY_DATA = {
    appVersion: "1.2.5",
    buildNumber: "450a",
    companyName: "luminantechnologies",
};

// --- Profile Header ---
const ProfileHeader = ({ user, handleNavigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
            <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={80} color={NEON.PRIMARY_GLOW} />
            </View>
            <Text style={styles.headerName}>{user?.username || 'User'}</Text>
            <Text style={styles.headerEmail}>{user?.email || ''}</Text>
            {user?.location && (
                <View style={styles.headerDetail}>
                    <Ionicons name="location-outline" size={16} color={NEON.TEXT_SECONDARY} />
                    <Text style={styles.headerDetailText}>{user.location}</Text>
                </View>
            )}
            {user?.phone && (
                <View style={styles.headerDetail}>
                    <Ionicons name="call-outline" size={16} color={NEON.TEXT_SECONDARY} />
                    <Text style={styles.headerDetailText}>{user.phone}</Text>
                </View>
            )}
            {user?.bio && (
                <Text style={styles.headerBio}>{user.bio}</Text>
            )}
            {user?.website && (
                <TouchableOpacity style={styles.headerDetail} onPress={() => Linking.openURL(user.website)}>
                    <Ionicons name="globe-outline" size={16} color={NEON.PRIMARY_GLOW} />
                    <Text style={[styles.headerDetailText, { color: NEON.PRIMARY_GLOW }]}>{user.website}</Text>
                </TouchableOpacity>
            )}
            {/* Navigates to EditProfile, as per original structure */}
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleNavigation('EditProfile')}
            >
                 <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- Animated Card Wrapper ---
const AnimatedCard = ({ children, delay = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 700,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, translateY, delay]);

    return (
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

// --- Navigation Item ---
const ProfileNavItem = React.memo(({ icon, title, onPress, screenName, isDanger = false, handleNavigation }) => {
    const color = isDanger ? NEON.SECONDARY_GLOW : NEON.PRIMARY_GLOW;
    
    
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };
    
    const handlePressOut = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            
            if (screenName) {
                handleNavigation(screenName);
            } else if (onPress) {
                onPress();
            }
        });
    };
    
    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
                style={[styles.navItem, isDanger && styles.navItemDanger]} 
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <Ionicons name={icon} size={24} color={color} style={styles.navIcon} />
                <Text style={[styles.navText, { color: NEON.TEXT_PRIMARY }]}>{title}</Text>
                {!isDanger && <Ionicons name="chevron-forward-outline" size={20} color={NEON.TEXT_SECONDARY} />}
            </TouchableOpacity>
        </Animated.View>
    );
});

// --- Main Screen ---
const UserProfileScreen = ({ navigation }) => {
    const { user, logout, isLoading } = useAuth();
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleNavigation = useCallback((screenName) => {
        if (navigation && navigation.navigate) {
            navigation.navigate(screenName);
            console.log(`Mapsd to: ${screenName}`);
        } else {
            console.warn(`Mock Navigation: Tried to go to ${screenName}. Navigation prop is missing.`);
        }
    }, [navigation]);

    const handleCompanyLink = () => {
        Linking.openURL('https://luminan.vercel.app/');
        console.log("Opening company contact link...");
    };

    const handleDeleteAccount = () => {

        setDeletePassword('');
        setConfirmPassword('');

        setShowPassword(false);
        setDeleteModalVisible(true);
    };

    const confirmDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            Alert.alert('Error', 'Please enter your password to confirm deletion.');
            return;
        }
        if (deletePassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match. Please enter the same password in both fields.');
            return;
        }
        setIsDeleting(true);
        try {
            
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const refreshed = await apiRefreshToken(refreshToken);
                    const newAccess = refreshed?.accessToken ?? refreshed?.access;
                    if (newAccess) {
                        await AsyncStorage.setItem('accessToken', newAccess);
                        setApiToken(newAccess);
                        
                        try {
                            await apiGetCurrentUser(newAccess);
                        } catch (verifyError) {
                            console.warn('Token verification failed after refresh:', verifyError);
                            Alert.alert('Error', 'Authentication failed. Please login again to delete your account.');
                            setIsDeleting(false);
                            return;
                        }
                    } else {
                        throw new Error('Refresh failed');
                    }
                } catch (refreshError) {
                    console.warn('Token refresh failed:', refreshError);
                    Alert.alert('Error', 'Your session has expired. Please login again to delete your account.');
                    setIsDeleting(false);
                    return;
                }
            }
            let deleteResponse;
            try {
                deleteResponse = await apiDeleteAccount(deletePassword);
            } catch (deleteError) {
                if (deleteError.response?.status === 401) {
                    
                    try {
                        const refreshedAgain = await apiRefreshToken(await AsyncStorage.getItem('refreshToken'));
                        const newAccessAgain = refreshedAgain?.accessToken ?? refreshedAgain?.access;
                        if (newAccessAgain) {
                            await AsyncStorage.setItem('accessToken', newAccessAgain);
                            setApiToken(newAccessAgain);
                            deleteResponse = await apiDeleteAccount(deletePassword);
                        } else {
                            throw new Error('Refresh failed again');
                        }
                    } catch (retryError) {
                        console.error('Retry delete failed:', retryError);
                        Alert.alert('Error', 'Authentication failed. Please login again to delete your account.');
                        setIsDeleting(false);
                        return;
                    }
                } else {
                    throw deleteError;
                }
            }
            setDeleteModalVisible(false);
            Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
                {
                    text: 'OK',
                    onPress: async () => {
                        // Clear all stored tokens and user data
                        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'setupComplete', 'tempUser', 'user']);
                        // Reset auth context
                        await logout();
                        // Completely reset navigation stack to welcome screen
                        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                    }
                }
            ]);
            // Immediately logout the user after showing the alert
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        } catch (error) {
            console.error('Delete account error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to delete account. Please try again.';
            if (errorMessage.includes('User password not set')) {
                Alert.alert('Error', 'Account deletion requires a password to be set. Please set a password first in your profile settings.');
            } else {
                Alert.alert('Error', errorMessage);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = useCallback(() => {
        setLogoutModalVisible(true);
    }, []);

    const confirmLogout = async () => {
        setLogoutModalVisible(false);
        console.log("Logging out user...");
        await logout();
        if (navigation && navigation.replace) {
            navigation.replace('Login');
        }
    };

    // Helper for rendering NavItem to reduce repetition
    const renderNavItem = (icon, title, screenName, isDanger = false) => (
        <ProfileNavItem
            key={screenName || title}
            icon={icon}
            title={title}
            screenName={screenName === 'Logout' || screenName === 'DeleteAccount' ? null : screenName}
            isDanger={isDanger}
            handleNavigation={handleNavigation}
            onPress={screenName === 'Logout' ? handleLogout : screenName === 'DeleteAccount' ? handleDeleteAccount : null}
        />
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                {/* 1. PROFILE HEADER */}
                <ProfileHeader user={user} handleNavigation={handleNavigation} />

                {/* 2. ACCOUNT MANAGEMENT (Original Card 1) 
                <AnimatedCard delay={100}>
                    <Text style={styles.cardHeader}>ACCESS IDENTITY</Text>
                    {renderNavItem("person-outline", "Edit Profile Information", "EditProfile")}
                    <View style={styles.separator} />
                    {renderNavItem("lock-closed-outline", "Change Password", "ChangePassword")}
                </AnimatedCard> */}

                {/* 3. SETTINGS & UTILITIES (Original Card 2) */}
                <AnimatedCard delay={200}>
                    <Text style={styles.cardHeader}>SYSTEM CONFIGURATION</Text>



                    {renderNavItem("shield-outline", "Security & Data Policy", "DataPolicy")}
                    <View style={styles.separator} />

                    {renderNavItem("information-circle-outline", "Help & Support", "Support")}
                    <View style={styles.separator} />

                    {/* Restored path and name to original 'Tools' destination 
                    {renderNavItem("construct-outline", "Advanced App Tools", "Tools")} */}

                </AnimatedCard>

                {/* 4. DANGER ZONE (Original Card 3) */}
                <AnimatedCard delay={300}>
                    <Text style={styles.cardHeaderDanger}>DANGER ZONE</Text>
                    {/* The Delete Account NavItem needs to call the dedicated handler */}
                    <ProfileNavItem
                        icon="trash-outline"
                        title="Delete Account Permanently"
                        isDanger={true}
                        onPress={handleDeleteAccount}
                        handleNavigation={handleNavigation}
                    />
                    <View style={styles.separatorDanger} />
                    {/* The Logout NavItem needs to call the dedicated handler */}
                    <ProfileNavItem
                        icon="log-out-outline"
                        title="Logout Session"
                        isDanger={true}
                        onPress={handleLogout}
                        handleNavigation={handleNavigation}
                    />
                </AnimatedCard>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Text style={styles.footerVersion}>
                        RUNTIME VERSION {COMPANY_DATA.appVersion} (BUILD {COMPANY_DATA.buildNumber})
                    </Text>

                    <TouchableOpacity onPress={handleCompanyLink} style={styles.companyLink}>
                        <Text style={styles.companyText}>{COMPANY_DATA.companyName}</Text>
                    </TouchableOpacity>

                    <Text style={styles.footerLove}>
                        <Ionicons name="flash" size={12} color={NEON.PRIMARY_GLOW} />
                        // CODE RUNNING //
                        <Ionicons name="flash" size={12} color={NEON.PRIMARY_GLOW} />
                    </Text>
                    <Text style={styles.footerVersion}>
                        ❤️.....Hard crafted with love in the heart of Zimre Park, Ruwa, Goromonzi.....❤️
                    </Text>
                </View>

            </ScrollView>

            {/* Logout Modal */}
            <Modal isVisible={isLogoutModalVisible} style={styles.modal}>
                <View style={styles.modalContent}>
                    <Ionicons name="log-out-outline" size={50} color={NEON.SECONDARY_GLOW} />
                    <Text style={styles.modalTitle}>Confirm Logout</Text>
                    <Text style={styles.modalMessage}>Are you sure you want to logout from your account?</Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                            <Text style={styles.confirmButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal isVisible={isDeleteModalVisible} style={styles.modal}>
                <View style={styles.modalContent}>
                    <Ionicons name="trash-outline" size={50} color={NEON.SECONDARY_GLOW} />
                    <Text style={styles.modalTitle}>Delete Account</Text>
                    <Text style={styles.modalMessage}>
                        This action is irreversible. All your data will be permanently deleted.
                    </Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            key={isDeleteModalVisible ? 'delete-modal-open' : 'delete-modal-closed'}
                            style={styles.passwordInput}
                            placeholder="Enter your password to confirm"
                            placeholderTextColor={NEON.TEXT_SECONDARY}
                            secureTextEntry={!showPassword}
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                            // *** REFINED AUTOFILL SETTINGS ***
                            autoComplete="off"
                            textContentType='none' // Explicitly set to 'none' to discourage iOS/Android autofill
                            // *********************************
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={NEON.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            key={isDeleteModalVisible ? 'confirm-delete-modal-open' : 'confirm-delete-modal-closed'}
                            style={styles.passwordInput}
                            placeholder="Confirm your password"
                            placeholderTextColor={NEON.TEXT_SECONDARY}
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            // *** REFINED AUTOFILL SETTINGS ***
                            autoComplete="off"
                            textContentType='none' // Explicitly set to 'none' to discourage iOS/Android autofill
                            // *********************************
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={NEON.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => {
                            setDeleteModalVisible(false);
                            setDeletePassword('');
                            setConfirmPassword('');
                        }}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, styles.deleteButton]}
                            onPress={confirmDeleteAccount}
                            disabled={isDeleting}
                        >
                            <Text style={styles.confirmButtonText}>
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: NEON.BACKGROUND },
    container: { flex: 1, paddingHorizontal: 15, paddingTop: 30, paddingBottom: 50 },
    
    // Header Styles
    headerContainer: { alignItems: 'center', padding: 20, marginBottom: 20 },
    avatarPlaceholder: {
        width: 100, height: 100, borderRadius: 50, 
        backgroundColor: NEON.CARD_BG,
        justifyContent: 'center', alignItems: 'center', marginBottom: 15,
        borderWidth: 2,
        borderColor: NEON.PRIMARY_GLOW,
        // Neon Glow Effect
        ...Platform.select({
            ios: { shadowColor: NEON.PRIMARY_GLOW, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, },
            android: { elevation: 15, shadowColor: NEON.PRIMARY_GLOW }
        })
    },
    headerName: { fontSize: 26, fontWeight: '900', color: NEON.TEXT_PRIMARY, textShadowColor: NEON.PRIMARY_GLOW, textShadowRadius: 3 },
    headerEmail: { fontSize: 14, color: NEON.TEXT_SECONDARY, marginBottom: 10 },
    headerDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    headerDetailText: {
        fontSize: 14,
        color: NEON.TEXT_SECONDARY,
        marginLeft: 5,
    },
    headerBio: {
        fontSize: 14,
        color: NEON.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    editButton: {
        backgroundColor: NEON.CARD_BG,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: NEON.PRIMARY_GLOW,
    },
    editButtonText: {
        color: NEON.PRIMARY_GLOW,
        fontWeight: '700',
        fontSize: 14,
    },
    
    // Card Styles
    card: {
        backgroundColor: NEON.CARD_BG, 
        borderRadius: 12, 
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(0, 234, 251, 0.2)', // Subtle neon border
        overflow: 'hidden',
        // Subtle Shadow/Glow
        ...Platform.select({
            ios: { shadowColor: 'rgba(0, 234, 251, 0.15)', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, },
            android: { elevation: 10, shadowColor: NEON.BACKGROUND }
        })
    },
    cardHeader: {
        fontSize: 12, fontWeight: '700', color: NEON.PRIMARY_GLOW,
        paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5, 
        backgroundColor: 'rgba(0, 234, 251, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: NEON.SEPARATOR,
    },
    cardHeaderDanger: {
        fontSize: 12, fontWeight: '700', color: NEON.SECONDARY_GLOW,
        paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5, 
        backgroundColor: 'rgba(255, 68, 170, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: NEON.SECONDARY_GLOW,
    },
    
    // Nav Item Styles
    navItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 15, backgroundColor: NEON.CARD_BG,
    },
    navItemDanger: {
        backgroundColor: 'rgba(255, 68, 170, 0.05)',
    },
    navIcon: { width: 30 },
    navText: { flex: 1, fontSize: 16, fontWeight: '500' },
    
    // Separator Styles
    separator: { height: 1, backgroundColor: NEON.SEPARATOR, marginLeft: 55 },
    separatorDanger: { height: 1, backgroundColor: NEON.SECONDARY_GLOW, marginLeft: 55, opacity: 0.5 },

    // Footer Styles
    footer: { alignItems: 'center', paddingVertical: 20, marginTop: 10 },
    footerVersion: { fontSize: 12, color: NEON.TEXT_SECONDARY, marginBottom: 15, fontWeight: 'bold' },
    companyLink: { marginBottom: 15, padding: 5 },
    companyText: {
        fontSize: 14, color: NEON.PRIMARY_GLOW,
        textDecorationLine: 'underline',
        fontWeight: 'bold',
    },
    footerLove: {
        fontSize: 12,
        color: NEON.TEXT_SECONDARY,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 20
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 18, color: NEON.TEXT_PRIMARY },

    // Modal Styles
    modal: {
        justifyContent: 'center',
        margin: 0,
    },
    modalContent: {
        backgroundColor: NEON.CARD_BG,
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: NEON.PRIMARY_GLOW,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: NEON.TEXT_PRIMARY,
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: NEON.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: 20,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'rgba(0, 10, 40, 0.5)',
        borderWidth: 1,
        borderColor: NEON.PRIMARY_GLOW,
        borderRadius: 8,
        marginBottom: 20,
    },
    passwordInput: {
        flex: 1,
        padding: 10,
        color: NEON.TEXT_PRIMARY,
    },
    eyeIcon: {
        padding: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: NEON.CARD_BG,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: NEON.PRIMARY_GLOW,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: NEON.PRIMARY_GLOW,
        fontWeight: 'bold',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: NEON.PRIMARY_GLOW,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: NEON.SECONDARY_GLOW,
    },
    confirmButtonText: {
        color: NEON.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
});

export default UserProfileScreen;