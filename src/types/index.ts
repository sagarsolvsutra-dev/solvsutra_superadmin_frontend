export type Role = 'super_admin' | 'admin' | 'developer' | 'accountant' | 'support';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape persisted in the auth store — same as `User`, aliased for clarity at call sites. */
export type AuthUser = User;

export interface Client {
  _id: string;
  clientId: string;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  projectId: string;
  clientId: string | Client;
  projectName: string;
  description?: string;
  frontendUrl?: string;
  adminUrl?: string;
  backendUrl?: string;
  repositoryUrl?: string;
  environment: 'development' | 'staging' | 'production';
  serverId?: string;
  apiKey: string;
  apiSecret?: string;
  status: 'active' | 'inactive' | 'suspended';
  techStack?: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  _id: string;
  planId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: 'day' | 'month' | 'year';
  features: string[];
  isFree: boolean;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  subscriptionId: string;
  clientId: string | Client;
  projectId: string | Project;
  planId: string | Plan;
  startDate: string;
  expiryDate: string;
  gracePeriodDays: number;
  gracePeriodEndDate?: string;
  autoRenew: boolean;
  status: 'pending' | 'active' | 'expiring' | 'expired' | 'grace_period' | 'suspended' | 'cancelled';
  renewalCount: number;
  lastRenewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  clientId: string | Client;
  projectId: string | Project;
  subscriptionId: string | Subscription;
  planId: string | Plan;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'success' | 'failed' | 'refunded';
  paymentMethod?: string;
  paidAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  notificationId: string;
  clientId?: string;
  projectId?: string;
  subscriptionId?: string;
  type: 'expiry_warning' | 'expired' | 'payment_success' | 'payment_failed' | 'subscription_renewed' | 'subscription_created' | 'subscription_suspended' | 'suspension' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  data?: any;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: string | User;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Server {
  _id: string;
  serverId: string;
  name: string;
  provider?: string;
  ipAddress?: string;
  hostname?: string;
  sshPort?: number;
  status: 'active' | 'inactive' | 'maintenance';
  os?: string;
  ram?: string;
  storage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Domain {
  _id: string;
  domainId: string;
  projectId?: string | Project;
  domain: string;
  type: 'main' | 'subdomain' | 'redirect';
  sslEnabled: boolean;
  sslExpiry?: string;
  provider?: string;
  dnsProvider?: string;
  nameservers?: string[];
  status: 'active' | 'pending' | 'expired' | 'suspended';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joinDate?: string;
  employmentStatus: 'active' | 'on_leave' | 'inactive';
  address?: string;
  userId?: string | { _id: string; name: string; email: string; role: Role };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  clients: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  projects: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  subscriptions: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    gracePeriod: number;
    suspended: number;
    expiringThisMonth: number;
  };
  payments: {
    total: number;
    success: number;
    pending: number;
    failed: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
}
