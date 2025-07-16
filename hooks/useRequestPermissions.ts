import { useEffect } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Alert, Linking } from 'react-native';

function showSettingsAlert(permission: string) {
  Alert.alert(
    'Permission required',
    `${permission} permission is needed for this app. Please enable it in app settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
}

export default function useRequestPermissions() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    (async () => {
      // Location
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        showSettingsAlert('Location');
      }

      // Camera
      if (!cameraPermission?.granted) {
        const { status } = await requestCameraPermission();
        if (status !== 'granted') {
          showSettingsAlert('Camera');
        }
      }

      // Microphone
      if (!micPermission?.granted) {
        const { status } = await requestMicPermission();
        if (status !== 'granted') {
          showSettingsAlert('Microphone');
        }
      }

      // Media Library / Photos
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== 'granted') {
        showSettingsAlert('Media library');
      }
    })();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
} 