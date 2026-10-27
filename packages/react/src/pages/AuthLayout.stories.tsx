import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import { expect, fn } from 'storybook/test';
import {
  expectNoHorizontalOverflow,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { Button } from '../ui/Button';
import { Input } from '../forms/Input';
import { PasswordInput } from '../forms/PasswordInput';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';

const meta = {
  title: 'Pages/Auth/Auth Layout',
  component: AuthLayout,
  parameters: portalDocsParams(600),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const FormPlaceholder = () => (
  <div className="space-y-4">
    <Input label="Username" placeholder="admin" autoComplete="username" />
    <PasswordInput label="Password" autoComplete="current-password" />
    <Button className="w-full">Sign in</Button>
  </div>
);

// Local pictures, never a remote URL: captures cut every request to another origin.
const DARK_PHOTO = new URL('../storybook-assets/snow-mountain-under-stars.jpg', import.meta.url)
  .href;
const LIGHT_PHOTO = new URL('../storybook-assets/pale-dunes.svg', import.meta.url).href;

const SignIn = () => <SignInForm signUpHref="#" onForgotPassword={fn()} onSubmit={fn()} />;

// ── Stories ──────────────────────────────────────────────────────────────────

export const FormOnly: Story = {
  render: () => (
    <AuthLayout>
      <FormPlaceholder />
    </AuthLayout>
  ),
};

export const WithBrand: Story = {
  render: () => (
    <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
      <FormPlaceholder />
    </AuthLayout>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <AuthLayout title="Welcome back">
      <FormPlaceholder />
    </AuthLayout>
  ),
};

export const CustomBrand: Story = {
  render: () => (
    <AuthLayout
      brand={
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Sparkles className="text-brand-500 h-10 w-10" aria-hidden />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">cosmos</h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase dark:text-gray-400">
            design system
          </p>
        </div>
      }
    >
      <FormPlaceholder />
    </AuthLayout>
  ),
};

// ── Variants ─────────────────────────────────────────────────────────────────

export const Split: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthLayout
      variant="split"
      logo={Activity}
      title="Cosmos Cloud"
      subtitle="Monitor every rack, node and alert from one place."
    >
      <SignIn />
    </AuthLayout>
  ),
};

export const SplitCustomAside: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthLayout
      variant="split"
      logo={Activity}
      title="Cosmos Cloud"
      subtitle="Sign in to continue"
      aside={
        <figure className="max-w-sm text-white">
          <blockquote className="text-2xl leading-snug font-semibold">
            &ldquo;We found the failing rack in minutes, not hours.&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-base">Ana Ruiz, platform lead at Orbit</figcaption>
        </figure>
      }
    >
      <SignIn />
    </AuthLayout>
  ),
};

export const SplitAsideAtStart: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthLayout
      variant="split"
      asidePosition="start"
      logo={Activity}
      title="Cosmos Cloud"
      subtitle="Monitor every rack, node and alert from one place."
    >
      <SignIn />
    </AuthLayout>
  ),
};

export const CoverPhoto: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthLayout variant="cover" cover={{ src: DARK_PHOTO }} logo={Activity} title="Cosmos Cloud">
      <SignIn />
    </AuthLayout>
  ),
};

export const CoverLightPhoto: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthLayout variant="cover" cover={{ src: LIGHT_PHOTO }} logo={Activity} title="Cosmos Cloud">
      <SignIn />
    </AuthLayout>
  ),
};

export const CoverNoPhoto: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthLayout variant="cover" logo={Activity} title="Cosmos Cloud">
      <SignIn />
    </AuthLayout>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RendersCardAndBrand: Story = {
  tags: ['!dev'],
  render: () => (
    <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
      <FormPlaceholder />
    </AuthLayout>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Cosmos')).toBeInTheDocument();
    await expect(canvas.getByText(/sign in to continue/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText('Username')).toBeInTheDocument();
  },
};

export const CardVariantIsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <div data-testid="implicit">
        <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
          <FormPlaceholder />
        </AuthLayout>
      </div>
      <div data-testid="explicit">
        <AuthLayout variant="card" logo={Activity} title="Cosmos" subtitle="Sign in to continue">
          <FormPlaceholder />
        </AuthLayout>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    // `useId` gives each field its own id: the rest of the markup must be identical.
    const markup = (id: string) =>
      canvas.getByTestId(id).innerHTML.replace(/_r_[0-9a-z]+_/g, '_id_');
    await expect(markup('explicit')).toBe(markup('implicit'));
  },
};

