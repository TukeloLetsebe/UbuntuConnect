// Shared dashboard sidebar: grouped nav with uppercase section headers, an
// active pill + left accent bar, a pinned bottom account group, and a desktop
// collapse (icon-only rail) remembered in localStorage. Used by every role so
// the four dashboards stay identical. Behaviour is driven entirely by props —
// it never touches routing or data.

import { useState, type ComponentType } from "react";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface SidebarItem {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Optional count; renders a badge (pill expanded, dot collapsed) when > 0. */
  badge?: number;
}

export interface SidebarGroup {
  heading: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  groups: SidebarGroup[];
  /** Account items pinned at the bottom (e.g. Verification, Profile Settings). */
  bottomItems: SidebarItem[];
  activeTab: string;
  onSelect: (id: string) => void;
  /** Mobile drawer open state (controlled by the parent header hamburger). */
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** localStorage key for remembering the desktop collapsed state. */
  storageKey: string;
  /** Active-state accent colour family. Admin uses purple; the rest orange. */
  accent?: "orange" | "purple";
}

export default function DashboardSidebar({
  groups,
  bottomItems,
  activeTab,
  onSelect,
  mobileOpen,
  onMobileClose,
  storageKey,
  accent = "orange",
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });
  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c;
    try { localStorage.setItem(storageKey, next ? "1" : "0"); } catch { /* ignore */ }
    return next;
  });

  const activeClasses = accent === "purple"
    ? "bg-purple-50 text-purple-600 before:bg-purple-600"
    : "bg-orange-50 text-orange-600 before:bg-orange-600";
  const badgeBg = accent === "purple" ? "bg-purple-600" : "bg-orange-600";

  const itemClass = (id: string) =>
    `relative w-full shrink-0 flex items-center gap-3 ${collapsed ? "lg:justify-center lg:px-0" : ""} px-3 py-2 rounded-xl text-sm transition-colors ${
      activeTab === id
        ? `${activeClasses} font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full`
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
    }`;

  const renderItem = (item: SidebarItem) => {
    const badge = item.badge ?? 0;
    return (
      <button key={item.id} onClick={() => onSelect(item.id)} title={collapsed ? item.label : undefined} className={itemClass(item.id)}>
        <span className="relative shrink-0">
          <item.icon className="w-5 h-5" />
          {badge > 0 && collapsed && <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${badgeBg} ring-2 ring-white`} />}
        </span>
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {badge > 0 && !collapsed && <span className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full ${badgeBg} text-white text-xs font-semibold leading-5 text-center`}>{badge}</span>}
      </button>
    );
  };

  return (
    <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-all duration-200 fixed lg:static top-0 left-0 z-40 lg:z-30 w-60 ${collapsed ? "lg:w-16" : "lg:w-60"} shrink-0 bg-white border-r border-neutral-200 h-screen lg:h-full flex flex-col`}>
      <div className="flex justify-between items-center p-4 lg:hidden border-b border-neutral-100">
        <span className="font-bold">Menu</span>
        <button onClick={onMobileClose} aria-label="Close menu"><X className="w-5 h-5" /></button>
      </div>

      {/* Scrollable grouped nav; min-h-0 lets overflow-y-auto work in the flex
          column, and sidebar-scroll hides the thin scrollbar. */}
      <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3 py-4 space-y-5">
        {groups.map(group => (
          <div key={group.heading}>
            {!collapsed && <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase mb-2 px-3">{group.heading}</p>}
            <div className="space-y-1">{group.items.map(renderItem)}</div>
          </div>
        ))}
      </nav>

      {/* Pinned bottom: account items + desktop collapse toggle. */}
      <div className="border-t border-neutral-100 p-3 space-y-1">
        {bottomItems.map(renderItem)}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden lg:flex w-full items-center gap-3 ${collapsed ? "justify-center px-0" : ""} px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 transition-colors`}
        >
          {collapsed
            ? <ChevronsRight className="w-5 h-5 shrink-0" />
            : <><ChevronsLeft className="w-5 h-5 shrink-0" /> <span className="flex-1 text-left">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
