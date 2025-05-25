import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ViewStyle, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { MapPin, Clock, Calendar, ArrowRight, User, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react-native';
import { AttendanceRecord } from '@/types';
import { attendanceApi, Attendance, ShiftAttendanceResponse } from '@/utils/api';
import { useTheme } from '@/context/theme';
import { useAuth } from '@/context/auth';
import { getTimeElapsedString } from '@/utils/time';

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

export default function AttendanceScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [shiftInfo, setShiftInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      setSyncState('syncing');

      // Original API call
      const response: ShiftAttendanceResponse = await attendanceApi.getShiftAttendance();

      // Check if we have any data in the response
      if (!response.attendance || response.attendance.length === 0) {
        // If no attendance, but there is a shift, show the shift info and check-in button
        if (response.assign_shift && response.assign_shift.length > 0) {
          setAttendance(null); // Ensure attendance is null
          setAttendanceHistory([]);
          setShiftInfo(response.assign_shift[0]);
        } else {
           // If no attendance and no shift, show the empty state message
          setAttendance(null);
          setAttendanceHistory([]);
          setShiftInfo(null);
        }
        setSyncState('synced');
        setLastSyncTime(new Date());
        return; // Exit the function after setting state
      }

      // Logic for handling fetched attendance
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayAttendance = response.attendance.find(a => a.date === todayStr) || null;
      
      // Explicitly set attendance to null if no record is found for today
      setAttendance(todayAttendance);
      
      setAttendanceHistory(response.attendance.filter(a => a.date !== todayStr));
      setShiftInfo(response.assign_shift && response.assign_shift.length > 0 ? response.assign_shift[0] : null);
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Attendance fetch error:', err);
      setError('Failed to fetch attendance. Please try again later.');
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

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const coords = await getLocation();
      if (!shiftInfo) throw new Error('No shift assignment found.');
      
      // Take selfie first
      await takeSelfie();
      if (!selfieImage) {
        throw new Error('Selfie is required for check-in');
      }

      // API call for check-in
      const response = await attendanceApi.getShiftAttendance(); // Re-fetch to get current shift assignment
      const currentShift = response.assign_shift.find(shift => shift.user_id === user?.id);
      
      if (!currentShift) throw new Error('No active shift found for your profile');
      
      await attendanceApi.checkInAttendance({
        user_shift_assignment_id: currentShift.id,
        check_in_latitude: coords.latitude.toString(),
        check_in_longitude: coords.longitude.toString(),
      });
      
      Alert.alert('Success', 'Checked in successfully!');
      fetchAttendance(); // Refresh data after successful check-in
    } catch (err: any) {
      Alert.alert('Check In Failed', err.message || 'Unable to check in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const coords = await getLocation();
      if (!attendance) throw new Error('No attendance record found.');
      
      // Take selfie first
      await takeSelfie();
      if (!selfieImage) {
        throw new Error('Selfie is required for check-out');
      }

      // API call for check-out
      const response = await attendanceApi.getShiftAttendance(); // Re-fetch to get current attendance and shift assignment
      const currentAttendance = response.attendance.find(att => att.user_id === user?.id);
      const currentShift = response.assign_shift.find(shift => shift.user_id === user?.id);
      
      if (!currentAttendance || !currentShift) throw new Error('No active attendance or shift found for your profile');
      
      await attendanceApi.checkOutAttendance({
        attendance_id: currentAttendance.id,
        user_shift_assignment_id: currentShift.id,
        check_out_latitude: coords.latitude.toString(),
        check_out_longitude: coords.longitude.toString(),
      });

      Alert.alert('Success', 'Checked out successfully!');
      fetchAttendance(); // Refresh data after successful check-out
    } catch (err: any) {
      Alert.alert('Check Out Failed', err.message || 'Unable to check out.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleResetState = () => {
    setAttendance(null);
    setAttendanceHistory([]);
    setSelfieImage(null);
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
      
      // Take selfie first
      await takeSelfie();
      if (!selfieImage) {
        throw new Error('Selfie is required for check-in');
      }

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'LATE':
        return 'warning';
      case 'ABSENT':
        return 'error';
      default:
        return 'default';
    }
  };

  const cardStyle = (baseStyle: ViewStyle): ViewStyle => ({
    ...baseStyle,
    backgroundColor: theme.card,
  });

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Attendance</Text>
        {lastSyncTime && (
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
        )}
      </View>
      <ScrollView
        style={styles.scrollView}
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
        {!attendance && !attendanceHistory.length && !shiftInfo ? (
           <Card variant="elevated" style={cardStyle(styles.emptyStateCard)}>
            <View style={styles.emptyStateContainer}>
              <AlertCircle size={48} color={theme.secondaryText} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Attendance Records</Text>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
                There are no attendance records available. This could be because:
              </Text>
              <View style={styles.emptyStateList}>
                <Text style={[styles.emptyStateListItem, { color: theme.secondaryText }]}>• You haven't been assigned to any shifts yet</Text>
                <Text style={[styles.emptyStateListItem, { color: theme.secondaryText }]}>• Your attendance records have been cleared</Text>
                <Text style={[styles.emptyStateListItem, { color: theme.secondaryText }]}>• The system is being updated</Text>
              </View>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={fetchAttendance}
              >
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <>
            <Card variant="elevated" style={cardStyle(styles.todayCard)}>
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

              <View style={styles.statusContainer}>
                {!attendance && (
                  <View style={styles.statusInfo}>
                    <AlertCircle size={18} color={theme.secondaryText} />
                    <Text style={[styles.statusText, { color: theme.secondaryText }]}>You haven't checked in yet</Text>
                  </View>
                )}
                
                {attendance && !attendance.check_out_time && (
                  <View style={styles.statusInfo}>
                    <CheckCircle2 size={18} color={COLORS.success.light} />
                    <Text style={[styles.statusText, { color: theme.text }]}>You're currently checked in</Text>
                  </View>
                )}
                
                {attendance && attendance.check_out_time && (
                  <View style={styles.statusInfo}>
                    <CheckCircle2 size={18} color={COLORS.success.light} />
                    <Text style={[styles.statusText, { color: theme.text }]}>You've completed your shift</Text>
                  </View>
                )}
              </View>
              
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
                    onPress={handleCheckOut}
                    disabled={checkingOut}
                  />
                )}
              </View>
            </Card>
            
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance History</Text>
            </View>
            {attendanceHistory.length === 0 ? (
              <View style={styles.noHistoryContainer}>
                <Text style={[styles.noHistoryText, { color: theme.secondaryText }]}>Welcome! No attendance history yet. Your records will appear here from tomorrow after you log today's shift.</Text>
              </View>
            ) : (
              attendanceHistory.map((record, index) => (
                <Card key={index} variant="outlined" style={cardStyle(styles.historyCard)}>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyDate, { color: theme.text }]}>{formatDate(record.date)}</Text>
                    <StatusBadge 
                      label={record.status} 
                      type={getStatusColor(record.status)}
                      size="sm"
                    />
                  </View>
                  <View style={styles.historyTimes}>
                    <View style={styles.historyTimeItem}>
                      <Text style={[styles.historyTimeLabel, { color: theme.secondaryText }]}>Check In</Text>
                      <Text style={[styles.historyTimeValue, { color: theme.text }]}>{formatTime(record.check_in_time!)}</Text>
                    </View>
                    <View style={styles.historyTimeItem}>
                      <Text style={[styles.historyTimeLabel, { color: theme.secondaryText }]}>Check Out</Text>
                      <Text style={[styles.historyTimeValue, { color: theme.text }]}>{formatTime(record.check_out_time!)}</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
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
    padding: SPACING.md,
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
  },
  emptyStateContainer: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateList: {
    marginBottom: SPACING.lg,
  },
  emptyStateListItem: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
  },
  noHistoryContainer: {
    padding: SPACING.md,
  },
  noHistoryText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
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
});