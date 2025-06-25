import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = 'https://demo.ctrmv.com/veriphy/public/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  expires_in: number;
}

export interface LogoutResponse {
  status: string;
  message: string;
}

export interface UserProfile {
  id: number;
  user_id?: number; // for compatibility with API
  name: string;
  email: string;
  phone: string;
  organization_id: number;
  organization_name: string;
  role: string;
  role_id: number;
  status: string;
  city_id: number;
  city: string;
  state_id: number;
  state: string;
  country_id: number;
  country: string;
  address: string;
  postal_code: string | null;
  department_id: number;
  avatar?: string;
  profile_image_url?: string;
  permissions?: string[];
}

export interface ProfileResponse {
  status: string;
  message: string;
  user: UserProfile;
}

export interface LocationDetails {
  station: string;
  station_image_url: string | null;
  gate: string;
  gate_type: string;
  uptime: string;
  transaction: string;
}

export interface TVM {
  id: number;
  name: string;
  type: string;
  model_number: string;
  serial_number: string;
  ip_address: string | null;
  mac_address: string | null;
  organization_id: number;
  status: string;
  device_image: string | null;
  device_image_url: string | null;
  location_details?: LocationDetails;
}

export interface TVMsResponse {
  data: {
    status: string;
    message: string;
    devices: TVM[];
  };
}

export interface TVMResponse {
  status: string;
  message: string;
  device: TVM;
}

// Add nested interface for user_shift_assignment within Attendance
interface UserShiftAssignmentInAttendance {
  id: number;
  user_id: number;
  shift_id: number;
  station_id: number;
  gate_id: number;
  assigned_date: string;
  assigned_by_user_id: number;
  organization_id: number;
  is_completed: number;
  is_active: boolean;
  // Include nested shift, station, gate based on the API response structure
  shift?: { // Optional nested shift details
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    // Add other shift properties if needed
  };
  station?: { // Optional nested station details
    id: number;
    name: string;
    short_name?: string; // Optional short_name if present
    // Add other station properties if needed
  };
  gate?: { // Optional nested gate details
    id: number;
    name: string;
    type?: string; // Optional type if present
    // Add other gate properties if needed
  };
}

export interface Attendance {
  id: number;
  user_id: number;
  user_shift_assignment_id: number;
  date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_latitude: string | null;
  check_in_longitude: string | null;
  check_out_latitude: string | null;
  check_out_longitude: string | null;
  remarks: string | null;
  // Add the nested user_shift_assignment object
  user_shift_assignment?: UserShiftAssignmentInAttendance;
}

export interface ShiftAttendanceResponse {
  status: string;
  message: string;
  assign_shift: any[];
  attendance: Attendance[];
}

export interface CheckInRequest {
  user_shift_assignment_id: number;
  check_in_latitude: string;
  check_in_longitude: string;
  check_in_force_mark?: boolean;
  check_in_image?: string | FormData;
}

export interface CheckOutRequest {
  attendance_id: number;
  user_shift_assignment_id: number;
  check_out_latitude: string;
  check_out_longitude: string;
  check_out_force_mark?: boolean;
  check_out_image?: string | FormData;
}

export interface Station {
  id: number;
  name: string;
  short_name: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  organization_id: number;
  is_active: number;
}

export interface Gate {
  id: number;
  name: string;
  type: string;
  station_id: number;
  organization_id: number;
  status: number;
}

export interface Shift {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  break_start_time: string;
  break_end_time: string;
  is_night_shift: number;
  is_active: number;
}

export interface AssignShiftRequest {
  assigned_date: string;
  user_id: number;
  shift_id: number;
  station_id: number;
  gate_id: number;
  organization_id?: number;
  assign_user_id?: number;
}

export interface AssignShift {
  id: number;
  user_id: number;
  shift_id: number;
  station_id: number;
  gate_id: number;
  assigned_date: string;
  assigned_by_user_id: number;
  organization_id: number;
  is_completed: number;
  is_active: boolean;
}

export interface AssignShiftResponse {
  status: string;
  message: string;
  assign_shifts: AssignShift[];
}

export interface StationsResponse {
  status: string;
  message: string;
  stations: Station[];
}

