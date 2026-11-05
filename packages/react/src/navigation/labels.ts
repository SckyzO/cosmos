// The English the navigation components write, their part of `CosmosLabels` (`englishLabels`).

import { createElement, Fragment, type ReactNode } from 'react';

// Words around nodes: a label that holds a number to set apart is handed the number as a node.
const sentence = (...parts: ReactNode[]) => createElement(Fragment, null, ...parts);

export type BreadcrumbLabels = {
  /** Name of the navigation landmark when the host passes no `aria-label`. Default `Breadcrumb`. */
  landmark: string;
  /** Name of the Home icon `homeIcon` puts on the first crumb. Default `Home`. */
  home: string;
  /** Name of the "…" button that holds the folded crumbs. Default `Show 2 more pages`. */
  showHidden: (count: number) => string;
  /** Name of the menu of folded crumbs. Default `Hidden pages`. */
  hiddenMenu: string;
};

export type NavbarLabels = {
  /** The menu that takes the items that do not fit. Default `More`. */
  more: string;
  /** Name of `Navbar.MobileMenuButton`. Default `Toggle menu`. */
  toggleMenu: string;
};

export type PaginationLabels = {
  /** Name of the landmark when the host passes no `aria-label`. Default `Pagination`. */
  landmark: string;
  /**
   * The info with `showAll`, "Showing all 95 results". The number arrives as a node, set apart
   * (medium weight): put it in your own words and it keeps that emphasis.
   */
  showingAll: (total: ReactNode) => ReactNode;
  /** The info, "Showing 1 to 10 of 95". The three numbers arrive as nodes, set apart. */
  showing: (from: ReactNode, to: ReactNode, total: ReactNode) => ReactNode;
  /** The button that goes back to the pages. Default `Show paginated`. */
  showPaginated: string;
  /** The button that puts every result on one page. Default `Show all`. */
  showAll: string;
  /** Name of the button to the first page. Default `First page`. */
  first: string;
  /** Name of the previous button. Default `Previous page`. */
  previous: string;
  /** Name of the next button. Default `Next page`. */
  next: string;
  /** Name of the button to the last page. Default `Last page`. */
  last: string;
  /** The word beside the chevron with `prevNextLabel="text"`. Default `Previous`. */
  previousText: string;
  /** The word beside the chevron with `prevNextLabel="text"`. Default `Next`. */
  nextText: string;
  /** Name of the button of a page. Default `Page 3`. */
  page: (page: number) => string;
  /** The position of the `compact` variant, "Page 2 of 9". The numbers arrive as nodes, set apart. */
  pageOf: (page: ReactNode, total: ReactNode) => ReactNode;
  /** The position below `sm`, "Page 2 / 9". The numbers arrive as nodes, set apart. */
  pageOfShort: (page: ReactNode, total: ReactNode) => ReactNode;
};

export type RecordPagerLabels = {
  /** What the list holds, in the singular, when the host gives no `noun`. Default `record`. */
  noun: string;
  /** Name of the previous button, from the `noun`. Default `Previous record`. */
  previous: (noun: string) => string;
  /** Name of the next button, from the `noun`. Default `Next record`. */
  next: (noun: string) => string;
  /** The "Back to list" link. Default `Back to list`. */
  back: string;
  /**
   * The position, "12 of 340" by default. Receives the 1-indexed position and the total as nodes,
   * already set apart (medium weight, primary color) as in the English default: put them in your
   * own words, `(position, total) => <>{position} sur {total}</>`, and they keep that emphasis in
   * any language.
   */
  count: (position: ReactNode, total: ReactNode) => ReactNode;
  /** Name of the landmark when the host passes no `aria-label`, from the `noun`. Default `Record navigation`. */
  landmark: (noun: string) => string;
};

export type StepperLabels = {
  /** Name of the list of steps. Default `Progress`. */
  progress: string;
  /** The "Step 2" above a step of the `bars` variant, from its 1-based number. Default `Step 2`. */
  step: (step: number) => string;
};

export type StickyScrollNavLabels = {
  /** Name of the jump menu shown below `sm`. Default `Jump to section`. */
  jump: string;
};

export type VerticalNavigationLabels = {
  /** Name of the navigation landmark when the host passes no `aria-label`. Default `Sidebar`. */
  landmark: string;
};

export const BREADCRUMB_LABELS: BreadcrumbLabels = {
  landmark: 'Breadcrumb',
  home: 'Home',
  showHidden: (count) => `Show ${count} more ${count === 1 ? 'page' : 'pages'}`,
  hiddenMenu: 'Hidden pages',
};

export const NAVBAR_LABELS: NavbarLabels = { more: 'More', toggleMenu: 'Toggle menu' };

export const PAGINATION_LABELS: PaginationLabels = {
  landmark: 'Pagination',
  showingAll: (total) => sentence('Showing all ', total, ' results'),
  showing: (from, to, total) => sentence('Showing ', from, ' to ', to, ' of ', total),
  showPaginated: 'Show paginated',
  showAll: 'Show all',
  first: 'First page',
  previous: 'Previous page',
  next: 'Next page',
  last: 'Last page',
  previousText: 'Previous',
  nextText: 'Next',
  page: (page) => `Page ${page}`,
  pageOf: (page, total) => sentence('Page ', page, ' of ', total),
  pageOfShort: (page, total) => sentence('Page ', page, ' / ', total),
};

export const RECORD_PAGER_LABELS: RecordPagerLabels = {
  noun: 'record',
  previous: (noun) => `Previous ${noun}`,
  next: (noun) => `Next ${noun}`,
  back: 'Back to list',
  count: (position, total) => sentence(position, ' of ', total),
  landmark: (noun) => `${noun.charAt(0).toUpperCase()}${noun.slice(1)} navigation`,
};

export const STEPPER_LABELS: StepperLabels = {
  progress: 'Progress',
  step: (step) => `Step ${step}`,
};

export const STICKY_SCROLL_NAV_LABELS: StickyScrollNavLabels = { jump: 'Jump to section' };

export const VERTICAL_NAVIGATION_LABELS: VerticalNavigationLabels = { landmark: 'Sidebar' };
