export type AdminTeamRoleKey =
  | "super_admin"
  | "cofounder"
  | "cto"
  | "support"
  | "admin";

export type AdminTeamMemberStatus = "active" | "pending";

export type AdminTeamMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  initials: string;
  roleKey: AdminTeamRoleKey;
  roleLabel: string;
  status: AdminTeamMemberStatus;
  joinedAt: string | null;
  invitedAt: string | null;
  isCurrentUser: boolean;
};

export type AdminTeamResponse = {
  generatedAt: string;
  members: AdminTeamMember[];
  summary: {
    total: number;
    active: number;
    pending: number;
  };
  roles: Array<{
    key: AdminTeamRoleKey;
    label: string;
  }>;
};

export type AdminTeamErrorResponse = {
  success: false;
  message: string;
};