export interface GatesResponse {
  status: string;
  message: string;
  gates: Gate[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  assign_user_id: number;
  priority: string;
  status: string;
  due_datetime: string;
  assign_by: number;
  device_id: number;
  organization_id: number;
}

export interface TasksResponse {
  status: string;
  message: string;
  taskdata: Task[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  organization_id: number;
  organization_name: string;
  role: string;
  status: string;
}

export interface UsersResponse {
  status: string;
  message: string;
  user: User[];
}

export interface ResetPasswordResponse {
  status: string;
  message: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', {
      email,
      password,
    });
    return response.data;
  },

  resetPassword: async (email: string, newPassword: string, newPasswordConfirmation: string): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>('/reset_password', {
      email,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
    return response.data;
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await api.post<LogoutResponse>('/logout');
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/profile');
    return response.data;
  },

  getUsers: async (): Promise<UsersResponse> => {
    try {
      console.log('Calling getUsers API...');
      const response = await api.get<UsersResponse>('/user/list');
      console.log('getUsers API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getUsers API call:', error);
      throw error;
    }
  },
};

export const tvmApi = {
  getTVMs: async (): Promise<TVMsResponse> => {
    try {
      const response = await api.get('/devices/list');
      console.log('TVMs API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching TVMs:', error);
      throw error;
    }
  },

  getTVM: async (id: number): Promise<TVMResponse> => {
    try {
      console.log('Fetching TVM details for ID:', id);
      const response = await api.get<TVMResponse>(`/devices/show/${id}`);
      console.log('TVM details API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching TVM details:', error);
      throw error;
    }
  },

  getTVMDetails: async (id: string): Promise<TVMResponse> => {
    const response = await api.get(`/devices/show/${id}`);
    return response.data;
  },
};

export const attendanceApi = {
  getShiftAttendance: async (): Promise<ShiftAttendanceResponse> => {
    const response = await api.get<ShiftAttendanceResponse>(
      '/assign_shift/attendance/list'
    );
    return response.data;
  },
  checkInAttendance: async (data: CheckInRequest | FormData) => {
    const response = await api.post('/assign_shift/attendance/checkin', data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    });
    return response.data;
  },
  checkOutAttendance: async (data: CheckOutRequest | FormData) => {
    const response = await api.post('/assign_shift/attendance/checkout', data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    });
    return response.data;
  },
  assignShift: async (data: AssignShiftRequest): Promise<AssignShiftResponse> => {
    const response = await api.post<AssignShiftResponse>('/shift_assign/store', data);
    return response.data;
  },
  getStations: async (): Promise<StationsResponse> => {
    const response = await api.get<StationsResponse>('/stations/list');
    return response.data;
  },
  getGates: async (): Promise<GatesResponse> => {
    const response = await api.get<GatesResponse>('/gates/list');
    return response.data;
  },
  getAssignedShifts: async (): Promise<AssignShiftResponse> => {
    const response = await fetch('https://demo.ctrmv.com/veriphy/public/api/v1/shift_assign/list', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assigned shifts');
    }

    return response.json();
  },
};

