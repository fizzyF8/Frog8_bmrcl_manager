import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Clock, CircleCheck as CheckCircle, Calendar, Ticket, User, CirclePlus as PlusCircle, ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';
import SyncStatus from '@/components/ui/SyncStatus';
import { getTimeElapsedString } from '@/utils/time';
import { taskApi, Task, tvmApi, TVM, authApi, UserProfile } from '@/utils/api';
import TaskModal from '@/components/task/CreateTaskModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/context/auth';
import { useTaskContext } from '@/context/taskContext';
import * as ImagePicker from 'expo-image-picker';
// import { usePermissions } from '@/hooks/usePermissions';

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterTab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.light,
  },
  filterTabText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
  activeFilterTabText: {
    color: COLORS.white,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg * 2,
  },
  taskCard: {
    marginBottom: SPACING.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskId: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
  taskTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xs,
  },
  taskDescription: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  taskDetails: {
    marginBottom: SPACING.md,
  },
  taskDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  taskDetailText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  messageText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
});

const FILTERS = [
  { key: 'ALL', label: 'All Tasks' },
  { key: 'MY', label: 'My Tasks' },
];

export default function TasksScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { refreshTaskStats } = useTaskContext();
  // const { hasPermission } = usePermissions();
  const [syncState, setSyncState] = useState<'offline' | 'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<{ [key: number]: TVM }>({});
  const [users, setUsers] = useState<{ [key: number]: UserProfile }>({});
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [taskImageUri, setTaskImageUri] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [selectedFilter]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setSyncState('syncing');
      let response;
      
      console.log('Fetching tasks with filter:', selectedFilter);
      if (selectedFilter === 'ALL') {
        response = await taskApi.getAllTasks();
      } else {
        response = await taskApi.getMyTasks();
      }
      console.log('Tasks API Response:', response);

      if (response.status !== 'true') {
        throw new Error(response.message || 'Failed to fetch tasks');
      }

      // Use the response directly without additional filtering
      const taskData = response.taskdata || [];
      console.log(`Found ${taskData.length} tasks`);
      
      if (taskData.length === 0) {
        console.log('No tasks found for the current filter');
        if (selectedFilter === 'MY') {
          console.log('Current user ID:', user?.id);
        }
      }

      setTasks(taskData);
      
      if (taskData.length > 0) {
        // Fetch devices and users for task details
        await fetchDevicesAndUsers(taskData);
      }

      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setSyncState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevicesAndUsers = async (taskData: Task[]) => {
    // Fetch device details for all tasks
    const deviceIds = [...new Set(taskData.map(task => task.device_id))];
    console.log('Fetching details for devices:', deviceIds);
    const devicePromises = deviceIds.map(id => tvmApi.getTVM(id));
    const deviceResponses = await Promise.all(devicePromises);
    const deviceMap = deviceResponses.reduce((acc, response) => {
      if (response.status === 'true' && response.device) {
        acc[response.device.id] = response.device;
      }
      return acc;
    }, {} as { [key: number]: TVM });
    console.log('Device map:', deviceMap);
    setDevices(deviceMap);

    // Fetch user profiles for all tasks
    const userIds = [...new Set([
      ...taskData.map(task => task.assign_user_id),
      ...taskData.map(task => task.assign_by)
    ])];
    console.log('Fetching details for users:', userIds);
    
    // Get all users and filter to the ones we need
    const usersResponse = await authApi.getUsers();
    if (usersResponse.status === 'true' && usersResponse.user) {
      const userMap = usersResponse.user
        .filter(user => userIds.includes(user.id))
        .reduce((acc: { [key: number]: UserProfile }, user) => {
          acc[user.id] = {
            ...(user as any),
            city_id: (user as any).city_id || 0,
            city: (user as any).city || '',
            state_id: (user as any).state_id || 0,
            state: (user as any).state || '',
            country_id: (user as any).country_id || 0,
            country: (user as any).country || '',
            role_id: (user as any).role_id || 0,
            address: (user as any).address || '',
            postal_code: (user as any).postal_code || '',
            department_id: (user as any).department_id || 0,
            avatar: (user as any).avatar || '',
          };
          return acc;
        }, {});
      console.log('User map:', userMap);
      setUsers(userMap);
    }
  };

  const filteredTasks = tasks;

  const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityType = (priority: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleStartTask = async (taskId: number) => {
    try {
      setSyncState('syncing');
      const response = await taskApi.startTask(taskId);
      
      if (response.status === 'true') {
        Alert.alert('Success', 'Task started successfully!');
        // Refresh tasks and task stats
        await fetchTasks();
        await refreshTaskStats();
      } else {
        Alert.alert('Error', response.message || 'Failed to start task');
      }
    } catch (error) {
      console.error('Error starting task:', error);
      Alert.alert('Error', 'Failed to start task. Please try again.');
    } finally {
      setSyncState('synced');
    }
  };

  const handleCompleteTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setTaskImageUri(null);
    setShowImageModal(true);
  };

  const handleImageCapture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: false,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!result.canceled && result.assets[0].uri) {
      setTaskImageUri(result.assets[0].uri);
    }
  };

  const handleImageReupload = async () => {
    Alert.alert('Upload Image', 'Choose an option', [
      { text: 'Camera', onPress: handleImageCapture },
      { text: 'Gallery', onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
          base64: false,
        });
        if (!result.canceled && result.assets[0].uri) {
          setTaskImageUri(result.assets[0].uri);
        }
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleImageModalConfirm = async () => {
    if (selectedTaskId && taskImageUri) {
      try {
        setShowImageModal(false);
        await taskApi.completeTask(selectedTaskId, taskImageUri);
        Alert.alert('Success', 'Task completed successfully!');
        fetchTasks();
        refreshTaskStats();
      } catch (error) {
        Alert.alert('Error', 'Failed to complete task. Please try again.');
      } finally {
        setTaskImageUri(null);
        setSelectedTaskId(null);
      }
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncState('syncing');
              const response = await taskApi.deleteTask(taskId);
              
              if (response.status === 'true') {
                Alert.alert('Success', 'Task deleted successfully!');
                // Refresh tasks and task stats
                await fetchTasks();
                await refreshTaskStats();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete task');
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            } finally {
              setSyncState('synced');
            }
          },
        },
      ]
    );
  };

  const handleViewTask = (task: Task) => {
    // Implement view logic or modal as needed
    Alert.alert('View Task', `Task: ${task.title}`);
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setIsEditModalVisible(true);
  };

  const renderItem = ({ item }: { item: Task }) => (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskHeaderLeft}>
          <Text style={styles.taskId}>#{item.id}</Text>
        </View>
        <StatusBadge label={item.status} type={getStatusType(item.status)} />
      </View>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <View style={styles.taskDetails}>
        <View style={styles.taskDetailItem}>
          <Clock size={16} color={theme.secondaryText} />
          <Text style={styles.taskDetailText}>{formatDate(item.due_datetime)}</Text>
        </View>
        <View style={styles.taskDetailItem}>
          <User size={16} color={theme.secondaryText} />
          <Text style={styles.taskDetailText}>{users[item.assign_user_id]?.name || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.taskActions}>
        <Button
          title="View"
          variant="outlined"
          onPress={() => handleViewTask(item)}
          style={{ marginRight: SPACING.sm }}
        />
        {/* {hasPermission('task.edit') && ( */}
          <Button
            title="Edit"
            variant="outlined"
            onPress={() => handleEditTask(item)}
            style={{ marginRight: SPACING.sm }}
          />
        {/* )} */}
        {/* {hasPermission('task.delete') && ( */}
          <Button
            title="Delete"
            variant="outlined"
            color="error"
            onPress={() => handleDeleteTask(item.id)}
          />
        {/* )} */}
      </View>
    </Card>
  );

  const renderImageModal = () => (
    <Modal visible={showImageModal} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: theme.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, width: '90%' }}>
          <Text style={{ color: theme.text, fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: SPACING.md }}>Task Completion Image Required</Text>
          {taskImageUri ? (
            <Image source={{ uri: taskImageUri }} style={{ width: '100%', height: 300, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md }} />
          ) : (
            <View style={{ width: '100%', height: 300, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: theme.secondaryText }}>No image selected</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md }}>
            <Button variant="outlined" onPress={handleImageReupload} title={taskImageUri ? 'Retake/Reupload' : 'Upload Image'} />
            <Button onPress={handleImageModalConfirm} title="Confirm" disabled={!taskImageUri} />
          </View>
          <Button variant="ghost" onPress={() => { setShowImageModal(false); setTaskImageUri(null); setSelectedTaskId(null); }} title="Cancel" />
        </View>
      </View>
    </Modal>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Tasks</Text>
          </View>
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime || new Date())} />
        </View>

        <View style={styles.filterTabs}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab,
                { borderColor: theme.primary, backgroundColor: selectedFilter === filter.key ? theme.primary : theme.card },
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.key && styles.activeFilterTabText,
                  { color: selectedFilter === filter.key ? COLORS.white : theme.text },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.messageText, { color: theme.text }]}>Loading tasks...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.messageText, { color: theme.text }]}>
              {selectedFilter === 'MY' 
                ? 'No tasks assigned to you'
                : 'No tasks found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Action Button for Create Task */}
        {/* {hasPermission('task.create') && ( */}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: COLORS.primary.light }]}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <PlusCircle size={32} color={COLORS.white} />
          </TouchableOpacity>
        {/* )} */}

        <TaskModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onTaskCreated={() => {
            setIsCreateModalVisible(false);
            Alert.alert('Success', 'Task added successfully!');
            fetchTasks();
          }}
        />
        <TaskModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setEditTask(null);
          }}
          onTaskUpdated={() => {
            setIsEditModalVisible(false);
            setEditTask(null);
            Alert.alert('Success', 'Task updated successfully!');
            fetchTasks();
          }}
          initialTask={editTask}
          isEdit
        />
        {renderImageModal()}
      </SafeAreaView>
    </ErrorBoundary>
  );
} 