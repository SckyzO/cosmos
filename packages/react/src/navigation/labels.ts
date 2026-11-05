// The English the navigation components write, their part of `CosmosLabels` (`englishLabels`).

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

export const BREADCRUMB_LABELS: BreadcrumbLabels = {
  landmark: 'Breadcrumb',
  home: 'Home',
  showHidden: (count) => `Show ${count} more ${count === 1 ? 'page' : 'pages'}`,
  hiddenMenu: 'Hidden pages',
};
