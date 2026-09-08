import { Crown, Shield, ShieldCheck, Users, Building2, User as UserIcon } from 'lucide-react';
import type { UserRole } from '@shared/types';

interface RoleConfig {
  label: string;
  badgeClass: string;
  icon: typeof Crown;
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    icon: ShieldCheck,
  },
  admin: {
    label: 'Admin',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
    icon: Shield,
  },
  mandal_official: {
    label: 'Mandal Official',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
    icon: Building2,
  },
  sarpanch: {
    label: 'Sarpanch',
    badgeClass: 'bg-[#67001A] text-white border-[#520015] font-bold shadow-xs',
    icon: Crown,
  },
  ward_member: {
    label: 'Ward Member',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    icon: Users,
  },
  citizen: {
    label: 'Citizen',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    icon: UserIcon,
  },
};

export function UserRoleBadge({
  role,
  size = 'sm',
  showIcon = true,
}: {
  role: UserRole | string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}) {
  const config = ROLE_CONFIGS[role as UserRole] ?? {
    label: role ? role.replace('_', ' ') : 'User',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
    icon: UserIcon,
  };
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border uppercase tracking-wider ${config.badgeClass} ${sizeClasses}`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
}

export function UserProfileCapsule({
  user,
}: {
  user?: { name: string; role: UserRole | string; phone?: string | null } | null;
}) {
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs shadow-xs">
      <span className="font-semibold text-slate-800 max-w-[120px] sm:max-w-[180px] truncate">
        {user.name}
      </span>
      <span className="text-slate-300 hidden sm:inline">•</span>
      <UserRoleBadge role={user.role} size="xs" />
    </div>
  );
}
