import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { COLORS, FONTS, FONT_SIZES } from '@/constants/theme';
import { Attendance, AssignShift, Station, Gate } from '@/utils/api';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

interface AttendanceHistoryListProps {
  attendanceHistory: Attendance[];
  assignedShifts: AssignShift[];
  stations: Station[];
  gates: Gate[];
  theme: any;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

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

function getStatusColor(status: string): StatusType {
  switch (status) {
    case 'Present':
    case 'PRESENT':
      return 'success';
    case 'Late':
    case 'LATE':
      return 'warning';
    case 'Absent':
    case 'ABSENT':
      return 'error';
    default:
      return 'default';
  }
}

const AttendanceHistoryList: React.FC<AttendanceHistoryListProps> = ({ attendanceHistory, assignedShifts, stations, gates, theme }) => {
  if (!attendanceHistory || attendanceHistory.length === 0) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ color: theme.secondaryText, textAlign: 'center', fontFamily: FONTS.regular }}>
          Welcome! No attendance history yet. Your records will appear here after you log your shifts.
        </Text>
      </View>
    );
  }
  return (
    <ScrollView>
      {attendanceHistory.map((record, index) => {
        const assignedShiftForHistory = assignedShifts.find(shift => shift.id === record.user_shift_assignment_id);
        const historyStationName = assignedShiftForHistory?.station_id
          ? stations.find(s => s.id === assignedShiftForHistory.station_id)?.name
          : record.user_shift_assignment?.station?.name || 'Unknown';
        const historyGateName = assignedShiftForHistory?.gate_id
          ? gates.find(g => g.id === assignedShiftForHistory.gate_id)?.name
          : record.user_shift_assignment?.gate?.name || 'Unknown';
        return (
          <Card key={index} variant="outlined" style={{ marginBottom: 12, padding: 12, backgroundColor: theme.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.md }}>{formatDate(record.date)}</Text>
              <StatusBadge label={record.status} type={getStatusColor(record.status)} size="sm" />
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>Station: {historyStationName}</Text>
              <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>Gate: {historyGateName}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>Check In</Text>
                <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.md }}>{record.check_in_time ? formatTime(record.check_in_time) : '--:--'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.secondaryText, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>Check Out</Text>
                <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.md }}>{record.check_out_time ? formatTime(record.check_out_time) : '--:--'}</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
};

export default AttendanceHistoryList; 