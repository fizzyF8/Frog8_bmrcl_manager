import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, RefreshControl, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { User, Mail, Phone, FileText, LogOut, Moon, Bell, Shield, CircleHelp as HelpCircle, ChevronRight, Calendar, MapPin, Building, ArrowLeft, Camera } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import SyncStatus from '@/components/ui/SyncStatus';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { getTimeElapsedString } from '@/utils/time';
import { authApi, updateUser, ProfileResponse } from '@/utils/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import Icon from 'react-native-vector-icons/Feather';
// import { usePermissions } from '@/hooks/usePermissions';

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const [syncState, setSyncState] = useState<'offline' | 'syncing' | 'synced' | 'error'>('synced');
  const [notifications, setNotifications] = useState(true);
  const { theme, themeType, toggleTheme } = useTheme();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile_image_url || '');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const { width, height } = Dimensions.get('window');
  // const { hasPermission } = usePermissions();

  const handleLogout = () => {
    logout();
  };

  const fetchProfileData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      setError(null);
      setSyncState('syncing');
      const response: ProfileResponse = await authApi.getProfile();
      if (response.status === 'true' && response.user) {
        setSyncState('synced');
        setLastSyncTime(new Date());
      } else {
        const apiMessage = response.message || 'Failed to fetch profile';
        setError(apiMessage);
        setSyncState('error');
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      setError(apiMessage);
      console.error('Error fetching profile:', error);
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  React.useEffect(() => {
    fetchProfileData();
  }, []);

  React.useEffect(() => {
    setProfileImageUrl(user?.profile_image_url || '');
  }, [user]);

  const handlePickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access media library is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'profile.jpg',
          type: asset.type || 'image/jpeg',
        };
        const updateData = {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          role_id: user?.role_id,
          address: user?.address,
          city_id: user?.city_id,
          state_id: user?.state_id,
          country_id: user?.country_id,
          postal_code: user?.postal_code,
          department_id: user?.department_id,
          profile_image: file,
        };
        // @ts-ignore
        const response = await updateUser(user?.user_id || user?.id, updateData);
        if (response.status === 'true') {
          await refreshProfile();
        } else {
          alert(response.message || 'Failed to update profile image');
        }
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      setError(apiMessage);
      console.error('Profile image upload error:', error, error.response?.data);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdated = (response: any) => {
    if (response.status === 'true') {
      refreshProfile();
      Alert.alert('Success', response.message || 'Profile updated successfully');
    } else {
      Alert.alert('Error', response.message || 'Failed to update profile');
    }
  };

  // if (!hasPermission('profile.view')) {
  //   return (
  //     <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
  //       <Text style={{ color: theme.text, fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold }}>
  //         You do not have permission to view the profile.
  //       </Text>
  //     </SafeAreaView>
  //   );
  // }

  if (loading && !user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }] }>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          </View>
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime || new Date())} />
        </View>
        <View style={styles.loadingContainer} >
          <ActivityIndicator size="large" color={COLORS.primary.light} />
          <Text style={{ color: theme.text, marginTop: SPACING.md }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }] }>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          </View>
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime || new Date())} />
        </View>
        <View style={styles.loadingContainer} >
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary.light }]} onPress={fetchProfileData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }] }>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>
        <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime || new Date())} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary.light]}
            tintColor={COLORS.primary.light}
          />
        }>
        <View style={styles.profileHeader}>
          {/* Profile image with overlay edit icon */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm }}>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity onPress={() => setImageModalVisible(true)} activeOpacity={0.8}>
                <Image
                  source={{ uri: profileImageUrl || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' }}
                  style={[styles.profileImage, { width: 100, height: 100, borderRadius: 50 }]}
                />
              </TouchableOpacity>
              {/* Overlay edit icon */}
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 70,
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.primary.light,
                  elevation: 2,
                }}
                activeOpacity={0.7}
              >
                <Icon name="edit-2" size={18} color={COLORS.primary.light} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Centered profile info */}
          <View style={{ marginBottom: SPACING.md, maxWidth: '90%', alignSelf: 'center', paddingHorizontal: 8 }}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name}</Text>
            <View style={styles.roleContainer}>
              <Text style={[styles.profileRole, { color: theme.secondaryText }]}>{user?.role}</Text>
              <StatusBadge 
                label={user?.status || ''}
                type={user?.status?.toLowerCase() === 'active' ? 'success' : 'warning'}
                size="sm"
                style={styles.activeStatus}
              />
            </View>
            <View style={[styles.organizationContainer, { flexDirection: 'row', flexWrap: 'wrap'}]}> 
              {/* <Building size={14} color={theme.secondaryText} /> */}
              <Text style={[styles.organizationText, { color: theme.secondaryText }]}>{user?.organization_name}</Text>
            </View>
            <View style={[styles.locationContainer, { flexDirection: 'row', flexWrap: 'wrap'}]}> 
              <MapPin size={14} color={theme.secondaryText} />
              <Text style={[styles.locationText, { color: theme.secondaryText }]}>{`${user?.city}, ${user?.state}, ${user?.country}`}</Text>
            </View>
          </View>
        </View>

        <Card style={{ ...styles.card, backgroundColor: theme.card }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Mail size={20} color={theme.secondaryText} />
            <Text style={[styles.contactText, { color: theme.text }]}>{user?.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={20} color={theme.secondaryText} />
            <Text style={[styles.contactText, { color: theme.text }]}>{user?.phone}</Text>
          </View>
        </Card>

        {/* Quick Notes Card */}
        <TouchableOpacity 
          style={[styles.quickNotesCard, { backgroundColor: theme.card, borderColor: COLORS.primary.light + '60' }]} 
          onPress={() => router.push('/notesScreen')}
        >
          <View style={styles.quickNotesContent}>
            <View style={[styles.quickNotesIconContainer, { backgroundColor: COLORS.primary.light + '20' }]}>
              <FileText size={24} color={COLORS.primary.light} />
            </View>
            <View style={styles.quickNotesTextContainer}>
              <Text style={[styles.quickNotesTitle, { color: theme.text }]}>Quick Notes</Text>
              <Text style={[styles.quickNotesDescription, { color: theme.secondaryText }]}>Access your notes and create
                new ones</Text>
            </View>
            <ChevronRight size={24} color={theme.secondaryText} />
          </View>
        </TouchableOpacity>

        {/* FAQ Card */}
        <TouchableOpacity 
          style={[styles.quickNotesCard, { backgroundColor: theme.card, borderColor: COLORS.primary.light + '60' }]} 
          onPress={() => router.push('/faqScreen')}
        >
          <View style={styles.quickNotesContent}>
            <View style={[styles.quickNotesIconContainer, { backgroundColor: COLORS.primary.light + '20' }]}>
              <HelpCircle size={24} color={COLORS.primary.light} />
            </View>
            <View style={styles.quickNotesTextContainer}>
              <Text style={[styles.quickNotesTitle, { color: theme.text }]}>FAQ</Text>
              <Text style={[styles.quickNotesDescription, { color: theme.secondaryText }]}>Frequently asked questions</Text>
            </View>
            <ChevronRight size={24} color={theme.secondaryText} />
          </View>
        </TouchableOpacity>

        <Card style={{ ...styles.card, backgroundColor: theme.card }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Moon size={20} color={theme.secondaryText} />
              <Text style={[styles.settingName, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={themeType === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: COLORS.primary.light }}
              thumbColor={theme.card}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Bell size={20} color={theme.secondaryText} />
              <Text style={[styles.settingName, { color: theme.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={() => setNotifications(!notifications)}
              trackColor={{ false: theme.border, true: COLORS.primary.light }}
              thumbColor={theme.card}
            />
          </View>
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
        </TouchableOpacity>
        <ProfileEditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          user={user}
          onProfileUpdated={handleProfileUpdated}
        />
        {/* Modal for enlarged profile image */}
        <Modal
          visible={imageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={{ uri: profileImageUrl || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' }}
              style={{ width: width * 0.9, height: height * 0.6, marginBottom: 24 }}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={() => setImageModalVisible(false)} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 24 }}>
              <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.neutral[900],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: SPACING.lg,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.neutral[900],
    marginBottom: SPACING.xs,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  profileRole: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.neutral[600],
    marginRight: SPACING.sm,
  },
  activeStatus: {
    marginLeft: SPACING.xs,
  },
  organizationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  organizationText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.neutral[600],
    marginLeft: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.neutral[600],
    marginLeft: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.error.light + '20',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  quickNotesCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary.light + '60',
    borderRadius: BORDER_RADIUS.md,
  },
  quickNotesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickNotesIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickNotesTextContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  quickNotesTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  quickNotesDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
}); 