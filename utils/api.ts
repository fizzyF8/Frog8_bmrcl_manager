import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  name: string;
  email: string;
  phone: string;
  organization_id: number;
  organization_name: string;
  role: string;
  status: string;
  city_id: number;
  city: string;
  state_id: number;
  state: string;
  country_id: number;
  country: string;
}

export interface ProfileResponse {
  status: string;
  message: string;
  user: UserProfile;
}

export interface LocationDetails {
  station: string;
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
}

export interface CheckOutRequest {
  attendance_id: number;
  user_shift_assignment_id: number;
  check_out_latitude: string;
  check_out_longitude: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', {
      email,
      password,
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
};

export const tvmApi = {
  getTVMs: async (): Promise<TVMsResponse> => {
    const response = await api.get('/devices/list');
    return response;
  },

  getTVM: async (id: number): Promise<TVMResponse> => {
    const response = await api.get<TVMResponse>(`/devices/show/${id}`);
    return response.data;
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
  checkInAttendance: async (data: CheckInRequest) => {
    const response = await api.post('/assign_shift/attendance/checkin', data);
    return response.data;
  },
  checkOutAttendance: async (data: CheckOutRequest) => {
    const response = await api.post('/assign_shift/attendance/checkout', data);
    return response.data;
  },
};

export default api; 