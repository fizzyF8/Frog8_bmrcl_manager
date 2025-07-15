import { useEffect } from 'react';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export default function useRequestPermissions() {
  useEffect(() => {
    (async () => {
      // Location
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed for this app.');
      }

      // Camera
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed for this app.');
      }

      // Microphone
      const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();
      if (micStatus !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is needed for this app.');
      }

      // Media Library / Photos
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert('Permission required', 'Media library permission is needed for this app.');
      }
    })();
  }, []);
} 