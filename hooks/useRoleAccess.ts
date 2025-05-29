import { useAuth } from '@/context/auth';
import { UserRole, UserRoleId } from '@/types';

// Map role strings to role IDs
const ROLE_TO_ID_MAP: Record<string, UserRoleId> = {
  'Admin': UserRoleId.ADMIN,
  'CEO': UserRoleId.CEO,
  'Manager': UserRoleId.MANAGER,
  'Team Lead': UserRoleId.TEAM_LEAD,
  'Public Relations': UserRoleId.PUBLIC_RELATIONS,
};

// Define permissions for each role ID
const ROLE_PERMISSIONS = {
  [UserRoleId.ADMIN]: {
    canAccessDashboard: true,
    canAccessTasks: true,
    canAccessAttendance: false,
    canAccessLeaderboard: true,
    canManageUsers: true,
    canManageShifts: true,
    canViewReports: true,
    canManagePublicRelations: true,
    canManageTeams: true,
    canManageOrganization: false,
  },
  [UserRoleId.CEO]: {
    canAccessDashboard: true,
    canAccessTasks: true,
    canAccessAttendance: false,
    canAccessLeaderboard: true,
    canManageUsers: true,
    canManageShifts: true,
    canViewReports: true,
    canManagePublicRelations: true,
    canManageTeams: true,
    canManageOrganization: true,
  },
  [UserRoleId.MANAGER]: {
    canAccessDashboard: true,
    canAccessTasks: true,
    canAccessAttendance: false,
    canAccessLeaderboard: true,
    canManageUsers: false,
    canManageShifts: true,
    canViewReports: true,
    canManagePublicRelations: false,
    canManageTeams: true,
    canManageOrganization: false,
  },
  [UserRoleId.TEAM_LEAD]: {
    canAccessDashboard: true,
    canAccessTasks: true,
    canAccessAttendance: true,
    canAccessLeaderboard: true,
    canManageUsers: false,
    canManageShifts: false,
    canViewReports: false,
    canManagePublicRelations: false,
    canManageTeams: false,
    canManageOrganization: false,
  },
  [UserRoleId.PUBLIC_RELATIONS]: {
    canAccessDashboard: true,
    canAccessTasks: true,
    canAccessAttendance: true,
    canAccessLeaderboard: true,
    canManageUsers: false,
    canManageShifts: false,
    canViewReports: false,
    canManagePublicRelations: false,
    canManageTeams: false,
    canManageOrganization: false,
  },
};

export function useRoleAccess() {
  const { user } = useAuth();
  const userRoleId = user?.role ? ROLE_TO_ID_MAP[user.role] : undefined;

  console.log('useRoleAccess - User Role:', user?.role);
  console.log('useRoleAccess - User Role ID:', userRoleId);

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS[UserRoleId]) => {
    if (!userRoleId || !ROLE_PERMISSIONS[userRoleId]) {
      return false;
    }
    return ROLE_PERMISSIONS[userRoleId][permission];
  };

  return {
    hasPermission,
    userRole: user?.role,
    userRoleId,
    canAccessDashboard: hasPermission('canAccessDashboard'),
    canAccessTasks: hasPermission('canAccessTasks'),
    canAccessAttendance: hasPermission('canAccessAttendance'),
    canAccessLeaderboard: hasPermission('canAccessLeaderboard'),
    canManageUsers: hasPermission('canManageUsers'),
    canManageShifts: hasPermission('canManageShifts'),
    canViewReports: hasPermission('canViewReports'),
    canManagePublicRelations: hasPermission('canManagePublicRelations'),
    canManageTeams: hasPermission('canManageTeams'),
    canManageOrganization: hasPermission('canManageOrganization'),
  };
} 