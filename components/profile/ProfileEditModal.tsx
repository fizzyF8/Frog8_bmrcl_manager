import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateUser } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  onProfileUpdated: (response: any) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ visible, onClose, user, onProfileUpdated }) => {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [countryId, setCountryId] = useState(user?.country_id ? String(user.country_id) : '');
  const [stateId, setStateId] = useState(user?.state_id ? String(user.state_id) : '');
  const [cityId, setCityId] = useState(user?.city_id ? String(user.city_id) : '');
  const [profileImage, setProfileImage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [stateError, setStateError] = useState('');
  const [cityError, setCityError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(user?.name || '');
      setPhone(user?.phone || '');
      setAddress(user?.address || '');
      setCountryId(user?.country_id ? String(user.country_id) : '');
      setStateId(user?.state_id ? String(user.state_id) : '');
      setCityId(user?.city_id ? String(user.city_id) : '');
      setProfileImage(null);
      fetchCountries();
    }
  }, [user, visible]);

  useEffect(() => {
    if (countryId) {
      setStateId('');
      setCityId('');
      setStates([]);
      setCities([]);
      fetchStates(countryId);
    } else {
      setStates([]);
      setStateId('');
      setCities([]);
      setCityId('');
    }
  }, [countryId]);

  useEffect(() => {
    if (stateId) {
      setCityId('');
      setCities([]);
      fetchCities(stateId);
    } else {
      setCities([]);
      setCityId('');
    }
  }, [stateId]);

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const token = await getToken();
      const res = await fetch('https://demo.ctrmv.com/veriphy/public/api/v1/setting/country/list', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status === 'true' && Array.isArray(data.user)) setCountries(data.user);
    } catch {}
    setLoadingCountries(false);
  };

  const fetchStates = async (countryId: string) => {
    setLoadingStates(true);
    try {
      const token = await getToken();
      const res = await fetch('https://demo.ctrmv.com/veriphy/public/api/v1/setting/state/findStateBasedOnCountry', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country_id: Number(countryId) }),
      });
      const data = await res.json();
      if (data.status === 'true' && Array.isArray(data.user)) setStates(data.user);
    } catch {}
    setLoadingStates(false);
  };

  const fetchCities = async (stateId: string) => {
    setLoadingCities(true);
    try {
      const token = await getToken();
      const res = await fetch('https://demo.ctrmv.com/veriphy/public/api/v1/setting/city/findCityBasedOnState', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state_id: Number(stateId) }),
      });
      const data = await res.json();
      if (data.status === 'true' && Array.isArray(data.user)) setCities(data.user);
    } catch {}
    setLoadingCities(false);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfileImage({
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Name is required');
      valid = false;
    } else {
      setNameError('');
    }
    if (!phone.trim()) {
      setPhoneError('Phone is required');
      valid = false;
    } else {
      setPhoneError('');
    }
    if (!address.trim()) {
      setAddressError('Address is required');
      valid = false;
    } else {
      setAddressError('');
    }
    if (!stateId) {
      setStateError('State is required');
      valid = false;
    } else {
      setStateError('');
    }
    if (!cityId) {
      setCityError('City is required');
      valid = false;
    } else {
      setCityError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const updateData: any = {
        name,
        email: user?.email,
        phone,
        role_id: user?.role_id,
        address,
        city_id: cityId,
        state_id: stateId,
        country_id: countryId,
        postal_code: user?.postal_code,
        department_id: user?.department_id,
      };
      // Remove empty/null/undefined
      Object.keys(updateData).forEach(
        (key) => (updateData[key] == null || updateData[key] === '') && delete updateData[key]
      );
      const formData = new FormData();
      Object.entries(updateData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      if (
        profileImage &&
        typeof profileImage === 'object' &&
        profileImage.uri &&
        profileImage.name &&
        profileImage.type
      ) {
        // @ts-ignore: React Native FormData accepts this object for file uploads
        formData.append('profile_image', {
          uri: profileImage.uri,
          type: profileImage.type === 'image' ? 'image/jpeg' : profileImage.type,
          name: profileImage.name,
        });
      }
      console.log('[ProfileEditModal] updateData FormData:', formData);
      const response = await updateUser(user?.user_id || user?.id, formData);
      console.log('[ProfileEditModal] API response:', response);
      onProfileUpdated(response);
      if (response.status === 'true') onClose();
    } catch (error: any) {
      console.error('[ProfileEditModal] API error:', error, error?.response?.data);
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.neutral[700]} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formContent}>
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                ) : (
                  <Image source={{ uri: user?.profile_image_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' }} style={styles.profileImage} />
                )}
                <View style={styles.cameraIconOverlay}>
                  <Camera size={20} color={COLORS.primary.light} />
                </View>
              </TouchableOpacity>
              <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" style={styles.input} error={nameError} editable />
              <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} error={phoneError} editable />
              <Input label="Address" value={address} onChangeText={setAddress} style={styles.input} error={addressError} editable />
              <View style={styles.pickerGroup}>
                <Text style={styles.pickerLabel}>Country</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={countryId}
                    onValueChange={(itemValue) => setCountryId(itemValue)}
                    enabled={!loadingCountries}
                    style={{ width: '100%' }}
                  >
                    <Picker.Item label="Select Country" value="" />
                    {countries.map((country) => (
                      <Picker.Item key={country.id} label={country.name} value={String(country.id)} />
                    ))}
                  </Picker>
                  {countryError ? <Text style={styles.errorText}>{countryError}</Text> : null}
                </View>
              </View>
              <View style={styles.pickerGroup}>
                <Text style={styles.pickerLabel}>State</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={stateId}
                    onValueChange={(itemValue) => setStateId(itemValue)}
                    enabled={!loadingStates && !!countryId}
                    style={{ width: '100%' }}
                  >
                    <Picker.Item label="Select State" value="" />
                    {states.map((state) => (
                      <Picker.Item key={state.id} label={state.name} value={String(state.id)} />
                    ))}
                  </Picker>
                  {stateError ? <Text style={styles.errorText}>{stateError}</Text> : null}
                </View>
              </View>
              <View style={styles.pickerGroup}>
                <Text style={styles.pickerLabel}>City</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={cityId}
                    onValueChange={(itemValue) => setCityId(itemValue)}
                    enabled={!loadingCities && !!stateId}
                    style={{ width: '100%' }}
                  >
                    <Picker.Item label="Select City" value="" />
                    {cities.map((city) => (
                      <Picker.Item key={city.id} label={city.name} value={String(city.id)} />
                    ))}
                  </Picker>
                  {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
                </View>
              </View>
              <Button title={isSubmitting ? 'Saving...' : 'Save Changes'} onPress={handleSubmit} loading={isSubmitting} style={styles.saveButton} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral[900],
  },
  closeButton: {
    padding: SPACING.xs,
  },
  formContent: {
    paddingBottom: SPACING.lg,
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.primary.light,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.primary.light,
  },
  input: {
    marginBottom: SPACING.md,
  },
  pickerGroup: {
    marginBottom: SPACING.md,
  },
  pickerLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    color: COLORS.neutral[700],
  },
  pickerWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutral[100],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  pickerItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.neutral[200],
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary.light,
  },
  pickerItemText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[700],
  },
  pickerItemTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error.light,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
});

export default ProfileEditModal; 