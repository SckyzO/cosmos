import { createContext, useContext } from 'react';

/** The sidebar state a Shell shares with the Topbar, the Sidebar and every SidebarToggle in it. */
export type ShellContextValue = {
  /** Whether the Shell's sidebar is collapsed. */
  collapsed: boolean;
  /** Moves the sidebar to `collapsed`; the Shell reports it through its `onCollapsedChange`. */
  setCollapsed: (collapsed: boolean) => void;
  /** `id` of the Sidebar's `nav`, which the toggles name in `aria-controls`. */
  navId: string;
  /** Where the Shell puts its built-in toggle: in the Topbar or at the bottom of the Sidebar. */
  collapseControl: 'topbar' | 'sidebar';
};

/** Set by a Shell that has a sidebar; `null` anywhere else. Internal to the package. */
export const ShellContext = createContext<ShellContextValue | null>(null);

export const useShell = () => useContext(ShellContext);
