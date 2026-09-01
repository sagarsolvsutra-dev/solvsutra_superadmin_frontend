"use client";

import { useEffect, useState } from "react";
import { FiSave, FiLock, FiShield, FiKey } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { getErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function SettingsPage() {
  const toast = useToast();
  const { user, setAuth, token } = useAuthStore();
  const [profileData, setProfileData] = useState({ name: "", email: "", phone: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    if (!profileData.name || !profileData.email) {
      toast.error("Name and Email are required");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await userService.update(user._id, profileData);
      const updatedUser = { ...user, ...res.data.user };
      if (token) setAuth(token, updatedUser);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" description="Manage your account settings and preferences" />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <FiShield className="h-5 w-5" /> Profile Information
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Name" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} required />
            <Input
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="9876543210"
            />
            <Input label="Role" value={user?.role?.replace("_", " ") || ""} disabled />
          </div>
          <div className="mt-4">
            <Button onClick={handleProfileUpdate} loading={savingProfile} icon={<FiSave className="h-4 w-4" />}>
              Update Profile
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <FiLock className="h-5 w-5" /> Change Password
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <PasswordInput
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
            />
            <PasswordInput
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
            />
            <PasswordInput
              label="Confirm Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
            />
          </div>
          <div className="mt-4">
            <Button onClick={handlePasswordChange} loading={savingPassword} icon={<FiSave className="h-4 w-4" />}>
              Update Password
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <FiKey className="h-5 w-5" /> System Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-slate-500">Backend API</span>
              <p className="mt-1 font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-slate-500">Environment</span>
              <p className="mt-1 font-medium">{process.env.NODE_ENV === "production" ? "Production" : "Development"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-slate-500">Last Login</span>
              <p className="mt-1 font-medium">{user?.lastLogin ? formatDateTime(user.lastLogin) : "N/A"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-slate-500">Account Created</span>
              <p className="mt-1 font-medium">{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
