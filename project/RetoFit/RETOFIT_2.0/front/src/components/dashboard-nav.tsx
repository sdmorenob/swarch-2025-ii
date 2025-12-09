'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Trophy,
  UserCircle,
  Footprints,
  Dumbbell,
  Timer,
  MessageSquare,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/feed',
    label: 'Feed',
    icon: MessageSquare,
  },
  {
    href: '/dashboard/challenges',
    label: 'Challenges',
    icon: Trophy,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: UserCircle,
  },
  {
    name: 'Actividades',
    label: 'Registrar Actividad',
    href: '/dashboard/activities',
    icon: Dumbbell,
  },
  { 
    name: 'Logros',
    label: 'Logros',
    href: '/dashboard/achievements',
    icon: Footprints,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname === item.href}
              className="w-full"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
