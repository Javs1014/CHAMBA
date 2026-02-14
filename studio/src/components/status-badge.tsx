import type { ProformaStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ProformaStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<ProformaStatus, string> = {
    DRAFT: 'bg-yellow-500 hover:bg-yellow-600', // Muted yellow
    SENT: 'bg-blue-500 hover:bg-blue-600',     // Primary blue
    REVIEWED: 'bg-purple-500 hover:bg-purple-600',// Muted purple
    APPROVED: 'bg-green-500 hover:bg-green-600', // Success green
    REJECTED: 'bg-red-500 hover:bg-red-600',   // Destructive red
  };

  return (
    <Badge
      className={cn(
        'text-xs font-semibold text-white', // Use white text for better contrast on colored badges
        statusColors[status] || 'bg-gray-400 hover:bg-gray-500' // Default gray
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
}
