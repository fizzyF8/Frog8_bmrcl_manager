import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Clock, CircleCheck as CheckCircle, Calendar, Ticket, User, CirclePlus as PlusCircle } from 'lucide-react-native';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { useTheme } from '@/context/theme';

// Mock data
const mockTasks: Task[] = [
  {
    id: 'T001',
    title: 'Replace receipt paper in TVM-001',
    description: 'TVM is running low on receipt paper. Replace with new roll from maintenance kit.',
    tvmId: 'TVM001',
    assignedToId: 'RM001',
    createdById: 'M001',
    priority: TaskPriority.HIGH,
    status: TaskStatus.PENDING,
    dueDate: '2023-06-20T15:00:00',
    createdAt: '2023-06-15T09:30:00',
    updatedAt: '2023-06-15T09:30:00',
  },
  {
    id: 'T002',
    title: 'Verify card reader functionality',
    description: 'Customer reported issues with card reader on TVM-003. Test with different cards and report back findings.',
    tvmId: 'TVM003',
    assignedToId: 'RM001',
    createdById: 'M001',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.IN_PROGRESS,
    dueDate: '2023-06-19T17:00:00',
    createdAt: '2023-06-15T10:15:00',
    updatedAt: '2023-06-15T14:20:00',
  },
  {
    id: 'T003',
    title: 'Clear paper jam from TVM-002',
    description: 'TVM-002 has reported a paper jam in the receipt printer. Clear jam and test printing.',
    tvmId: 'TVM002',
    assignedToId: 'RM001',
    createdById: 'M001',
    priority: TaskPriority.CRITICAL,
    status: TaskStatus.PENDING,
    dueDate: '2023-06-18T12:00:00',
    createdAt: '2023-06-15T11:00:00',
    updatedAt: '2023-06-15T11:00:00',
  },
  {
    id: 'T004',
    title: 'Update TVM software',
    description: 'Apply latest software update to TVM-004. Update should take approximately 15 minutes.',
    tvmId: 'TVM004',
    assignedToId: 'RM001',
    createdById: 'M001',
    priority: TaskPriority.LOW,
    status: TaskStatus.PENDING,
    dueDate: '2023-06-25T09:00:00',
    createdAt: '2023-06-15T13:45:00',
    updatedAt: '2023-06-15T13:45:00',
  },
  {
    id: 'T005',
    title: 'Document new TVM installation',
    description: 'Take photos and document the new TVM installation at Trinity Station. Upload to document management system.',
    tvmId: 'TVM006',
    assignedToId: 'RM001',
    createdById: 'M001',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    completedAt: '2023-06-16T10:30:00',
    dueDate: '2023-06-17T17:00:00',
    createdAt: '2023-06-14T09:00:00',
    updatedAt: '2023-06-16T10:30:00',
  },
];

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

function TasksScreen() {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<TaskStatus | 'ALL'>('ALL');

  const filteredTasks = selectedFilter === 'ALL'
    ? mockTasks
    : mockTasks.filter(task => task.status === selectedFilter);

  const getStatusType = (status: TaskStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.PENDING:
        return 'warning';
      case TaskStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityType = (priority: TaskPriority): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'info';
      case TaskPriority.MEDIUM:
        return 'warning';
      case TaskPriority.HIGH:
        return 'error';
      case TaskPriority.CRITICAL:
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
        {item.tvmId && (
          <View style={styles.taskDetailItem}>
            <Ticket size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>TVM ID: {item.tvmId}</Text>
          </View>
        )}

        {item.assignedToId && (
          <View style={styles.taskDetailItem}>
            <User size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>Assigned To: {item.assignedToId}</Text>
          </View>
        )}

        {item.dueDate && (
          <View style={styles.taskDetailItem}>
            <Calendar size={16} color={theme.secondaryText} />
            <Text style={[styles.taskDetailText, { color: theme.secondaryText }]}>Due: {formatDate(item.dueDate)}</Text>
          </View>
        )}
      </View>

      {item.status !== TaskStatus.COMPLETED && item.status !== TaskStatus.CANCELLED && (
        <View style={styles.taskActions}>
          {item.status === TaskStatus.PENDING && (
            <Button
              title="Start Task"
              size="sm"
              variant="filled"
              color="primary"
              leftIcon={<Clock size={16} color={COLORS.white} />}
            />
          )}

          {item.status === TaskStatus.IN_PROGRESS && (
            <Button
              title="Complete Task"
              size="sm"
              variant="filled"
              color="success"
              leftIcon={<CheckCircle size={16} color={COLORS.white} />}
            />
          )}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Tasks</Text>
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
            selectedFilter === TaskStatus.PENDING && styles.activeFilterTab,
            { borderColor: theme.border, backgroundColor: selectedFilter === TaskStatus.PENDING ? COLORS.primary.light : theme.card }
          ]}
          onPress={() => setSelectedFilter(TaskStatus.PENDING)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === TaskStatus.PENDING && styles.activeFilterTabText,
            { color: selectedFilter === TaskStatus.PENDING ? COLORS.white : theme.text }
          ]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === TaskStatus.IN_PROGRESS && styles.activeFilterTab,
            { borderColor: theme.border, backgroundColor: selectedFilter === TaskStatus.IN_PROGRESS ? COLORS.primary.light : theme.card }
          ]}
          onPress={() => setSelectedFilter(TaskStatus.IN_PROGRESS)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === TaskStatus.IN_PROGRESS && styles.activeFilterTabText,
            { color: selectedFilter === TaskStatus.IN_PROGRESS ? COLORS.white : theme.text }
          ]}>
            In Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === TaskStatus.COMPLETED && styles.activeFilterTab,
            { borderColor: theme.border, backgroundColor: selectedFilter === TaskStatus.COMPLETED ? COLORS.primary.light : theme.card }
          ]}
          onPress={() => setSelectedFilter(TaskStatus.COMPLETED)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === TaskStatus.COMPLETED && styles.activeFilterTabText,
            { color: selectedFilter === TaskStatus.COMPLETED ? COLORS.white : theme.text }
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === TaskStatus.CANCELLED && styles.activeFilterTab,
            { borderColor: theme.border, backgroundColor: selectedFilter === TaskStatus.CANCELLED ? COLORS.primary.light : theme.card }
          ]}
          onPress={() => setSelectedFilter(TaskStatus.CANCELLED)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === TaskStatus.CANCELLED && styles.activeFilterTabText,
            { color: selectedFilter === TaskStatus.CANCELLED ? COLORS.white : theme.text }
          ]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: COLORS.primary.light }]}
        onPress={() => console.log('Add new task')}
      >
        <PlusCircle size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default TasksScreen; 