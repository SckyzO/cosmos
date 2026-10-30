import type { ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Button,
  COSMOS_ACCENTS,
  HealthDot,
  Input,
  SegmentedControl,
  StatusBadge,
  Toggle,
  TrendDelta,
} from '../../../../packages/react/src';
import { Sparkline } from '../../../../packages/charts/src';
import { cx } from './styles';

// A small preview per sidebar group, made of real components. A group card is one link, and a link
// must not hold interactive elements: the card makes the preview `inert` and `aria-hidden`.

const Bar = ({ className, brand = false }: { className: string; brand?: boolean }) => (
  <span
    className={cx(
      'block rounded-sm',
      brand ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600',
      className
    )}
  />
);

const Row = ({ children }: { children: ReactNode }) => (
  <span className="flex flex-wrap items-center gap-2">{children}</span>
);

const SPARK = [12, 18, 15, 24, 22, 31, 28, 38];

const PREVIEW: Record<string, ReactNode> = {
  Foundations: (
    <Row>
      <span className="text-xl font-semibold">Aa</span>
      {COSMOS_ACCENTS.slice(0, 5).map((a) => (
        <span key={a.id} className="size-4 rounded-full" style={{ backgroundColor: a.hex }} />
      ))}
    </Row>
  ),
  Typography: (
    <span className="flex flex-col">
      <span className="text-lg font-semibold">Heading</span>
      <span className="text-xs">Body text with a link</span>
    </span>
  ),
  Atoms: (
    <Row>
      <Button size="sm">Button</Button>
      <Badge intent="success">Active</Badge>
      <Avatar name="Ana Costa" size="sm" />
    </Row>
  ),
  Actions: (
    <Row>
      <Button size="sm" variant="secondary">
        Refresh
      </Button>
      <Button size="sm" intent="success">
        Saved
      </Button>
    </Row>
  ),
  Forms: (
    <span className="flex w-full flex-col gap-2">
      <Input size="sm" placeholder="Email address" aria-label="Email address" />
      <Toggle size="sm" defaultChecked label="Notifications" />
    </span>
  ),
  Data: (
    <Row>
      <span className="text-xl font-semibold tabular-nums">€12.4M</span>
      <TrendDelta size="sm" value={8.1} />
    </Row>
  ),
  Media: (
    <span className="rounded-md bg-gray-900 px-2 py-1.5 font-mono text-xs text-gray-100">
      const x = 42;
    </span>
  ),
  Status: (
    <Row>
      <StatusBadge status="OK" size="sm" />
      <StatusBadge status="WARN" size="sm" />
      <StatusBadge status="CRIT" size="sm" />
    </Row>
  ),
  Monitoring: (
    <span className="grid grid-cols-10 gap-1">
      {Array.from({ length: 20 }, (_, i) => (
        <HealthDot key={i} status={i === 7 ? 'WARN' : i === 14 ? 'CRIT' : 'OK'} />
      ))}
    </span>
  ),
  Feedback: <Badge intent="success">Changes saved</Badge>,
  Overlays: (
    <span className="flex w-24 flex-col gap-1.5 rounded-lg border border-[var(--color-border)] p-2 shadow-md">
      <Bar className="h-1.5 w-2/3" />
      <Bar className="h-1.5" />
      <Bar brand className="ms-auto h-3 w-8" />
    </span>
  ),
  Navigation: (
    <Row>
      <span className="text-brand-600 dark:text-brand-400 border-brand-500 border-b-2 pb-0.5 text-xs font-medium">
        Overview
      </span>
      <span className="text-xs">Activity</span>
      <span className="text-xs">Settings</span>
    </Row>
  ),
  Layout: (
    <span className="flex h-12 w-28 gap-1">
      <Bar className="w-5 shrink-0" />
      <span className="flex flex-1 flex-col gap-1">
        <Bar className="h-2" />
        <Bar className="h-full opacity-60" />
      </span>
    </span>
  ),
  Lists: (
    <span className="flex flex-col gap-1.5">
      {['Ana Costa', 'Li Wei'].map((name) => (
        <Row key={name}>
          <Avatar name={name} size="xs" />
          <Bar className="h-1.5 w-16" />
        </Row>
      ))}
    </span>
  ),
  Chat: (
    <span className="flex flex-col gap-1.5 text-xs">
      <span className="self-start rounded-lg bg-gray-200 px-2 py-1 dark:bg-gray-700">
        Where is my invoice?
      </span>
      <span className="bg-brand-600 self-end rounded-lg px-2 py-1 text-white">Under Billing</span>
    </span>
  ),
  Tables: (
    <span className="flex w-28 flex-col gap-1">
      {[0, 1, 2, 3].map((row) => (
        <Bar key={row} className="h-2" />
      ))}
    </span>
  ),
  Settings: (
    <SegmentedControl
      size="sm"
      aria-label="Theme"
      defaultValue="light"
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' },
      ]}
    />
  ),
  Charts: <Sparkline data={SPARK} height={40} />,
};

/** The preview of a sidebar group; a group with none (a new one) shows nothing. */
export const GroupPreview = ({ group }: { group: string }) => <>{PREVIEW[group] ?? null}</>;
