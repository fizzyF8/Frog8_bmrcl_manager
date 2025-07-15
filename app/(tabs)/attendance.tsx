import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ViewStyle, RefreshControl, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { MapPin, Clock, Calendar, ArrowRight, User, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, RefreshCw, Plus } from 'lucide-react-native';
import { AttendanceRecord } from '@/types';
import { attendanceApi, Attendance, ShiftAttendanceResponse, Station, Gate, AssignShiftRequest, AssignShiftResponse, AssignShift } from '@/utils/api';
import { useTheme } from '@/context/theme';
import { useAuth } from '@/context/auth';
import { getTimeElapsedString } from '@/utils/time';
// import { usePermissions } from '@/hooks/usePermissions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { validateLocation, validateTime, validateRequired, ValidationError } from '@/utils/validation';
import { authApi } from '@/utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import AttendanceHistoryList from '@/components/attendance/AttendanceHistoryList';

// Mock data
const today = new Date();
const mockAttendance: AttendanceRecord[] = [
  {
    id: 'A001',
    userId: 'RM001',
    checkInTime: new Date(today.setHours(6, 2, 0, 0)).toISOString(),
    checkOutTime: undefined,
    checkInLocation: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 15.4,
    },
    status: 'PRESENT',
    createdAt: new Date(today.setHours(9, 5, 0, 0)).toISOString(),
    updatedAt: new Date(today.setHours(9, 5, 0, 0)).toISOString(),
  },
];

const mockShift = {
  name: 'Morning Shift',
  startTime: '06:00',
  endTime: '14:00',
};

const mockAttendanceHistory = [
  {
    date: '2025-05-09',
    status: 'PRESENT',
    checkIn: '06:02 AM',
    checkOut: '02:15 PM',
  },
  {
    date: '2025-05-08',
    status: 'LATE',
    checkIn: '06:30 AM',
    checkOut: '02:10 PM',
  },
  {
    date: '2025-05-07',
    status: 'ABSENT',
    checkIn: '-',
    checkOut: '-',
  },
  {
    date: '2025-05-06',
    status: 'PRESENT',
    checkIn: '05:55 AM',
    checkOut: '02:05 PM',
  },
  {
    date: '2025-05-05',
    status: 'PRESENT',
    checkIn: '06:00 AM',
    checkOut: '02:00 PM',
  },
];

// Update the Button variant type
type ButtonVariant = 'primary' | 'outlined' | 'ghost';

// Update interface for the shift information displayed on the screen
interface DisplayShiftInfo {
  id: number;
  user_id: number;
  shift_id: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at?: string; // Optional, add if needed from API
  updated_at?: string; // Optional, add if needed from API
  name: string;
  startTime: string;
  endTime: string;
  stationName?: string; // Add optional station name
  gateName?: string;   // Add optional gate name
  station_id?: number; // Add station_id as optional
  gate_id?: number;     // Add gate_id as optional
}

// Define station coordinates
const STATION_COORDINATES: { [key: number]: { latitude: number; longitude: number } } = {
  // Assuming station IDs 1 and maybe another for Swami Vivekananda Road
  1: { latitude: 13.0084, longitude: 77.6846 }, // Baiyappanahalli
  // Add other station coordinates as needed, e.g., assuming ID 2 for Swami Vivekananda Road
  2: { latitude: 12.9912, longitude: 77.6417 }, // Swami Vivekananda Road (Assuming ID 2)
};

// Define geofence radius in meters
const GEOFENCE_RADIUS_METERS = 100; // Example: 100 meters

// Function to calculate distance between two lat/lon points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
};

// Modify the formatTime function to handle different time string formats without timezone conversion
function formatTime(dateString: string | null): string {
  if (!dateString) return '--:--';
  // If it's an ISO string with 'Z', but backend sends IST as UTC, remove 'Z' and parse as local
  let localString = dateString;
  if (dateString.endsWith('Z')) {
    localString = dateString.replace(/Z$/, '');
  }
  // Try to parse as local time
  const date = new Date(localString);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  // If it's just HH:mm or HH:mm:ss, format as 12-hour time
  const parts = dateString.split(':');
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute.padStart(2, '0')} ${ampm}`;
  }
  return dateString;
}

const MODAL_MAX_HEIGHT = Dimensions.get('window').height * 0.8;

// Move formatDate above AssignedShiftsList
const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Helper to format 24-hour time to 12-hour with AM/PM
function formatReadableTime(time: string) {
  if (!time) return '';
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

// AssignedShiftsList component
const AssignedShiftsList = ({ assignedShifts, userRole, userId, userMap, stations, gates, theme }: {
  assignedShifts: any[];
  userRole: string;
  userId: number;
  userMap: { [id: number]: any };
  stations: any[];
  gates: any[];
  theme: any;
}) => {
  // Filter for PR: only show their own assigned shifts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filteredShifts = userRole === 'Public Relations'
    ? assignedShifts.filter(s => {
        if (s.user_id !== userId) return false;
        if (!s.assigned_date) return false;
        const shiftDate = new Date(s.assigned_date);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate > today;
      })
    : assignedShifts;

  // Sort assigned shifts from latest to oldest by assigned_date
  const sortedShifts = [...filteredShifts].sort((a, b) => {
    const dateA = new Date(a.assigned_date || a.start_date || a.date);
    const dateB = new Date(b.assigned_date || b.start_date || b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Use SHIFT_OPTIONS from parent scope
  const SHIFT_OPTIONS = [
    { id: 1, name: 'Morning', start_time: '06:00:00', end_time: '14:00:00' },
    { id: 3, name: 'General', start_time: '09:00:00', end_time: '18:00:00' },
    { id: 2, name: 'Evening', start_time: '14:00:00', end_time: '23:00:00' },
  ];

  function getStatusLabel(is_completed: number | boolean) {
    if (is_completed === 1 || is_completed === true) return 'COMPLETED';
    return 'ACTIVE';
  }
  function getStatusType(is_completed: number | boolean) {
    if (is_completed === 1 || is_completed === true) return 'success';
    return 'info';
  }

  return (
    <ScrollView>
      {sortedShifts.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No assigned shifts found.</Text>
      ) : (
        sortedShifts.map((shift, index) => {
          const prName = userMap[shift.user_id]?.name || shift.pr_name || shift.user_name || `User #${shift.user_id}`;
          const shiftObj = SHIFT_OPTIONS.find((opt: any) => opt.id === shift.shift_id);
          const shiftName = shiftObj?.name || shift.shift_name || `Shift #${shift.shift_id}`;
          const shiftTime = shiftObj ? `${formatReadableTime(shiftObj.start_time)} to ${formatReadableTime(shiftObj.end_time)}` : '';
          const stationName = stations.find((s: any) => s.id === shift.station_id)?.name || shift.station_name || `Station #${shift.station_id}`;
          const gateName = gates.find((g: any) => g.id === shift.gate_id)?.name || shift.gate_name || `Gate #${shift.gate_id}`;
          return (
            <Card key={shift.id} variant="outlined" style={{ marginBottom: 12, padding: 12, backgroundColor: theme.card }}>
              {/* Top row: Date and Status */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.md }}>{formatDate(shift.assigned_date)}</Text>
                <StatusBadge label={getStatusLabel(shift.is_completed)} type={getStatusType(shift.is_completed)} size="sm" />
              </View>
              {/* Station and Gate */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>
                  Station: <Text style={{ color: theme.text, fontFamily: FONTS.bold }}>{stationName}</Text>
                </Text>
                <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>
                  Gate: <Text style={{ color: theme.text, fontFamily: FONTS.bold }}>{gateName}</Text>
                </Text>
              </View>
              {/* Bottom row: Shift name/timing and PR name */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>
                    Shift - <Text style={{ color: theme.text, fontFamily: FONTS.regular }}>{shiftName}</Text>
                  </Text>
                  <Text
                    style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.sm, flexShrink: 1 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {shiftTime}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>PR</Text>
                  <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.md }}>{prName}</Text>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
};

