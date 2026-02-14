'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { navLinks } from '@/config/links';
import type { NavLinkItem } from '@/types';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navLinks.map((link: NavLinkItem) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref>
            <SidebarMenuButton
              isActive={pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))}
              tooltip={link.label}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
