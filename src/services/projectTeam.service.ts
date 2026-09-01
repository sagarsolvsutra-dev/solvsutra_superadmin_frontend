import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";

export type AssignmentRole =
  | "project_manager"
  | "developer"
  | "designer"
  | "tester"
  | "devops"
  | "support"
  | "other";

export type MilestoneStatus = "planned" | "in_progress" | "completed" | "blocked";

export interface AssignedUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ProjectAssignment {
  _id: string;
  assignmentId: string;
  projectId: string;
  userId: AssignedUser | null;
  role: AssignmentRole;
  allocationPercent: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  assignedBy?: AssignedUser | null;
  createdAt: string;
}

export interface ProjectMilestone {
  _id: string;
  milestoneId: string;
  projectId: string;
  title: string;
  description?: string;
  date: string;
  status: MilestoneStatus;
  completedAt?: string;
  ownerId?: AssignedUser | null;
  createdBy?: AssignedUser | null;
  createdAt: string;
}

export interface StaffSummary {
  [projectId: string]: { staffCount: number; totalAllocation: number };
}

export const projectTeamService = {
  // --- staff ---
  listStaff: (projectId: string, includeInactive = false) =>
    api
      .get(API_ENDPOINTS.PROJECT_STAFF(projectId), {
        params: includeInactive ? { includeInactive: "true" } : undefined,
      })
      .then((r) => r.data as {
        assignments: ProjectAssignment[];
        count: number;
        activeCount: number;
        totalAllocation: number;
      }),

  assignStaff: (projectId: string, payload: Record<string, unknown>) =>
    api.post(API_ENDPOINTS.PROJECT_STAFF(projectId), payload),

  updateAssignment: (projectId: string, assignmentId: string, payload: Record<string, unknown>) =>
    api.put(API_ENDPOINTS.PROJECT_STAFF_BY_ID(projectId, assignmentId), payload),

  removeAssignment: (projectId: string, assignmentId: string) =>
    api.delete(API_ENDPOINTS.PROJECT_STAFF_BY_ID(projectId, assignmentId)),

  /** Staff counts for every project at once — used by the projects list. */
  staffSummary: () =>
    api.get(API_ENDPOINTS.PROJECT_STAFF_SUMMARY).then((r) => r.data.summary as StaffSummary),

  userProjects: (userId: string) =>
    api.get(API_ENDPOINTS.USER_PROJECTS(userId)).then((r) => r.data),

  // --- timeline ---
  listMilestones: (projectId: string) =>
    api.get(API_ENDPOINTS.PROJECT_MILESTONES(projectId)).then((r) => r.data as {
      milestones: ProjectMilestone[];
      count: number;
      counts: Record<MilestoneStatus, number>;
      progress: number;
    }),

  createMilestone: (projectId: string, payload: Record<string, unknown>) =>
    api.post(API_ENDPOINTS.PROJECT_MILESTONES(projectId), payload),

  updateMilestone: (projectId: string, milestoneId: string, payload: Record<string, unknown>) =>
    api.put(API_ENDPOINTS.PROJECT_MILESTONE_BY_ID(projectId, milestoneId), payload),

  deleteMilestone: (projectId: string, milestoneId: string) =>
    api.delete(API_ENDPOINTS.PROJECT_MILESTONE_BY_ID(projectId, milestoneId)),
};

export const ASSIGNMENT_ROLE_LABELS: Record<AssignmentRole, string> = {
  project_manager: "Project Manager",
  developer: "Developer",
  designer: "Designer",
  tester: "Tester",
  devops: "DevOps",
  support: "Support",
  other: "Other",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};