export default function AttendanceScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  // const { hasPermission } = usePermissions();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [shiftInfo, setShiftInfo] = useState<DisplayShiftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // New state for selfie preview for checkout
  const [showCheckoutSelfiePreview, setShowCheckoutSelfiePreview] = useState(false);
  const [tempCheckoutSelfie, setTempCheckoutSelfie] = useState<string | null>(null);
  const [capturingCheckoutSelfie, setCapturingCheckoutSelfie] = useState(false);

  // New state for self-assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [assigningShift, setAssigningShift] = useState(false);
  const [selectedShift, setSelectedShift] = useState<{
    id: number;
    name: string;
    start_time: string;
    end_time: string;
  }>({
    id: 3, // Default to General shift
    name: 'General',
    start_time: '09:00:00',
    end_time: '18:00:00'
  });

  // Add shift options constant
  const SHIFT_OPTIONS = [
    {
      id: 1,
      name: 'Morning',
      start_time: '06:00:00',
      end_time: '14:00:00'
    },
    {
      id: 3,
      name: 'General',
      start_time: '09:00:00',
      end_time: '18:00:00'
    },
    {
      id: 2,
      name: 'Evening',
      start_time: '14:00:00',
      end_time: '23:00:00'
    }
  ];

  // Add state for dropdown visibility
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [showStationDropdown, setShowStationDropdown] = useState(false);
  const [showGateDropdown, setShowGateDropdown] = useState(false);
  const [showPRDropdown, setShowPRDropdown] = useState(false);
  const [selectedPR, setSelectedPR] = useState<any>(null);

  // Add new state for assigned shifts
  const [assignedShifts, setAssignedShifts] = useState<AssignShift[]>([]);

  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [capturingSelfie, setCapturingSelfie] = useState(false);
  const [showSelfiePreview, setShowSelfiePreview] = useState(false);
  const [tempSelfie, setTempSelfie] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [userMap, setUserMap] = useState<{ [id: number]: any }>({});

  // Add modalSelector state
  const [modalSelector, setModalSelector] = useState<null | 'pr' | 'shift' | 'station' | 'gate' | 'date'>(null);

  // Add role-based logic and tab state
  const isTeamLead = user?.role === 'Team Lead';
  const isPR = user?.role === 'Public Relations';
  const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');

  useEffect(() => {
    authApi.getUsers().then((response) => {
      if (response && response.user) {
        const map = response.user.reduce((acc: any, u: any) => {
          acc[u.id] = u;
          return acc;
        }, {});
        setUserMap(map);
      }
    });
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchStationsAndGates();
  }, []);

  const fetchStationsAndGates = async () => {
    try {
      const [stationsResponse, gatesResponse] = await Promise.all([
        attendanceApi.getStations(),
        attendanceApi.getGates()
      ]);
      setStations(stationsResponse.stations);
      setGates(gatesResponse.gates);
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      Alert.alert('Error', apiMessage);
    }
  };

  const handleSelfAssign = async () => {
    if (!selectedStation || !selectedGate) {
      Alert.alert('Error', 'Please select both station and gate');
      return;
    }
    try {
      setAssigningShift(true);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      if (!user) {
        Alert.alert('Error', 'User not found. Please log in again.');
        setAssigningShift(false);
        return;
      }
      const assignData: AssignShiftRequest = {
        assigned_date: today,
        user_id: user.user_id || user.id,
        shift_id: selectedShift.id,
        station_id: selectedStation.id,
        gate_id: selectedGate.id,
        organization_id: user.organization_id
      };
      const response = await attendanceApi.assignShift(assignData);
      if (response.status === 'true') {
        Alert.alert('Success', response.message || 'Unknown error');
        setShowAssignModal(false);
        fetchAttendance();
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      Alert.alert('Error', apiMessage);
    } finally {
      setAssigningShift(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      setSyncState('syncing');

      console.log('Starting attendance fetch...'); // Debug log

      // Fetch both attendance and assigned shifts
      let attendanceResponse;
      let assignShiftResponse;

      try {
        console.log('Fetching attendance data...'); // Debug log
        attendanceResponse = await attendanceApi.getShiftAttendance();
        console.log('Attendance response:', attendanceResponse); // Debug log
      } catch (attendanceErr: any) {
        console.error('Attendance fetch error details:', {
          message: attendanceErr.message,
          response: attendanceErr.response?.data,
          status: attendanceErr.response?.status,
          headers: attendanceErr.response?.headers
        });
        throw new Error(`Failed to fetch attendance: ${attendanceErr.response?.data?.message || attendanceErr.message}`);
      }

      try {
        console.log('Fetching assigned shifts...'); // Debug log
        assignShiftResponse = await attendanceApi.getAssignedShifts();
        console.log('Assigned shifts response:', assignShiftResponse); // Debug log
      } catch (shiftsErr: any) {
        console.error('Assigned shifts fetch error details:', {
          message: shiftsErr.message,
          response: shiftsErr.response?.data,
          status: shiftsErr.response?.status,
          headers: shiftsErr.response?.headers
        });
        throw new Error(`Failed to fetch assigned shifts: ${shiftsErr.response?.data?.message || shiftsErr.message}`);
      }

      // Handle assigned shifts fetched from /shift_assign/list
      if (assignShiftResponse.status === 'true') {
        setAssignedShifts(assignShiftResponse.assign_shifts);
      }

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      // Find today's attendance record
      const todayAttendance = attendanceResponse.attendance.find((a: Attendance) => a.date === todayStr) || null;
      setAttendance(todayAttendance);

      // Determine today's assigned shift info
      let currentDayShift: DisplayShiftInfo | null = null;

      // Prioritize the shift info from the attendance list endpoint if available for today
      if (attendanceResponse.assign_shift && attendanceResponse.assign_shift.length > 0) {
        const shiftFromAttendance = attendanceResponse.assign_shift.find(shift =>
          shift.user_id === (user?.user_id || user?.id) &&
          new Date(shift.start_date || shift.assigned_date).toISOString().split('T')[0] === todayStr
        );

        if (shiftFromAttendance) {
          const shiftDetails = SHIFT_OPTIONS.find(s => s.id === shiftFromAttendance.shift_id);
          if (shiftDetails) {
            currentDayShift = {
              id: shiftFromAttendance.id,
              user_id: shiftFromAttendance.user_id,
              shift_id: shiftFromAttendance.shift_id,
              start_date: shiftFromAttendance.start_date || shiftFromAttendance.assigned_date, // Use either date field
              end_date: shiftFromAttendance.end_date || null, // Use end_date if available
              is_active: shiftFromAttendance.is_active,
              name: shiftDetails.name,
              startTime: shiftDetails.start_time.slice(0, 5),
              endTime: shiftDetails.end_time.slice(0, 5),
              stationName: shiftFromAttendance.station?.name, // Include station name from nested object
              gateName: shiftFromAttendance.gate?.name,     // Include gate name from nested object
              station_id: shiftFromAttendance.station?.id,
              gate_id: shiftFromAttendance.gate?.id,
            };
          }
        }
      }

      // If no shift found in the attendance list, check the full assigned shifts list
      if (!currentDayShift && assignShiftResponse.assign_shifts.length > 0) {
        const shiftFromAssignedList = assignShiftResponse.assign_shifts.find(shift =>
          shift.user_id === (user?.user_id || user?.id) &&
          new Date(shift.assigned_date).toISOString().split('T')[0] === todayStr
        );

        if (shiftFromAssignedList) {
          const shiftDetails = SHIFT_OPTIONS.find(s => s.id === shiftFromAssignedList.shift_id);

          // Find station and gate names from the state using the IDs
          const station = stations.find(s => s.id === shiftFromAssignedList.station_id);
          const gate = gates.find(g => g.id === shiftFromAssignedList.gate_id);

          if (shiftDetails) {
            currentDayShift = {
              id: shiftFromAssignedList.id,
              user_id: shiftFromAssignedList.user_id,
              shift_id: shiftFromAssignedList.shift_id,
              start_date: shiftFromAssignedList.assigned_date, // Use assigned_date
              end_date: null, // No end date in this response structure
              is_active: shiftFromAssignedList.is_active,
              name: shiftDetails.name,
              startTime: shiftDetails.start_time.slice(0, 5),
              endTime: shiftDetails.end_time.slice(0, 5),
              stationName: station?.name, // Include station name from state
              gateName: gate?.name,     // Include gate name from state
              station_id: station?.id,
              gate_id: gate?.id,
            };
          }
        }
      }

      setShiftInfo(currentDayShift);

      console.log('Debug Info:'); // Add debug log
      console.log('Stations data:', stations); // Log stations data
      console.log('Gates data:', gates);     // Log gates data
      console.log('Current Day Shift object:', currentDayShift);

      // Set attendance history: include all records, and if today's is complete, it will naturally be included.
      // If today's attendance is not complete or doesn't exist, only historical records are shown.
      // The check for including today's attendance in history will implicitly happen in the render logic now.
      
      // Sort attendance history from latest to oldest
      const sortedAttendanceHistory = attendanceResponse.attendance.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // Sort in descending order (latest first)
      });
      
      setAttendanceHistory(sortedAttendanceHistory);

      setSyncState('synced');
      setLastSyncTime(new Date());

    } catch (err: any) {
      console.error('Attendance fetch error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      
      let errorMessage = 'Failed to fetch attendance. ';
      if (err.response?.status === 500) {
        errorMessage += 'Server error occurred. Please try again later or contact support.';
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else {
        errorMessage += err.message || 'Please try again later.';
      }
      
      setError(errorMessage);
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for attendance.');
      throw new Error('Location permission denied');
    }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return location.coords;
  };

  const captureSelfie = async () => {
    try {
      setCapturingSelfie(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false, // Don't get base64
        cameraType: ImagePicker.CameraType.front
      });

      if (!result.canceled && result.assets[0].uri) {
        setTempSelfie(result.assets[0].uri);
        setShowSelfiePreview(true);
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error capturing selfie:', error);
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
      return null;
    } finally {
      setCapturingSelfie(false);
    }
  };

  const handleSelfieConfirm = async () => {
    if (!tempSelfie || !shiftInfo) return;

    try {
      setCheckingIn(true);
      
      // First get location
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      const coords = location.coords;

      // Create form data for file upload
      const formData = new FormData();
      formData.append('user_shift_assignment_id', shiftInfo.id.toString());
      formData.append('check_in_latitude', coords.latitude.toString());
      formData.append('check_in_longitude', coords.longitude.toString());
      formData.append('check_in_force_mark', '1');
      
      // Append the image file
      const imageUri = tempSelfie;
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('check_in_image', {
        uri: imageUri,
        name: filename,
        type: type
      } as any);

      console.log('Check-in Form Data:', formData);

      // Check if station information is available for geofence check
      if (!shiftInfo.stationName || shiftInfo.station_id === undefined) {
        console.warn('Station information missing for geofence check. Proceeding with check-in.');
        await attendanceApi.checkInAttendance(formData as FormData);
        Alert.alert('Success', 'Checked in successfully!');
        setShowSelfiePreview(false);
        setTempSelfie(null);
        fetchAttendance();
        return;
      }

      const stationCoords = STATION_COORDINATES[shiftInfo.station_id];

      if (!stationCoords) {
        console.warn(`Coordinates not defined for station ID ${shiftInfo.station_id}. Proceeding with check-in.`);
        await attendanceApi.checkInAttendance(formData as FormData);
        Alert.alert('Success', 'Checked in successfully!');
        setShowSelfiePreview(false);
        setTempSelfie(null);
        fetchAttendance();
        return;
      }

      const distance = Math.sqrt(
        Math.pow(coords.latitude - stationCoords.latitude, 2) +
        Math.pow(coords.longitude - stationCoords.longitude, 2)
      ) * 111000;

      const distanceInMeters = Math.round(distance);
      const distanceText = distanceInMeters < 1000
        ? `${distanceInMeters} meters`
        : `${(distanceInMeters / 1000).toFixed(1)} km`;

      if (distance > GEOFENCE_RADIUS_METERS) {
        Alert.alert(
          'Outside Station Geofence',
          `You are approximately ${distanceText} away from ${shiftInfo.stationName}. Do you want to force mark attendance?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Force Mark',
              onPress: async () => {
                try {
                  console.log('Force Mark Check-in Form Data:', formData);
                  await attendanceApi.checkInAttendance(formData as FormData);
                  Alert.alert('Success', 'Shift force marked and checked in!');
                  setShowSelfiePreview(false);
                  setTempSelfie(null);
                  fetchAttendance();
                } catch (forceMarkErr: any) {
                  console.error('Force Mark Error:', forceMarkErr);
                  console.error('Error Response:', forceMarkErr.response?.data);
                  Alert.alert('Force Mark Failed', forceMarkErr.message || 'Unable to force mark check in.');
                }
              }
            }
          ]
        );
      } else {
        await attendanceApi.checkInAttendance(formData as FormData);
        Alert.alert('Success', 'Checked in successfully!');
        setShowSelfiePreview(false);
        setTempSelfie(null);
        fetchAttendance();
      }
    } catch (err: any) {
      console.error('Check In Error:', err);
      console.error('Error Response:', err.response?.data);
      Alert.alert('Check In Failed', err.message || 'Unable to check in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      
      // Get location with lower accuracy for faster response
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      const coords = location.coords;

      // Validate location
      if (!validateLocation(coords.latitude, coords.longitude)) {
        Alert.alert('Invalid Location', 'Unable to get your current location. Please try again.');
        return;
      }

      // Ensure shiftInfo is available
      if (!shiftInfo || shiftInfo.id === undefined) {
        Alert.alert('Error', 'No active shift information found. Please refresh or contact support.');
        return;
      }

      // Capture selfie
      const selfieBase64 = await captureSelfie();
      if (!selfieBase64) {
        Alert.alert('Selfie Required', 'A selfie is required for check-in. Please try again.');
        return;
      }

      // The rest of the check-in logic will be handled after selfie confirmation
    } catch (err: any) {
      Alert.alert('Check In Failed', err.message || 'Unable to check in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const captureCheckoutSelfie = async () => {
    try {
      setCapturingCheckoutSelfie(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false, // Don't get base64
        cameraType: ImagePicker.CameraType.front
      });

      if (!result.canceled && result.assets[0].uri) {
        setTempCheckoutSelfie(result.assets[0].uri);
        setShowCheckoutSelfiePreview(true);
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error capturing checkout selfie:', error);
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
      return null;
    } finally {
      setCapturingCheckoutSelfie(false);
    }
  };

  const handleCheckoutSelfieConfirm = async () => {
    if (!tempCheckoutSelfie || !attendance || !shiftInfo) return;

    try {
      setCheckingOut(true);
      
      // First get location
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      const coords = location.coords;

      // Create form data for file upload
      const formData = new FormData();
      formData.append('attendance_id', attendance.id.toString());
      formData.append('user_shift_assignment_id', shiftInfo.id.toString());
      formData.append('check_out_latitude', coords.latitude.toString());
      formData.append('check_out_longitude', coords.longitude.toString());
      formData.append('check_out_force_mark', '1');
      
      // Append the image file
      const imageUri = tempCheckoutSelfie;
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('check_out_image', {
        uri: imageUri,
        name: filename,
        type: type
      } as any);

      console.log('Check-out Form Data:', formData);

      // Check if station information is available for geofence check
      if (!shiftInfo.stationName || shiftInfo.station_id === undefined) {
        console.warn('Station information missing for geofence check. Proceeding with check-out.');
        await attendanceApi.checkOutAttendance(formData as FormData);
        Alert.alert('Success', 'Checked out successfully!');
        setShowCheckoutSelfiePreview(false);
        setTempCheckoutSelfie(null);
        fetchAttendance();
        return;
      }

      const stationCoords = STATION_COORDINATES[shiftInfo.station_id];

      if (!stationCoords) {
        console.warn(`Coordinates not defined for station ID ${shiftInfo.station_id}. Proceeding with check-out.`);
        await attendanceApi.checkOutAttendance(formData as FormData);
        Alert.alert('Success', 'Checked out successfully!');
        setShowCheckoutSelfiePreview(false);
        setTempCheckoutSelfie(null);
        fetchAttendance();
        return;
      }

      const distance = Math.sqrt(
        Math.pow(coords.latitude - stationCoords.latitude, 2) +
        Math.pow(coords.longitude - stationCoords.longitude, 2)
      ) * 111000;

      const distanceInMeters = Math.round(distance);
      const distanceText = distanceInMeters < 1000
        ? `${distanceInMeters} meters`
        : `${(distanceInMeters / 1000).toFixed(1)} km`;

      if (distance > GEOFENCE_RADIUS_METERS) {
        Alert.alert(
          'Outside Station Geofence',
          `You are approximately ${distanceText} away from ${shiftInfo.stationName}. Do you want to force mark check out?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Force Mark',
              onPress: async () => {
                try {
                  console.log('Force Mark Check-out Form Data:', formData);
                  await attendanceApi.checkOutAttendance(formData as FormData);
                  Alert.alert('Success', 'Shift force marked and checked out!');
                  setShowCheckoutSelfiePreview(false);
                  setTempCheckoutSelfie(null);
                  fetchAttendance();
                } catch (forceMarkErr: any) {
                  console.error('Force Mark Error:', forceMarkErr);
                  console.error('Error Response:', forceMarkErr.response?.data);
                  Alert.alert('Force Mark Failed', forceMarkErr.message || 'Unable to force mark check out.');
                }
              }
            }
          ]
        );
      } else {
        await attendanceApi.checkOutAttendance(formData as FormData);
        Alert.alert('Success', 'Checked out successfully!');
        setShowCheckoutSelfiePreview(false);
        setTempCheckoutSelfie(null);
        fetchAttendance();
      }
    } catch (err: any) {
      console.error('Check Out Error:', err);
      console.error('Error Response:', err.response?.data);
      Alert.alert('Check Out Failed', err.message || 'Unable to check out.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleResetState = () => {
    setAttendance(null);
    setAttendanceHistory([]);
    // Set dummy shift info after resetting
    setShiftInfo({
      id: 999, // Dummy ID
      user_id: user?.id || 0,
      shift_id: 99, // Dummy shift ID
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add dummy shift details if needed for display
      name: 'Dummy Shift',
      startTime: '08:00',
      endTime: '17:00',
    });
    Alert.alert('State Reset', 'Attendance state and dummy shift have been reset locally.');
  };

  const handleDummyCheckIn = async () => {
    try {
      setCheckingIn(true);
      const coords = await getLocation();

      // Create dummy attendance record with captured data
      const dummyAttendance: Attendance = {
        id: 0, // Use a dummy number ID
        user_id: user?.id || 0, // Ensure user_id is a number
        user_shift_assignment_id: shiftInfo?.id || 0, // Ensure shift assignment ID is a number
        date: new Date().toISOString().slice(0, 10),
        status: 'PRESENT', // Assuming dummy check-in is always present
        check_in_time: new Date().toISOString(),
        check_out_time: null,
        check_in_latitude: coords.latitude.toString(),
        check_in_longitude: coords.longitude.toString(),
        check_out_latitude: null,
        check_out_longitude: null,
        remarks: 'Dummy check-in for testing',
      };

      // Update local state to show dummy check-in
      setAttendance(dummyAttendance);
      Alert.alert('Dummy Check In Successful', 'Attendance state updated locally.');

      // Note: This does NOT call the API

    } catch (err: any) {
      Alert.alert('Test Check In Failed', err.message || 'Unable to test check in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Late':
        return 'warning';
      case 'Absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const cardStyle = (baseStyle: ViewStyle): ViewStyle => ({
    ...baseStyle,
    backgroundColor: theme.card,
  });

  // Add function to check if user has assigned shifts
  const hasAssignedShifts = () => {
    return assignedShifts.some(shift =>
      shift.user_id === (user?.user_id || user?.id) &&
      new Date(shift.assigned_date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    );
  };

  // Add handler for assigning shift
  const handleAssignShift = async () => {
    if (!selectedPR || !selectedShift || !selectedStation || !selectedGate || !selectedDate) {
      Alert.alert('Error', 'Please select all fields.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }
    try {
      setAssigningShift(true);
      const assignData: AssignShiftRequest = {
        assigned_date: new Date(selectedDate).toISOString().split('T')[0],
        user_id: selectedPR.id,
        shift_id: selectedShift.id,
        station_id: selectedStation.id,
        gate_id: selectedGate.id,
        organization_id: user.organization_id
      };
      const response = await attendanceApi.assignShift(assignData);
      if (response.status === 'true') {
        Alert.alert('Success', response.message || 'Shift assigned successfully!');
        setShowAssignModal(false);
        fetchAttendance();
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      Alert.alert('Error', apiMessage);
    } finally {
      setAssigningShift(false);
    }
  };

  const renderAssignModal = () => (
    <Modal
      visible={showAssignModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAssignModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background, maxHeight: MODAL_MAX_HEIGHT, padding: 0 }]}> 
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 12 }]}>Assign Shift</Text>
            {/* Single-column, compact dropdowns */}
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 4 }]}>Select PR</Text>
            <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: theme.card, borderColor: COLORS.primary.light, paddingVertical: 10 }]}
                onPress={() => setModalSelector('pr')}
              >
                <Text style={[styles.dropdownButtonText, { color: theme.text }]}>{selectedPR ? selectedPR.name : 'Choose PR'}</Text>
              </TouchableOpacity>
              {/* PR Dropdown Modal */}
              <Modal visible={modalSelector === 'pr'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                    <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select PR</Text>
                    <ScrollView>
                      {Object.values(userMap).filter(u => u.role === 'Public Relations').map(u => (
                        <TouchableOpacity
                          key={u.id}
                          style={{ padding: 16, backgroundColor: selectedPR?.id === u.id ? COLORS.primary.light : theme.background, borderRadius: 8, marginBottom: 8 }}
                          onPress={() => { setSelectedPR(u); setModalSelector(null); }}
                        >
                          <Text style={{ color: theme.text, fontFamily: selectedPR?.id === u.id ? FONTS.bold : FONTS.regular }}>{u.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
                </View>
              </View>
              </Modal>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 4 }]}>Select Shift</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: theme.card, borderColor: COLORS.primary.light, paddingVertical: 10 }]}
                onPress={() => setModalSelector('shift')}
              >
                <Text style={[styles.dropdownButtonText, { color: theme.text }]}>{selectedShift ? selectedShift.name : 'Choose Shift'}</Text>
            </TouchableOpacity>
              {/* Shift Dropdown Modal */}
              <Modal visible={modalSelector === 'shift'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                    <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select Shift</Text>
                    <ScrollView>
                      {SHIFT_OPTIONS.map(shift => (
                  <TouchableOpacity
                    key={shift.id}
                          style={{ padding: 16, backgroundColor: selectedShift?.id === shift.id ? COLORS.primary.light : theme.background, borderRadius: 8, marginBottom: 8 }}
                          onPress={() => { setSelectedShift(shift); setModalSelector(null); }}
                        >
                          <Text style={{ color: theme.text, fontFamily: selectedShift?.id === shift.id ? FONTS.bold : FONTS.regular }}>{shift.name}</Text>
                  </TouchableOpacity>
                ))}
                    </ScrollView>
                    <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
              </View>
          </View>
              </Modal>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 4 }]}>Select Station</Text>
            <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: theme.card, borderColor: COLORS.primary.light, paddingVertical: 10 }]}
                onPress={() => setModalSelector('station')}
              >
                <Text style={[styles.dropdownButtonText, { color: theme.text }]}>{selectedStation ? selectedStation.name : 'Choose Station'}</Text>
            </TouchableOpacity>
              {/* Station Dropdown Modal */}
              <Modal visible={modalSelector === 'station'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                    <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select Station</Text>
                    <ScrollView>
                      {stations.map(station => (
                  <TouchableOpacity
                    key={station.id}
                          style={{ padding: 16, backgroundColor: selectedStation?.id === station.id ? COLORS.primary.light : theme.background, borderRadius: 8, marginBottom: 8 }}
                          onPress={() => { setSelectedStation(station); setModalSelector(null); setSelectedGate(null); }}
                        >
                          <Text style={{ color: theme.text, fontFamily: selectedStation?.id === station.id ? FONTS.bold : FONTS.regular }}>{station.name}</Text>
                  </TouchableOpacity>
                ))}
                    </ScrollView>
                    <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
              </View>
          </View>
              </Modal>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 4 }]}>Select Gate</Text>
            <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: theme.card, borderColor: COLORS.primary.light, paddingVertical: 10 }]}
                onPress={() => selectedStation && setModalSelector('gate')}
              disabled={!selectedStation}
            >
                <Text style={[styles.dropdownButtonText, { color: selectedStation ? theme.text : theme.secondaryText }]}>{selectedGate ? selectedGate.name : 'Choose Gate'}</Text>
            </TouchableOpacity>
              {/* Gate Dropdown Modal */}
              <Modal visible={modalSelector === 'gate'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                    <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select Gate</Text>
                    <ScrollView>
                      {gates.filter(gate => gate.station_id === selectedStation?.id).map(gate => (
                    <TouchableOpacity
                      key={gate.id}
                          style={{ padding: 16, backgroundColor: selectedGate?.id === gate.id ? COLORS.primary.light : theme.background, borderRadius: 8, marginBottom: 8 }}
                          onPress={() => { setSelectedGate(gate); setModalSelector(null); }}
                        >
                          <Text style={{ color: theme.text, fontFamily: selectedGate?.id === gate.id ? FONTS.bold : FONTS.regular }}>{gate.name}</Text>
                    </TouchableOpacity>
                  ))}
                    </ScrollView>
                    <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
              </View>
          </View>
              </Modal>
              </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 4 }]}>Assign Date</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: theme.card, borderColor: COLORS.primary.light, paddingVertical: 10 }]}
                onPress={() => setModalSelector('date')}
              >
                <Text style={[styles.dropdownButtonText, { color: theme.text }]}>{selectedDate ? formatDate(selectedDate) : 'Select Date'}</Text>
              </TouchableOpacity>
              {/* Date Picker Modal */}
              <Modal visible={modalSelector === 'date'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', padding: 16 }}>
                    <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select Date</Text>
                    <DateTimePicker
                      value={selectedDate ? new Date(selectedDate) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        if (event.type === 'dismissed' || !date) {
                          setModalSelector(null);
                          return;
                        }
                        setSelectedDate(date.toISOString());
                        setModalSelector(null);
                      }}
                    />
                    <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
              </View>
              </View>
              </Modal>
              </View>
            {/* Summary Card - compact and visually distinct */}
            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: COLORS.primary.light, marginTop: 8, padding: 8 }]}> 
              <Text style={[styles.summaryTitle, { color: theme.text, marginBottom: 4 }]}>Summary</Text>
              <Text style={[styles.summaryItem, { color: theme.text }]}>PR: {selectedPR ? selectedPR.name : '-'}</Text>
              <Text style={[styles.summaryItem, { color: theme.text }]}>Shift: {selectedShift ? selectedShift.name : '-'}</Text>
              <Text style={[styles.summaryItem, { color: theme.text }]}>Station: {selectedStation ? selectedStation.name : '-'}</Text>
              <Text style={[styles.summaryItem, { color: theme.text }]}>Gate: {selectedGate ? selectedGate.name : '-'}</Text>
              <Text style={[styles.summaryItem, { color: theme.text }]}>Date: {selectedDate ? formatDate(selectedDate) : '-'}</Text>
            </View>
            {/* Action Buttons - full width, stacked */}
            <View style={{ marginTop: 12, gap: 8 }}>
            <Button
                title="Assign Shift"
                color="primary"
                style={{ ...styles.modalButton, width: '100%', marginHorizontal: 0 }}
                onPress={handleAssignShift}
                disabled={!(selectedPR && selectedShift && selectedStation && selectedGate && selectedDate) || assigningShift}
              />
              <Button title="Cancel" variant="outlined" onPress={() => setShowAssignModal(false)} style={{ ...styles.modalButton, width: '100%', marginHorizontal: 0 }} />
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSelfiePreview = () => (
    <Modal
      visible={showSelfiePreview}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowSelfiePreview(false);
        setTempSelfie(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Selfie Preview</Text>
          
          {tempSelfie && (
            <View style={[styles.selfiePreviewContainer, { backgroundColor: theme.background }]}>
              <Image
                source={{ uri: tempSelfie }}
                style={styles.selfiePreview}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.previewButtonsRow}>
            <Button
              title="Retake"
              onPress={async () => {
                setShowSelfiePreview(false);
                setTempSelfie(null);
                await captureSelfie();
              }}
              variant="outlined"
              style={styles.previewButton}
            />
            <Button
              title="Confirm & Check In"
              onPress={handleSelfieConfirm}
              disabled={checkingIn}
              style={styles.previewButton}
            />
          </View>

          <Button
            title="Cancel"
            onPress={() => {
              setShowSelfiePreview(false);
              setTempSelfie(null);
            }}
            variant="outlined"
            color="error"
            fullWidth
            style={styles.cancelButton}
          />

        </View>
      </View>
    </Modal>
  );

  const renderCheckoutSelfiePreview = () => (
    <Modal
      visible={showCheckoutSelfiePreview}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowCheckoutSelfiePreview(false);
        setTempCheckoutSelfie(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Checkout Selfie Preview</Text>
          
          {tempCheckoutSelfie && (
            <View style={[styles.selfiePreviewContainer, { backgroundColor: theme.background }]}>
              <Image
                source={{ uri: tempCheckoutSelfie }}
                style={styles.selfiePreview}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.previewButtonsRow}>
            <Button
              title="Retake"
              onPress={async () => {
                setShowCheckoutSelfiePreview(false);
                setTempCheckoutSelfie(null);
                await captureCheckoutSelfie();
              }}
              variant="outlined"
              style={styles.previewButton}
            />
            <Button
              title="Confirm & Check Out"
              onPress={handleCheckoutSelfieConfirm}
              disabled={checkingOut}
              style={styles.previewButton}
            />
          </View>

          <Button
            title="Cancel"
            onPress={() => {
              setShowCheckoutSelfiePreview(false);
              setTempCheckoutSelfie(null);
            }}
            variant="outlined"
            color="error"
            fullWidth
            style={styles.cancelButton}
          />

        </View>
      </View>
    </Modal>
  );

  const renderNoAttendanceError = () => (
    <Card variant="elevated" style={{ ...cardStyle(styles.emptyStateCard), marginBottom: SPACING.md, padding: SPACING.md }}>
      <View style={styles.emptyStateContainer}>
        <AlertCircle size={48} color={theme.secondaryText} />
        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Shift Assigned</Text>
        <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>You don't have any shifts assigned for today. You can:</Text>
        <View style={styles.emptyStateList}>
          <Text style={[styles.emptyStateListItem, { color: theme.secondaryText }]}>• Self-assign a shift to start working</Text>
          <Text style={[styles.emptyStateListItem, { color: theme.secondaryText }]}>• Contact your supervisor for assistance</Text>
          <Text style={[styles.emptyStateListItem, { color: theme.secondaryText }]}>• Refresh to check for new assignments</Text>
        </View>
        <View style={styles.emptyStateButtons}>
          <Button
            title="Assign Shift"
            color="primary"
            onPress={() => setShowAssignModal(true)}
            style={styles.emptyStateButton}
            leftIcon={<Calendar size={20} color={COLORS.white} />}
          />
          <Button
            title="Refresh"
            color="secondary"
            onPress={fetchAttendance}
            style={styles.emptyStateButton}
            leftIcon={<RefreshCw size={20} color={COLORS.white} />}
          />
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Attendance</Text>
            {lastSyncTime && (
              <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
            )}
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.light} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading attendance...</Text>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Attendance</Text>
            {lastSyncTime && (
              <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
            )}
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary.light }]} onPress={fetchAttendance}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Attendance</Text>
          {lastSyncTime && (
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
          )}
        </View>

        {/* Compact Self Assign Card if no shift/attendance - NON-SCROLLING */}
          {!attendance && !shiftInfo && (
          <Card variant="elevated" style={{ ...cardStyle(styles.emptyStateCard), marginHorizontal: SPACING.md, marginTop: SPACING.md, padding: SPACING.md }}>
              <View style={{ alignItems: 'center' }}>
                <AlertCircle size={32} color={theme.secondaryText} style={{ marginBottom: SPACING.sm }} />
                <Text style={[styles.emptyStateTitle, { color: theme.text, fontSize: FONT_SIZES.lg, marginBottom: SPACING.xs }]}>No Shift Assigned</Text>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText, fontSize: FONT_SIZES.sm, marginBottom: SPACING.sm }]}>Please contact your Team Lead for shift assignment.</Text>
              </View>
            </Card>
          )}

        {/* Main attendance card if shift/attendance exists - NON-SCROLLING */}
          {attendance || shiftInfo ? (
          <Card variant="elevated" style={{ ...cardStyle(styles.todayCard), marginHorizontal: SPACING.md, marginTop: SPACING.md }}>
              <View style={styles.dateHeader}>
                <Calendar size={20} color={theme.secondaryText} />
                <Text style={[styles.todayText, { color: theme.text }]}>
                  Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              <View style={styles.shiftInfo}>
                <Clock size={16} color={theme.secondaryText} />
                <Text style={[styles.shiftText, { color: theme.secondaryText }]}>
                  {shiftInfo ? `${shiftInfo.name} (${shiftInfo.startTime} - ${shiftInfo.endTime})` : '--:--'}
                </Text>
              </View>

              {/* Add display for Station and Gate names */}
              {shiftInfo?.stationName && (
                <View style={styles.shiftInfoDetail}>
                  <MapPin size={16} color={theme.secondaryText} />
                  <Text style={[styles.shiftText, { color: theme.secondaryText }]}>
                    Station: {shiftInfo.stationName}
                  </Text>
                </View>
              )}

              {shiftInfo?.gateName && (
                <View style={styles.shiftInfoDetail}>
                  <MapPin size={16} color={theme.secondaryText} />
                  <Text style={[styles.shiftText, { color: theme.secondaryText }]}>
                    Gate: {shiftInfo.gateName}
                  </Text>
                </View>
              )}

              {attendance && (
                <View style={styles.checkInOutContainer}>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.timeLabel, { color: theme.secondaryText }]}>Check In</Text>
                    <Text style={[styles.timeValue, { color: theme.text }]}>
                      {attendance.check_in_time ? formatTime(attendance.check_in_time) : '--:--'}
                    </Text>
                    {attendance.check_in_latitude && attendance.check_in_longitude && (
                      <View style={styles.locationContainer}>
                        <MapPin size={14} color={theme.secondaryText} />
                        <Text style={[styles.locationText, { color: theme.secondaryText }]}>
                          {`${attendance.check_in_latitude}, ${attendance.check_in_longitude}`}
                        </Text>
                      </View>
                    )}
                  </View>

                  <ArrowRight size={20} color={theme.secondaryText} />

                  <View style={styles.timeContainer}>
                    <Text style={[styles.timeLabel, { color: theme.secondaryText }]}>Check Out</Text>
                    <Text style={[styles.timeValue, { color: theme.text }]}>
                      {attendance.check_out_time ? formatTime(attendance.check_out_time) : '--:--'}
                    </Text>
                    {attendance.check_out_latitude && attendance.check_out_longitude && (
                      <View style={styles.locationContainer}>
                        <MapPin size={14} color={theme.secondaryText} />
                        <Text style={[styles.locationText, { color: theme.secondaryText }]}>
                          {`${attendance.check_out_latitude}, ${attendance.check_out_longitude}`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

            {selfieImage && (
            <View style={styles.selfieContainer}>
              <Image source={{ uri: selfieImage }} style={styles.selfieImage} />
                  </View>
                )}

              <View style={styles.actionButtons}>
                {/* Show Check In button if shift is present and not checked in */}
                {shiftInfo && !attendance && (
                  <Button
                    title="Check In"
                    color="primary"
                    fullWidth
                    leftIcon={<Clock size={20} color={COLORS.white} />}
                    onPress={handleCheckIn}
                    disabled={checkingIn}
                  />
                )}

                {/* Show Check Out button if checked in and not checked out */}
                {attendance && !attendance.check_out_time && (
                  <Button
                    title="Check Out"
                    color="secondary"
                    fullWidth
                    leftIcon={<Clock size={20} color={COLORS.white} />}
                    onPress={captureCheckoutSelfie}
                    disabled={checkingOut}
                  />
                )}
              </View>
            </Card>
          ) : null}

        {/* TL: Tabs for Assigned Shifts and Attendance History */}
        {isTeamLead && (
          <View style={{ flexDirection: 'row', marginHorizontal: 12, marginBottom: 12, marginTop: SPACING.lg, borderRadius: 8, backgroundColor: theme.card, borderWidth: 1, borderColor: COLORS.primary.light }}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor: activeTab === 'assigned' ? COLORS.primary.light : theme.card,
              }}
              onPress={() => setActiveTab('assigned')}
            >
              <Text style={{ color: activeTab === 'assigned' ? COLORS.white : theme.text, fontFamily: FONTS.bold }}>Assigned Shifts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor: activeTab === 'history' ? COLORS.primary.light : theme.card,
              }}
              onPress={() => setActiveTab('history')}
            >
              <Text style={{ color: activeTab === 'history' ? COLORS.white : theme.text, fontFamily: FONTS.bold }}>Attendance History</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={[styles.scrollView, { marginTop: 0 }]}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary.light]}
              tintColor={COLORS.primary.light}
            />
          }
        >
          {/* TL: Show tab content */}
          {isTeamLead && activeTab === 'assigned' && (
            <AssignedShiftsList
              assignedShifts={assignedShifts}
              userRole={user.role}
              userId={user.id ?? user.user_id ?? 0}
              userMap={userMap}
              stations={stations}
              gates={gates}
              theme={theme}
            />
          )}
          {isTeamLead && activeTab === 'history' && (
            <AttendanceHistoryList
              attendanceHistory={attendanceHistory}
              assignedShifts={assignedShifts}
              stations={stations}
              gates={gates}
              theme={theme}
            />
          )}
          {/* PR: Show only their assigned shifts and attendance history (no tabs, no assign button) */}
          {isPR && (
            (() => {
              // Compute filtered future shifts for PRs (same logic as AssignedShiftsList)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const prId = user.id ?? user.user_id ?? 0;
              const futureShifts = assignedShifts.filter(s => {
                if (s.user_id !== prId) return false;
                if (!s.assigned_date) return false;
                const shiftDate = new Date(s.assigned_date);
                shiftDate.setHours(0, 0, 0, 0);
                return shiftDate > today;
              });
              return (
                <>
                  {futureShifts.length > 0 && (
                    <>
                      <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginTop: 16, marginBottom: 8 }}>Assigned Shifts</Text>
                      <AssignedShiftsList
                        assignedShifts={assignedShifts}
                        userRole={user.role}
                        userId={prId}
                        userMap={userMap}
                        stations={stations}
                        gates={gates}
                        theme={theme}
                      />
                      <View style={{ height: 24 }} />
                    </>
                  )}
                  <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 8 }}>Attendance History</Text>
                  <AttendanceHistoryList
                    attendanceHistory={attendanceHistory}
                    assignedShifts={assignedShifts}
                    stations={stations}
                    gates={gates}
                    theme={theme}
                  />
                </>
              );
            })()
          )}
        </ScrollView>
        {renderAssignModal()}
        {renderSelfiePreview()}
        {renderCheckoutSelfiePreview()}

        {isTeamLead && activeTab === 'assigned' && (
          <TouchableOpacity
            style={styles.floatingActionButton}
            onPress={() => setShowAssignModal(true)}
          >
            <Plus size={28} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 80, // To avoid FAB overlapping content
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
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
  todayCard: {
    marginBottom: SPACING.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  todayText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.xs,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  shiftText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.xs,
  },
  checkInOutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timeContainer: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  timeValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    marginLeft: 4,
  },
  statusContainer: {
    marginBottom: SPACING.md,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.xs,
  },
  actionButtons: {
    marginTop: SPACING.sm,
  },
  sectionHeader: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
  },
  historyCard: {
    marginBottom: SPACING.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  historyDate: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
  },
  historyTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyTimeItem: {
    flex: 1,
  },
  historyTimeLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  historyTimeValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyStateCard: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyStateContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateList: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  emptyStateListItem: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  emptyStateButtons: {
    width: '100%',
    gap: SPACING.sm,
  },
  emptyStateButton: {
    width: '100%',
  },
  lastRefreshContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  lastRefreshText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  selfieContainer: {
    marginVertical: SPACING.md,
    alignItems: 'center',
  },
  selfieImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  pickerItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  selectedItem: {
    backgroundColor: COLORS.primary.light + '20',
  },
  pickerItemText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  selfAssignButton: {
    marginTop: SPACING.md,
  },
  shiftSelector: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    gap: SPACING.sm,
  },
  shiftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  selectedShift: {
    borderColor: COLORS.primary.light,
    borderWidth: 2,
    backgroundColor: COLORS.primary.light + '10',
  },
  shiftOptionContent: {
    flex: 1,
  },
  shiftName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
  },
  shiftTime: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  selectedShiftSummary: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    marginBottom: 8,
  },
  summaryItem: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryContent: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
  summaryValue: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  dropdownButton: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
  },
  dropdownButtonSubtext: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  dropdownArrow: {
    transform: [{ rotate: '90deg' }],
  },
  dropdownArrowOpen: {
    transform: [{ rotate: '-90deg' }],
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    zIndex: 100,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primary.light + '10',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
  },
  dropdownItemSubtext: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  dropdownButtonDisabled: {
    opacity: 0.5,
  },
  assignedShiftsContainer: {
    marginBottom: SPACING.lg,
  },
  assignedShiftCard: {
    marginBottom: SPACING.sm,
  },
  assignedShiftContent: {
    padding: SPACING.sm,
  },
  assignedShiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  assignedShiftDate: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
  },
  assignedShiftDetails: {
    marginTop: SPACING.xs,
  },
  assignedShiftDetail: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  shiftInfoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs, // Adjust spacing as needed
  },
  historyDetails: {
    marginBottom: SPACING.sm,
  },
  historyDetailText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs / 2,
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.sm,
  },
  attendanceInfo: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
  infoValue: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  checkOutButton: {
    marginTop: SPACING.md,
  },
  assignButton: {
    marginTop: SPACING.md,
  },
  selfiePreviewContainer: {
    width: '100%',
    height: 300,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  selfiePreview: {
    width: '100%',
    height: '100%',
  },
  previewButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  previewButton: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 0,
  },
  noHistoryContainer: {
    padding: SPACING.md,
  },
  noHistoryText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  floatingActionButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary.light,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});