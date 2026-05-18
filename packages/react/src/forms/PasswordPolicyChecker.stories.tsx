import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { PasswordInput } from './PasswordInput';
import {
  PasswordPolicyChecker,
  defaultPasswordRules,
  type PasswordRule,
} from './PasswordPolicyChecker';

const meta = {
  title: 'Forms/Password Policy Checker',
  component: PasswordPolicyChecker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` on the meta when `component` is set and the
  // component has required props. Stories override via their own args.
  args: { rules: defaultPasswordRules('') },
} satisfies Meta<typeof PasswordPolicyChecker>;

export default meta;
type Story = StoryObj<typeof meta>;

const allOff: PasswordRule[] = defaultPasswordRules('');
const mixed: PasswordRule[] = defaultPasswordRules('Hello1');
const allOn: PasswordRule[] = defaultPasswordRules('SuperSecret_123!');

export const AllFailed: Story = { args: { rules: allOff } };

export const Mixed: Story = { args: { rules: mixed } };

export const AllPassed: Story = { args: { rules: allOn } };

export const Empty: Story = { args: { rules: [] } };

export const NoTitle: Story = { args: { rules: mixed, title: null } };

export const CustomRules: Story = {
  args: {
    title: 'Org password policy',
    rules: [
      { label: 'At least 16 characters', ok: false },
      { label: 'Not in the last 5 used', ok: true },
      { label: 'No dictionary words', ok: true },
      { label: 'Mix of case + symbols', ok: false },
    ],
  },
};

export const LiveCheck: Story = {
  render: () => {
    const [pwd, setPwd] = useState('');
    const rules = useMemo(() => defaultPasswordRules(pwd), [pwd]);
    return (
      <div className="max-w-sm space-y-3">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <PasswordPolicyChecker rules={rules} />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const LiveCheckUpdatesOnTyping: Story = {
  render: () => {
    const [pwd, setPwd] = useState('');
    const rules = useMemo(() => defaultPasswordRules(pwd), [pwd]);
    return (
      <div className="max-w-sm space-y-3">
        <PasswordInput label="New password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <PasswordPolicyChecker rules={rules} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('New password');
    await userEvent.type(input, 'Hello1');
    // After typing 'Hello1' (6 chars), expect:
    //   length (12+)  → fail (still 'X')
    //   uppercase     → pass (Check on 'One uppercase letter')
    //   lowercase     → pass
    //   number        → pass
    //   symbol        → fail
    const list = canvas.getByRole('list');
    const items = list.querySelectorAll('li');
    await expect(items[0]).toHaveClass(/text-gray/); // 12 chars: not yet
    await expect(items[1]).toHaveClass(/text-green/); // uppercase: yes
    await expect(items[2]).toHaveClass(/text-green/); // lowercase: yes
    await expect(items[3]).toHaveClass(/text-green/); // number: yes
    await expect(items[4]).toHaveClass(/text-gray/); // symbol: not yet
  },
};
