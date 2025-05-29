// User related types
export enum UserRole {
  ADMIN = 'Admin',
  CEO = 'CEO',
  MANAGER = 'Manager',
  TEAM_LEAD = 'Team Lead',
  PUBLIC_RELATIONS = 'Public Relations',
}

export enum UserRoleId {
  ADMIN = 2,
  CEO = 3,
  MANAGER = 4,
  TEAM_LEAD = 5,
  PUBLIC_RELATIONS = 7,
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  role_id: UserRoleId;
  organization_id: number;
  address: string;
  city_id: number;
  state_id: number;
  country_id: number;
  postal_code: string | null;
  department_id: number;
  status: 'Active' | 'Inactive';
  is_admin: number;
  email_verified_at: string | null;
  avatar?: string;
  isActive: boolean;
  teamId?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

// TVM related types
export enum TVMStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE',
}

export interface TVM {
  id: string;
  stationId: string;
  stationName: string;
  location: string;
  status: TVMStatus;
  assignedRMId?: string;
  lastMaintenanceDate?: string;
  currentIssues: string[];
  uptime: number; // percentage
  transactionsToday: number;
  createdAt: string;
  updatedAt: string;
}

// Task related types
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  tvmId?: string;
  assignedToId?: string;
  createdById: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance related types
export interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Support related types
export interface CustomerSupport {
  id: string;
  customerId?: string;
  customerPhone: string;
  tvmId?: string;
  assignedRMId?: string;
  issueType: string;
  issueDetails: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  whatsappChatId?: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

// Document related types
export interface Document {
  id: string;
  userId: string;
  type: 'AADHAAR' | 'PAN' | 'LICENSE' | 'OTHER';
  title: string;
  description?: string;
  fileUrl: string;
  isVerified: boolean;
  verifiedById?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Shift related types
export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  days: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  shiftId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alert related types
export interface Alert {
  id: string;
  title: string;
  description: string;
  tvmId?: string;
  priority: TaskPriority;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}