import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Clock, CircleCheck as CheckCircle, Calendar, Ticket, User, CirclePlus as PlusCircle, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';
import SyncStatus from '@/components/ui/SyncStatus';
import { getTimeElapsedString } from '@/utils/time';
import { taskApi, Task, tvmApi, TVM, authApi, UserProfile } from '@/utils/api';
import CreateTaskModal from '@/components/task/CreateTaskModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

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
});

export default function TasksScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [syncState, setSyncState] = useState<'offline' | 'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<{ [key: number]: TVM }>({});
  const [users, setUsers] = useState<{ [key: number]: UserProfile }>({});
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setSyncState('syncing');
      const response = await taskApi.getAllTasks();
      setTasks(response.taskdata);
      
      // Fetch device details for all tasks
      const deviceIds = [...new Set(response.taskdata.map(task => task.device_id))];
      const devicePromises = deviceIds.map(id => tvmApi.getTVM(id));
      const deviceResponses = await Promise.all(devicePromises);
      const deviceMap = deviceResponses.reduce((acc, response) => {
        if (response.status === 'true' && response.device) {
          acc[response.device.id] = response.device;
        }
        return acc;
      }, {} as { [key: number]: TVM });
      setDevices(deviceMap);

      // Fetch user profiles for all tasks
      const userIds = [...new Set([
        ...response.taskdata.map(task => task.assign_user_id),
        ...response.taskdata.map(task => task.assign_by)
      ])];
      const userPromises = userIds.map(id => authApi.getProfile());
      const userResponses = await Promise.all(userPromises);
      const userMap = userResponses.reduce((acc, response) => {
        if (response.status === 'true' && response.user) {
          acc[response.user.id] = response.user;
        }
        return acc;
      }, {} as { [key: number]: UserProfile });
      setUsers(userMap);

      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setSyncState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = selectedFilter === 'ALL'
    ? tasks
    : tasks.filter(task => task.status === selectedFilter);

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
    Alert.alert(
      'Start Task',
      'Are you sure you want to start this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: async () => {
            try {
              setSyncState('syncing');
              const response = await taskApi.startTask(taskId);
              await fetchTasks(); // Refresh the task list
              setSyncState('synced');
              setLastSyncTime(new Date());
              Alert.alert('Success', response.message || 'Task started successfully');
            } catch (error) {
              console.error('Error starting task:', error);
              setSyncState('error');
              Alert.alert('Error', 'Failed to start task. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCompleteTask = async (taskId: number) => {
    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setSyncState('syncing');
              const response = await taskApi.completeTask(taskId);
              await fetchTasks(); // Refresh the task list
              setSyncState('synced');
              setLastSyncTime(new Date());
              Alert.alert('Success', response.message || 'Task completed successfully');
            } catch (error) {
              console.error('Error completing task:', error);
              setSyncState('error');
              Alert.alert('Error', 'Failed to complete task. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
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
            <Button
              title="Complete Task"
              size="sm"
              variant="filled"
              color="success"
              leftIcon={<CheckCircle size={16} color={COLORS.white} />}
              onPress={() => handleCompleteTask(item.id)}
            />
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

        <View style={[styles.filterTabs, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'ALL' && styles.activeFilterTab,
              { borderColor: theme.border, backgroundColor: selectedFilter === 'ALL' ? COLORS.primary.light : theme.card }
            ]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'ALL' && styles.activeFilterTabText,
              { color: selectedFilter === 'ALL' ? COLORS.white : theme.text }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'pending' && styles.activeFilterTab,
              { borderColor: theme.border, backgroundColor: selectedFilter === 'pending' ? COLORS.primary.light : theme.card }
            ]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'pending' && styles.activeFilterTabText,
              { color: selectedFilter === 'pending' ? COLORS.white : theme.text }
            ]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'in progress' && styles.activeFilterTab,
              { borderColor: theme.border, backgroundColor: selectedFilter === 'in progress' ? COLORS.primary.light : theme.card }
            ]}
            onPress={() => setSelectedFilter('in progress')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'in progress' && styles.activeFilterTabText,
              { color: selectedFilter === 'in progress' ? COLORS.white : theme.text }
            ]}>
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'completed' && styles.activeFilterTab,
              { borderColor: theme.border, backgroundColor: selectedFilter === 'completed' ? COLORS.primary.light : theme.card }
            ]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'completed' && styles.activeFilterTabText,
              { color: selectedFilter === 'completed' ? COLORS.white : theme.text }
            ]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'cancelled' && styles.activeFilterTab,
              { borderColor: theme.border, backgroundColor: selectedFilter === 'cancelled' ? COLORS.primary.light : theme.card }
            ]}
            onPress={() => setSelectedFilter('cancelled')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'cancelled' && styles.activeFilterTabText,
              { color: selectedFilter === 'cancelled' ? COLORS.white : theme.text }
            ]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: COLORS.primary.light }]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <PlusCircle size={24} color={COLORS.white} />
        </TouchableOpacity>

        <CreateTaskModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onTaskCreated={fetchTasks}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
} 