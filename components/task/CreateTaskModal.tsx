import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Animated, Easing, KeyboardAvoidingView, FlatList } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react-native';
import { Task, TVM, User, taskApi, tvmApi, authApi } from '@/utils/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import { useTaskContext } from '@/context/taskContext';
import { useTheme } from '@/context/theme';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated?: (response: any) => void;
  onTaskUpdated?: (response: any) => void;
  initialTask?: Task | null;
  isEdit?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onTaskCreated,
  onTaskUpdated,
  initialTask = null,
  isEdit = false,
}) => {
  const { refreshTaskStats } = useTaskContext();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('Medium');
  const [dueDateTime, setDueDateTime] = useState(new Date());
  const [deviceId, setDeviceId] = useState<number>(1);
  const [assignUserId, setAssignUserId] = useState<number>(6);
  const [devices, setDevices] = useState<TVM[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [titleError, setTitleError] = useState('');
  const [dateTimeError, setDateTimeError] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  // Add new state for modal selectors
  const [modalSelector, setModalSelector] = useState<null | 'priority' | 'user' | 'device'>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isEdit && initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setPriority(initialTask.priority);
      setDeviceId(initialTask.device_id);
      setAssignUserId(initialTask.assign_user_id);
      setDueDateTime(new Date(initialTask.due_datetime));
    } else if (!isEdit) {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDateTime(new Date());
      setDeviceId(1);
      setAssignUserId(6);
    }
  }, [isEdit, initialTask, visible]);

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
        // Filter only Team Lead and Public Relations roles
        const filteredUsers = response.user.filter((user: User) => 
          user.status === 'Active' && 
          (user.role === 'Team Lead' || user.role === 'Public Relations')
        );
        console.log('Filtered users:', filteredUsers);
        setUsers(filteredUsers);
      } else {
        console.log('No users found in response');
        Alert.alert('Warning', response?.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const apiMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      Alert.alert('Error', apiMessage);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    if (Platform.OS === 'android') {
      setTempDate(selectedDate);
      setShowTimePicker(true);
    } else {
      setDueDateTime(selectedDate);
    }
  };
  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime || !tempDate) return;
    // Combine date from tempDate and time from selectedTime
    const combined = new Date(tempDate);
    combined.setHours(selectedTime.getHours());
    combined.setMinutes(selectedTime.getMinutes());
    combined.setSeconds(0);
    setDueDateTime(combined);
    setTempDate(null);
  };
  const showDatetimepicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      setShowDateTimePicker(true);
    }
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Animate modal open/close
  useEffect(() => {
    if (visible) {
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Validation
  const validate = () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    } else {
      setTitleError('');
    }
    if (!dueDateTime || isNaN(dueDateTime.getTime())) {
      setDateTimeError('Due date is required');
      valid = false;
    } else {
      setDateTimeError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setShowLoader(true);
    try {
      setIsSubmitting(true);
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        assign_user_id: assignUserId,
        priority,
        due_datetime: `${formatDateTime(dueDateTime)}:00`,
        device_id: deviceId,
      };
      let response;
      if (isEdit && initialTask) {
        response = await taskApi.updateTask(initialTask.id, taskData);
      } else {
        response = await taskApi.createTask(taskData);
      }
      if (response.status === 'true') {
        // Refresh task stats to update dashboard
        await refreshTaskStats();
        
        if (isEdit && onTaskUpdated) {
          onTaskUpdated(response);
        } else if (onTaskCreated) {
          onTaskCreated(response);
        }
        onClose();
      } else {
        Alert.alert('Error', response?.message || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowLoader(false);
    }
  };

  // Only apply new design for add mode
  if (!isEdit) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Task</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter task title"
                    placeholderTextColor={theme.secondaryText}
                  />
                  {titleError ? <Text style={[styles.errorText, { color: theme.error }]}>{titleError}</Text> : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, height: 100, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter task description"
                    placeholderTextColor={theme.secondaryText}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => setModalSelector('priority')}
                  >
                    <Text style={[styles.inputText, { color: theme.text }]}>{priority}</Text>
                  </TouchableOpacity>
                  {/* Modal for Priority */}
                  <Modal visible={modalSelector === 'priority'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                        <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select Priority</Text>
                        <ScrollView>
                          {['Low', 'Medium', 'High'].map((p) => (
                            <TouchableOpacity
                              key={p}
                              style={{ padding: 16, backgroundColor: priority === p ? '#22C55E' : theme.background, borderRadius: 8, marginBottom: 8 }}
                              onPress={() => { setPriority(p); setModalSelector(null); }}
                            >
                              <Text style={{ color: theme.text, fontFamily: priority === p ? FONTS.bold : FONTS.regular }}>{p}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
                      </View>
                    </View>
                  </Modal>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Assign To</Text>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => setModalSelector('user')}
                  >
                    <Text style={[styles.inputText, { color: theme.text }]}>
                      {users.find((u) => u.id === assignUserId)?.name || 'Select User'}
                    </Text>
                  </TouchableOpacity>
                  {/* Modal for User */}
                  <Modal visible={modalSelector === 'user'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                        <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select User</Text>
                        <ScrollView>
                          {users.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={{ padding: 16, backgroundColor: assignUserId === item.id ? '#22C55E' : theme.background, borderRadius: 8, marginBottom: 8 }}
                              onPress={() => { setAssignUserId(item.id); setModalSelector(null); }}
                            >
                              <Text style={{ color: theme.text, fontFamily: assignUserId === item.id ? FONTS.bold : FONTS.regular }}>{item.name} ({item.role})</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
                      </View>
                    </View>
                  </Modal>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Device</Text>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => setModalSelector('device')}
                  >
                    <Text style={[styles.inputText, { color: theme.text }]}>
                      {devices.find((d) => d.id === deviceId)?.name || 'Select Device'}
                    </Text>
                  </TouchableOpacity>
                  {/* Modal for Device */}
                  <Modal visible={modalSelector === 'device'} transparent animationType="slide" onRequestClose={() => setModalSelector(null)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ backgroundColor: theme.card, borderRadius: 12, width: '80%', maxHeight: 350, padding: 16 }}>
                        <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: 12 }}>Select Device</Text>
                        <ScrollView>
                          {devices.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={{ padding: 16, backgroundColor: deviceId === item.id ? '#22C55E' : theme.background, borderRadius: 8, marginBottom: 8 }}
                              onPress={() => { setDeviceId(item.id); setModalSelector(null); }}
                            >
                              <Text style={{ color: theme.text, fontFamily: deviceId === item.id ? FONTS.bold : FONTS.regular }}>{item.name} ({item.serial_number})</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <Button title="Cancel" onPress={() => setModalSelector(null)} style={{ marginTop: 8 }} />
                      </View>
                    </View>
                  </Modal>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Due Date & Time *</Text>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={showDatetimepicker}
                  >
                    <Text style={[styles.inputText, { color: theme.text }]}>{formatDateTime(dueDateTime)}</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                      value={dueDateTime}
                      mode="date"
                      display="default"
                      onChange={onChangeDate}
                    />
                  )}
                  {Platform.OS === 'android' && showTimePicker && (
                    <DateTimePicker
                      value={dueDateTime}
                      mode="time"
                      display="default"
                      onChange={onChangeTime}
                    />
                  )}
                  {Platform.OS !== 'android' && showDateTimePicker && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={dueDateTime}
                      mode="datetime"
                      display="default"
                      onChange={onChangeDate}
                    />
                  )}
                  {dateTimeError ? <Text style={[styles.errorText, { color: theme.error }]}>{dateTimeError}</Text> : null}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Cancel"
                  variant="outlined"
                  color="secondary"
                  onPress={onClose}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Create Task"
                  variant="filled"
                  color="primary"
                  onPress={handleSubmit}
                  loading={showLoader}
                  disabled={showLoader || !title.trim() || !dueDateTime || isNaN(dueDateTime.getTime())}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                  titleError && { borderColor: theme.error },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                placeholderTextColor={theme.secondaryText}
              />
              {titleError ? <Text style={[styles.errorText, { color: theme.error }]}>{titleError}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, height: 100, textAlignVertical: 'top' },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter task description"
                placeholderTextColor={theme.secondaryText}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => {
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowUserDropdown(false);
                  setShowDeviceDropdown(false);
                }}
              >
                <Text style={[styles.inputText, { color: theme.text }]}>{priority}</Text>
              </TouchableOpacity>
              {showPriorityDropdown && (
                <View style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]}> 
                  {['Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.dropdownItem,
                        { backgroundColor: priority === p ? '#22C55E' : theme.background },
                      ]}
                      onPress={() => {
                        setPriority(p);
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: theme.text },
                          priority === p && { fontFamily: FONTS.bold },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Assign To</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowPriorityDropdown(false);
                  setShowDeviceDropdown(false);
                }}
              >
                <Text style={[styles.inputText, { color: theme.text }]}> 
                  {users.find((u) => u.id === assignUserId)?.name || 'Select User'}
                </Text>
              </TouchableOpacity>
              {showUserDropdown && (
                <View style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border, maxHeight: 180 }]}> 
                  <FlatList
                    data={users}
                    keyExtractor={(u) => u.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          { backgroundColor: assignUserId === item.id ? '#22C55E' : theme.background },
                        ]}
                        onPress={() => {
                          setAssignUserId(item.id);
                          setShowUserDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: theme.text },
                            assignUserId === item.id && { fontFamily: FONTS.bold },
                          ]}
                        >
                          {item.name} ({item.role})
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Device</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => {
                  setShowDeviceDropdown(!showDeviceDropdown);
                  setShowPriorityDropdown(false);
                  setShowUserDropdown(false);
                }}
              >
                <Text style={[styles.inputText, { color: theme.text }]}> 
                  {devices.find((d) => d.id === deviceId)?.name || 'Select Device'}
                </Text>
              </TouchableOpacity>
              {showDeviceDropdown && (
                <View style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border, maxHeight: 180 }]}> 
                  <FlatList
                    data={devices}
                    keyExtractor={(d) => d.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          { backgroundColor: deviceId === item.id ? '#22C55E' : theme.background },
                        ]}
                        onPress={() => {
                          setDeviceId(item.id);
                          setShowDeviceDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: theme.text },
                            deviceId === item.id && { fontFamily: FONTS.bold },
                          ]}
                        >
                          {item.name} ({item.serial_number})
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Due Date & Time *</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={showDatetimepicker}
              >
                <Text style={[styles.inputText, { color: theme.text }]}>{formatDateTime(dueDateTime)}</Text>
              </TouchableOpacity>
              {showDateTimePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={dueDateTime}
                  mode="datetime"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
              {dateTimeError ? <Text style={[styles.errorText, { color: theme.error }]}>{dateTimeError}</Text> : null}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outlined"
              color="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Update Task"
              variant="filled"
              color="primary"
              onPress={handleSubmit}
              loading={showLoader}
              disabled={showLoader || !title.trim() || !dueDateTime || isNaN(dueDateTime.getTime())}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
  modalBody: {
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
  inputError: {
    borderColor: COLORS.error.light,
  },
  errorText: {
    color: COLORS.error.light,
    fontSize: FONT_SIZES.sm,
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    backgroundColor: COLORS.white,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primary.light,
  },
  dropdownItemText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[900],
  },
  dropdownItemTextSelected: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: SPACING.sm,
  },
});

export default TaskModal; 