import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
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
            ...user,
            city_id: 0, // Default values since API doesn't provide these
            city: '',
            state_id: 0,
            state: '',
            country_id: 0,
            country: '',
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

  const handleCompleteTask = async (taskId: number) => {
    Alert.alert(
      'Complete Task',
      'Would you like to add a photo to document the completion?',
      [
        {
          text: 'Complete without photo',
          onPress: () => completeTaskWithImage(taskId),
        },
        {
          text: 'Add photo',
          onPress: () => completeTaskWithImage(taskId, undefined, true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const completeTaskWithImage = async (taskId: number, imageUri?: string, shouldPickImage: boolean = false) => {
    try {
      setSyncState('syncing');
      let finalImageUri = imageUri;

      if (shouldPickImage) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          finalImageUri = result.assets[0].uri;
        } else {
          setSyncState('synced');
          return;
        }
      }

      const response = await taskApi.completeTask(taskId, finalImageUri);
      
      if (response.status === 'true') {
        Alert.alert('Success', 'Task completed successfully!');
        // Refresh tasks and task stats
        await fetchTasks();
        await refreshTaskStats();
      } else {
        Alert.alert('Error', response.message || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setSyncState('synced');
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

  const renderItem = ({ item }: { item: Task }) => (
    <Card variant="outlined" style={{ ...styles.taskCard, backgroundColor: theme.card, borderColor: theme.border }}>
      <View style={styles.taskHeader}>
        <View style={styles.taskHeaderLeft}>
          <StatusBadge 
            label={item.priority} 
            type={getPriorityType(item.priority)}
            size="sm"
          />
          <StatusBadge 
            label={item.status} 
            type={getStatusType(item.status)}
            size="sm"
            style={{ marginLeft: SPACING.xs }}
          />
        </View>
        <Text style={[styles.taskId, { color: theme.secondaryText }]}>{item.id}</Text>
      </View>
      <Text style={[styles.taskTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.taskDescription, { color: theme.secondaryText }]}>{item.description}</Text>
      <View style={styles.taskDetails}>
        {item.device_id && devices[item.device_id] && (
          <View style={styles.taskDetailItem}>
            <Ticket size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>
              Device: {devices[item.device_id].name} ({devices[item.device_id].serial_number})
            </Text>
          </View>
        )}

        {item.assign_user_id && users[item.assign_user_id] && (
          <View style={styles.taskDetailItem}>
            <User size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>
              Assigned To: {users[item.assign_user_id].name}
            </Text>
          </View>
        )}

        {item.assign_by && users[item.assign_by] && (
          <View style={styles.taskDetailItem}>
            <User size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>
              Assigned By: {users[item.assign_by].name}
            </Text>
          </View>
        )}

        {item.due_datetime && (
          <View style={styles.taskDetailItem}>
            <Calendar size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>
              Due: {formatDate(item.due_datetime)}
            </Text>
          </View>
        )}
      </View>

      {item.status.toLowerCase() !== 'completed' && item.status.toLowerCase() !== 'cancelled' && (
        <View style={styles.taskActions}>
          {item.status.toLowerCase() === 'pending' && (
            <Button
              title="Start Task"
              size="sm"
              variant="filled"
              color="primary"
              leftIcon={<Clock size={16} color={COLORS.white} />}
              onPress={() => handleStartTask(item.id)}
            />
          )}

          {item.status.toLowerCase() === 'in progress' && (
            <View style={styles.taskActions}>
              <Button
                title="Complete Task"
                size="sm"
                variant="filled"
                color="success"
                leftIcon={<CheckCircle size={16} color={COLORS.white} />}
                onPress={() => handleCompleteTask(item.id)}
              />
              <Button
                title="Edit"
                size="sm"
                variant="outlined"
                color="primary"
                onPress={() => {
                  setEditTask(item);
                  setIsEditModalVisible(true);
                }}
                style={{ marginLeft: 8 }}
              />
              <Button
                title="Delete"
                size="sm"
                variant="outlined"
                color="error"
                onPress={() => handleDeleteTask(item.id)}
                style={{ marginLeft: 8 }}
              />
            </View>
          )}
        </View>
      )}
    </Card>
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

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: COLORS.primary.light }]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <PlusCircle size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TaskModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onTaskCreated={() => {
            setIsCreateModalVisible(false);
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
            fetchTasks();
          }}
          initialTask={editTask}
          isEdit
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
} 