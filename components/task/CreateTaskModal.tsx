import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react-native';
import { TaskPriority } from '@/types';
import { taskApi, TVM, tvmApi, authApi, User } from '@/utils/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('Medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deviceId, setDeviceId] = useState<number>(1);
  const [assignUserId, setAssignUserId] = useState<number>(6);
  const [devices, setDevices] = useState<TVM[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    fetchDevices();
    fetchUsers();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await tvmApi.getTVMs();
      if (response.data.status === 'true' && response.data.devices) {
        setDevices(response.data.devices);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('Starting to fetch users...');
      const response = await authApi.getUsers();
      console.log('Raw API Response:', response);
      
      if (response.status === 'true' && response.user) {
        console.log('Users found:', response.user.length);
        // Filter out inactive users if needed
        const activeUsers = response.user.filter(user => user.status === 'Active');
        console.log('Active users:', activeUsers);
        setUsers(activeUsers);
      } else {
        console.log('No users found in response');
        Alert.alert('Warning', 'No users available to assign tasks to.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || dueTime;
    setShowTimePicker(Platform.OS === 'ios');
    setDueTime(currentTime);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the task');
      return;
    }

    try {
      setIsSubmitting(true);
      const due_datetime = `${formatDate(dueDate)} ${formatTime(dueTime)}:00`;

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        assign_user_id: assignUserId,
        priority,
        due_datetime,
        device_id: deviceId,
      };

      console.log('Task data being sent:', taskData);

      const response = await taskApi.createTask(taskData);
      console.log('Create task API response:', response);

      if (response.status === 'true') {
        onTaskCreated();
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setDueDate(new Date());
        setDueTime(new Date());
        setDeviceId(1);
        setAssignUserId(6);
      } else {
        Alert.alert('Error', response.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.neutral[700]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                placeholderTextColor={COLORS.neutral[400]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter task description"
                placeholderTextColor={COLORS.neutral[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={priority}
                  onValueChange={(value: string) => setPriority(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Low" value="Low" />
                  <Picker.Item label="Medium" value="Medium" />
                  <Picker.Item label="High" value="High" />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assign To</Text>
              <View style={styles.pickerContainer}>
                {isLoadingUsers ? (
                  <View style={[styles.picker, styles.loadingContainer]}>
                    <Text style={styles.loadingText}>Loading users...</Text>
                  </View>
                ) : users.length > 0 ? (
                  <Picker
                    selectedValue={assignUserId}
                    onValueChange={(value: number) => setAssignUserId(value)}
                    style={styles.picker}
                  >
                    {users.map((user) => (
                      <Picker.Item
                        key={user.id}
                        label={`${user.name} (${user.role})`}
                        value={user.id}
                      />
                    ))}
                  </Picker>
                ) : (
                  <View style={[styles.picker, styles.loadingContainer]}>
                    <Text style={styles.loadingText}>No users available</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Device</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={deviceId}
                  onValueChange={(value: number) => setDeviceId(value)}
                  style={styles.picker}
                >
                  {devices.map((device) => (
                    <Picker.Item
                      key={device.id}
                      label={`${device.name} (${device.serial_number})`}
                      value={device.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date *</Text>
              <TouchableOpacity onPress={showDatepicker} style={styles.input}>
                <Text style={styles.inputText}>{formatDate(dueDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  testID="datePicker"
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Time *</Text>
               <TouchableOpacity onPress={showTimepicker} style={styles.input}>
                <Text style={styles.inputText}>{formatTime(dueTime)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  testID="timePicker"
                  value={dueTime}
                  mode="time"
                  display="default"
                  onChange={onChangeTime}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outlined"
              onPress={onClose}
              style={styles.footerButton}
            />
            <Button
              title="Create Task"
              variant="filled"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral[900],
  },
  closeButton: {
    padding: SPACING.xs,
  },
  form: {
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[700],
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[900],
    justifyContent: 'center', // Center text vertically
  },
   inputText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[900],
  },
  textArea: {
    height: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: SPACING.sm,
  },
  footerButton: {
    minWidth: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[100],
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[600],
  },
});

export default CreateTaskModal; 