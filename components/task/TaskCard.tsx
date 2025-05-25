import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Clock, CircleCheck as CheckCircle, Calendar, Ticket, User } from 'lucide-react-native';
import { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onStartTask?: () => void;
  onCompleteTask?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onPress,
  onStartTask,
  onCompleteTask
}) => {
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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="outlined" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <StatusBadge 
              label={task.priority} 
              type={getPriorityType(task.priority)}
              size="sm"
            />
            <StatusBadge 
              label={task.status} 
              type={getStatusType(task.status)}
              size="sm"
              style={{ marginLeft: SPACING.xs }}
            />
          </View>
          <Text style={styles.taskId}>{task.id}</Text>
        </View>
        
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.description}>{task.description}</Text>
        
        <View style={styles.details}>
          {task.tvmId && (
            <View style={styles.detailItem}>
              <Ticket size={16} color={COLORS.neutral[500]} />
              <Text style={styles.detailText}>{task.tvmId}</Text>
            </View>
          )}
          
          {task.assignedToId && (
            <View style={styles.detailItem}>
              <User size={16} color={COLORS.neutral[500]} />
              <Text style={styles.detailText}>RM: Suman</Text>
            </View>
          )}
          
          {task.dueDate && (
            <View style={styles.detailItem}>
              <Calendar size={16} color={COLORS.neutral[500]} />
              <Text style={styles.detailText}>Due: {formatDate(task.dueDate)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
          {task.status === TaskStatus.PENDING && onStartTask && (
            <Button
              title="Start Task"
              size="sm"
              color="primary"
              leftIcon={<Clock size={16} color={COLORS.white} />}
              onPress={(e) => {
                e.stopPropagation();
                onStartTask();
              }}
            />
          )}
          
          {task.status === TaskStatus.IN_PROGRESS && onCompleteTask && (
            <Button
              title="Complete Task"
              size="sm"
              color="success"
              leftIcon={<CheckCircle size={16} color={COLORS.white} />}
              onPress={(e) => {
                e.stopPropagation();
                onCompleteTask();
              }}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
  },
  taskId: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[500],
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral[900],
    marginBottom: SPACING.xs,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[700],
    marginBottom: SPACING.md,
  },
  details: {
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[700],
    marginLeft: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});

export default TaskCard;