export const taskApi = {
  getAllTasks: async (): Promise<TasksResponse> => {
    const response = await api.get('/tasks/list');
    const data = response.data;
    return {
      status: data.status,
      message: data.message,
      taskdata: data.taskData || data.taskdata || [],
    };
  },

  getMyTasks: async (): Promise<TasksResponse> => {
    try {
      console.log('Fetching my tasks...');
      const response = await api.get('/tasks/tasklist');
      console.log('My tasks API response:', response.data);
      
      // Handle both taskData and taskdata keys and ensure we have an array
      const taskData = response.data.taskData || response.data.taskdata || [];
      console.log('Processed task data:', taskData);
      
      return {
        status: response.data.status,
        message: response.data.message,
        taskdata: taskData,
      };
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      throw error;
    }
  },

  startTask: async (taskId: number): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>(`/tasks/start_task/${taskId}`);
    return response.data;
  },

  completeTask: async (taskId: number, taskImage?: string): Promise<{ status: string; message: string }> => {
    try {
      let data;
      let headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (taskImage) {
        // When image is provided, send as FormData
        data = new FormData();
        data.append('task_image', {
          uri: Platform.OS === 'ios' ? taskImage.replace('file://', '') : taskImage,
          type: 'image/jpeg',
          name: 'task_image.jpg',
        } as any);
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // When no image is provided, send empty object with JSON content type
        data = {};
        headers['Content-Type'] = 'application/json';
      }

      console.log('Completing task with data:', data);

      const response = await api.post<{ status: string; message: string }>(
        `/tasks/complete_task/${taskId}`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('API Error details:', error.response?.data);
      throw error;
    }
  },

  createTask: async (taskData: {
    title: string;
    description: string;
    assign_user_id: number;
    priority: string;
    due_datetime: string;
    device_id: number;
  }): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>('/tasks/store', taskData);
    return response.data;
  },

  updateTask: async (id: number, taskData: {
    title: string;
    description: string;
    assign_user_id: number;
    priority: string;
    due_datetime: string;
    device_id: number;
  }): Promise<{ status: string; message: string }> => {
    const response = await api.put<{ status: string; message: string }>(`/tasks/update/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id: number): Promise<{ status: string; message: string }> => {
    const response = await api.delete<{ status: string; message: string }>(`/tasks/delete/${id}`);
    return response.data;
  },
};

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  description?: string;
  remark?: string;
  category?: string;
  priority?: string;
  status?: string;
  added_by?: number;
}

export interface FAQResponse {
  status: string;
  message: string;
  faq: FAQItem[];
}

export const faqApi = {
  getFAQs: async (): Promise<FAQResponse> => {
    const response = await api.get<FAQResponse>('/faqs/list');
    return response.data;
  },
};

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  visibility: string;
  noteable_type: string;
  noteable_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface NotesResponse {
  status: string;
  message: string;
  notes: Note[];
}

export const notesApi = {
  getNotes: async (): Promise<NotesResponse> => {
    const response = await api.get<NotesResponse>('/notes/list');
    return response.data;
  },
  deleteNote: async (id: number): Promise<{ status: string; message: string }> => {
    const response = await api.delete<{ status: string; message: string }>(`/notes/delete/${id}`);
    return response.data;
  },
  addNote: async (title: string, content: string): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>('/notes/store', { title, content });
    return response.data;
  },
  updateNote: async (id: number, title: string, content: string): Promise<{ status: string; message: string }> => {
    const response = await api.put<{ status: string; message: string }>(`/notes/update/${id}`, { title, content });
    return response.data;
  },
};

export interface NotificationData {
  title: string;
  message: string;
  url: string;
  event: string;
  from_user_id: number;
  from_user_name: string;
  from_user_image: string;
}

export interface Notification {
  id: string;
  data: NotificationData;
  read_at: string | null;
}

export interface NotificationsListResponse {
  status: string;
  message: string;
  notifications: {
    current_page: number;
    data: Notification[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface UnreadNotificationsResponse {
  status: boolean;
  message: string;
  notifications: Notification[];
}

export interface MarkNotificationReadResponse {
  status: boolean;
  message: string;
}

export const notificationApi = {
  getAllNotifications: async (): Promise<NotificationsListResponse> => {
    const response = await api.get('/notifications/list');
    return response.data;
  },
  getUnreadNotifications: async (): Promise<UnreadNotificationsResponse> => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },
  markNotificationRead: async (id: string): Promise<MarkNotificationReadResponse> => {
    const response = await api.post(`/notifications/read/${id}`);
    return response.data;
  },
  markAllNotificationsRead: async (): Promise<MarkNotificationReadResponse> => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },
  markMultipleNotificationsRead: async (ids: string[]): Promise<MarkNotificationReadResponse> => {
    const response = await api.post('/notifications/read-multiple', { ids });
    return response.data;
  },
};

export const updateUser = async (
  userId: number,
  data: {
    name: string;
    email: string;
    phone: string;
    role_id: string;
    address: string;
    city_id: string;
    state_id: string;
    country_id: string;
    postal_code: string;
    department_id: string;
    profile_image?: { uri: string; name: string; type: string } | null;
  }
): Promise<{ status: string; message: string }> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('role_id', data.role_id);
  formData.append('address', data.address);
  formData.append('city_id', data.city_id);
  formData.append('state_id', data.state_id);
  formData.append('country_id', data.country_id);
  formData.append('postal_code', data.postal_code);
  formData.append('department_id', data.department_id);
  if (data.profile_image) {
    formData.append('profile_image', data.profile_image as any);
  }
  const response = await api.post(`/user/update/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json',
    },
  });
  return response.data;
};

export default api; 