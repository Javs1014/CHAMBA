
import type { NavLinkItem } from '@/types';
import { LayoutDashboard, FileText, Users, Package, BarChartBig } from 'lucide-react';

export const navLinks: NavLinkItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/proformas', label: 'Proformas', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/stats', label: 'Billing Stats', icon: BarChartBig },
];
