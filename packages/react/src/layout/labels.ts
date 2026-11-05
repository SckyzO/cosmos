// The English the layout components write, their part of `CosmosLabels` (`englishLabels`).

export type ShellLabels = {
  /** Name of the drawer the sidebar becomes below `lg`. Default `Navigation menu`. */
  navigationMenu: string;
};

export type SidebarLabels = {
  /** Name of the navigation landmark. Default `Main navigation`. */
  landmark: string;
  /** Tooltip of the edge strip while the sidebar is collapsed. Default `Expand sidebar`. */
  expand: string;
  /** Tooltip of the edge strip while the sidebar is expanded. Default `Collapse sidebar`. */
  collapse: string;
  /** Name of the close button `Sidebar.Brand` gets in the drawer. Default `Close navigation`. */
  closeNavigation: string;
  /** Name of the button that unfolds a sub-menu that has a page of its own, from its label. Default `Reports sub-menu`. */
  subMenu: (label: string) => string;
};

export type SidebarToggleLabels = {
  /** Name of the toggle that opens the drawer below `lg`. Default `Open navigation`. */
  open: string;
  /** Name of the toggle that closes the drawer. Default `Close navigation`. */
  close: string;
  /** Name of the toggle while the sidebar is collapsed. Default `Expand sidebar`. */
  expand: string;
  /** Name of the toggle while the sidebar is expanded. Default `Collapse sidebar`. */
  collapse: string;
  /** The text of the `panel` variant in the drawer. Default `Close`. */
  closeText: string;
  /** The text of the `panel` variant while the sidebar is expanded. Default `Collapse`. */
  collapseText: string;
};

export type SiteFooterLabels = {
  /** Name of the `nav` of the legal links of `SiteFooter.Bottom`. Default `Legal`. */
  legalLinks: string;
};

export type TopbarLabels = {
  /** Name of the button and of the menu that hold `moreActions` below `sm`. Default `More actions`. */
  moreActions: string;
};

export const SHELL_LABELS: ShellLabels = { navigationMenu: 'Navigation menu' };

export const SIDEBAR_LABELS: SidebarLabels = {
  landmark: 'Main navigation',
  expand: 'Expand sidebar',
  collapse: 'Collapse sidebar',
  closeNavigation: 'Close navigation',
  subMenu: (label) => `${label} sub-menu`,
};

export const SIDEBAR_TOGGLE_LABELS: SidebarToggleLabels = {
  open: 'Open navigation',
  close: 'Close navigation',
  expand: 'Expand sidebar',
  collapse: 'Collapse sidebar',
  closeText: 'Close',
  collapseText: 'Collapse',
};

export const SITE_FOOTER_LABELS: SiteFooterLabels = { legalLinks: 'Legal' };

export const TOPBAR_LABELS: TopbarLabels = { moreActions: 'More actions' };
