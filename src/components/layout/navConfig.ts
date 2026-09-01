import {
  FiGrid,
  FiUsers,
  FiFolder,
  FiLayers,
  FiCreditCard,
  FiFileText,
  FiServer,
  FiGlobe,
  FiUserCheck,
  FiBriefcase,
  FiBell,
} from "react-icons/fi";
import type { IconType } from "react-icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
};

export type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: FiGrid }],
  },
  {
    id: "client-billing",
    title: "Client & Billing",
    items: [
      { label: "Clients", href: "/clients", icon: FiUsers },
      { label: "Projects", href: "/projects", icon: FiFolder },
      { label: "Plans", href: "/plans", icon: FiLayers },
      { label: "Subscriptions", href: "/subscriptions", icon: FiCreditCard },
      { label: "Payments", href: "/payments", icon: FiFileText },
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    items: [
      { label: "Servers", href: "/servers", icon: FiServer },
      { label: "Domains", href: "/domains", icon: FiGlobe },
    ],
  },
  {
    id: "team-alerts",
    title: "Team & Alerts",
    items: [
      { label: "Users", href: "/users", icon: FiUserCheck },
      { label: "Employees", href: "/employees", icon: FiBriefcase },
      { label: "Notifications", href: "/notifications", icon: FiBell },
    ],
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const match = group.items.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
    if (match) return match;
  }
  return undefined;
}