const oneHeading = async (canvas: { getAllByRole: (role: string, o: object) => HTMLElement[] }) => {
  const h1s = canvas.getAllByRole('heading', { level: 1 });
  await expect(h1s).toHaveLength(1);
  await expect(h1s[0]).toHaveTextContent('Sign in');
};

// The form carries the page's h1: the built-in title is a paragraph in the card too.
export const CardHasOneHeading: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <AuthLayout logo={Activity} title="Cosmos Cloud" subtitle="Sign in to continue">
      <SignIn />
    </AuthLayout>
  ),
  play: async ({ canvas }) => {
    await oneHeading(canvas);
    await expect(canvas.getByText('Cosmos Cloud').tagName).toBe('P');
  },
};

export const SplitShowsAsideFromLg: Story = {
  ...Split,
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas, canvasElement }) => {
    await oneHeading(canvas);
    const aside = canvasElement.querySelector('aside') as HTMLElement;
    await expect(aside).toBeVisible();
    // The brand title is in the aside only: the form column's copy is hidden.
    const titles = canvas.getAllByText('Cosmos Cloud');
    await expect(titles.filter((el) => el.checkVisibility())).toHaveLength(1);
    await expect(aside.getBoundingClientRect().width).toBeCloseTo(window.innerWidth / 2, -1);
    // White text on the accent panel holds 4.5:1 in every theme: brand-600 is checked by name in
    // `packages/theme/scripts/check-contrast.mjs`; here the panel must really draw brand-600.
    inEachTheme(() => {
      const probe = document.createElement('span');
      probe.className = 'bg-brand-600';
      document.body.append(probe);
      const brand = getComputedStyle(probe).backgroundColor;
      probe.remove();
      expect(getComputedStyle(aside).backgroundColor).toBe(brand);
    });
  },
};

export const SplitAsideAtStartIsFirst: Story = {
  ...SplitAsideAtStart,
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvasElement }) => {
    const aside = canvasElement.querySelector('aside') as HTMLElement;
    const form = canvasElement.querySelector('input') as HTMLElement;
    await expect(aside.getBoundingClientRect().right).toBeLessThanOrEqual(
      form.getBoundingClientRect().left
    );
  },
};

export const SplitHidesAsideBelowLg: Story = {
  ...Split,
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  play: async ({ canvas, canvasElement }) => {
    await oneHeading(canvas);
    await expect(canvasElement.querySelector('aside')).not.toBeVisible();
    await expect(
      canvas.getAllByText('Cosmos Cloud').filter((el) => el.checkVisibility())
    ).toHaveLength(1);
    await expect(
      canvas
        .getAllByText('Monitor every rack, node and alert from one place.')
        .filter((el) => el.checkVisibility())
    ).toHaveLength(1);
    expectNoHorizontalOverflow();
  },
};

export const SplitWithoutAsideKeepsBrand: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <AuthLayout variant="split" aside={null} logo={Activity} title="Cosmos Cloud">
      <SignIn />
    </AuthLayout>
  ),
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('aside')).toBeNull();
    await expect(canvas.getByText('Cosmos Cloud')).toBeVisible();
  },
};

export const CoverHasOneHeading: Story = {
  ...CoverPhoto,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await oneHeading(canvas);
    const img = canvasElement.querySelector('img') as HTMLImageElement;
    await expect(img).toHaveAttribute('alt', '');
    await expect(getComputedStyle(img).objectFit).toBe('cover');
  },
};

export const CoverNoPhotoDrawsGradient: Story = {
  ...CoverNoPhoto,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await oneHeading(canvas);
    await expect(canvasElement.querySelector('img')).toBeNull();
    await expect(
      getComputedStyle(canvasElement.querySelector('[aria-hidden]')!).backgroundImage
    ).toContain('gradient');
  },
};

export const CoverOnPhone: Story = {
  ...CoverPhoto,
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};
