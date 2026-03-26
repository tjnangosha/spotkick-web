import {
  LayoutDashboard,
  Users,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Players",
    href: "/dashboard/players",
    icon: Users,
  },
];

export const userMenuItems = [
  {
    title: "Account Settings",
    href: "/dashboard/settings",
  },
  {
    title: "Logout",
    href: "/logout",
  },
];
