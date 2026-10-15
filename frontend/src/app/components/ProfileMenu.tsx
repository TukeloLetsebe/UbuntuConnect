// Profile pill + dropdown shown in every dashboard header. The trigger shows
// the avatar, the display name and a chevron so it reads clearly as a menu.
// Presentational only: the parent passes the name, optional extras and the
// callbacks, so no routing/auth behaviour changes here.

import { Link } from "react-router";
import { LogOut, Settings, Eye, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface ProfileMenuProps {
  /** Display name — org name, contact person, or full name. */
  name: string;
  /** Shown under the name (we pass the email). */
  subtitle?: string;
  /** Small role tag inside the menu header, e.g. "NPO" / "Admin". */
  roleLabel?: string;
  /** Opens the Account Settings tab. Omit for roles without one (Admin). */
  onProfile?: () => void;
  /** Optional extra link, e.g. NPO "View Public Profile". */
  extraLink?: { to: string; label: string };
  onLogout: () => void;
}

/** Build up-to-two-letter initials from a display name. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileMenu({
  name,
  subtitle,
  roleLabel,
  onProfile,
  extraLink,
  onLogout,
}: ProfileMenuProps) {
  const initials = initialsFrom(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2.5 outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[9rem] truncate text-sm font-medium text-neutral-800">
            {name}
          </span>
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0">
        {/* Header: avatar + name + email + role tag */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-neutral-100">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{name}</p>
            {subtitle && (
              <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
            )}
            {roleLabel && (
              <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        <div className="p-1">
          {extraLink && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={extraLink.to}>
                <Eye className="w-4 h-4" />
                {extraLink.label}
              </Link>
            </DropdownMenuItem>
          )}
          {onProfile && (
            <DropdownMenuItem onClick={onProfile} className="cursor-pointer">
              <Settings className="w-4 h-4" />
              Account Settings
            </DropdownMenuItem>
          )}

          {(onProfile || extraLink) && <DropdownMenuSeparator />}

          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
