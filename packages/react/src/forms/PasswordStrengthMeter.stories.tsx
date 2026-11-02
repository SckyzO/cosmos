import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { expectTextContrast, inEachTheme } from '../storybook-helpers';
import { estimateStrength } from '../storybook-strength';
import { PasswordInput } from './PasswordInput';
import { defaultPasswordRules, PasswordPolicyChecker } from './PasswordPolicyChecker';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const meta = {
  title: 'Forms/Password Strength Meter',
  component: PasswordStrengthMeter,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { score: 2 },
  argTypes: { score: { control: { type: 'range', min: 0, max: 4, step: 1 } } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordStrengthMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EveryLevel: Story = {
  render: () => (
    <div className="space-y-5">
      {[0, 1, 2, 3, 4].map((score) => (
        <PasswordStrengthMeter key={score} score={score} />
      ))}
    </div>
  ),
};

export const Translated: Story = {
  args: {
    score: 3,
    labels: {
      name: 'Robustesse du mot de passe',
      levels: ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort'],
    },
  },
};

/**
 * What a form does with it: the page works the score out (here the few lines the docs give), and
 * the field points at the meter through `aria-describedby`.
 */
export const LiveCheck: Story = {
  render: () => {
    const [password, setPassword] = useState('');
    const meterId = useId();
    return (
      <div className="space-y-3">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          aria-describedby={meterId}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthMeter id={meterId} score={estimateStrength(password)} />
        <PasswordPolicyChecker rules={defaultPasswordRules(password)} />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// `ProgressBar` draws the lit segments only: the unlit ones are the track.
const lit = (root: HTMLElement) => root.querySelectorAll('[data-segment]').length;

export const BarIsDecorationAndTextSaysTheLevel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-5">
      {[0, 1, 2, 3, 4].map((score) => (
        <div key={score} data-testid={`score-${score}`}>
          <PasswordStrengthMeter score={score} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const levels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    levels.forEach((level, score) => {
      const box = canvas.getByTestId(`score-${score}`);
      // `score` of the four segments lit, in an aria-hidden bar: the text says the rest.
      expect(lit(box)).toBe(score);
      expect(box.querySelector('[role=progressbar]')!.closest('[aria-hidden=true]')).not.toBeNull();
      expect(box.querySelector('p')).toHaveTextContent(`Password strength: ${level}`);
      expect(box.querySelector('p')).toBeVisible();
    });
    inEachTheme(() => {
      for (const p of canvasElement.querySelectorAll('p')) expectTextContrast(p);
    });
  },
};

export const ScoreIsHeldToTheScale: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {[-3, Number.NaN, 2.6, 9].map((score) => (
        <div key={String(score)} data-testid={String(score)}>
          <PasswordStrengthMeter score={score} />
        </div>
      ))}
    </>
  ),
  play: async ({ canvas }) => {
    expect(lit(canvas.getByTestId('-3'))).toBe(0);
    expect(canvas.getByTestId('-3')).toHaveTextContent('Very weak');
    expect(lit(canvas.getByTestId('NaN'))).toBe(0);
    expect(lit(canvas.getByTestId('2.6'))).toBe(3);
    expect(canvas.getByTestId('2.6')).toHaveTextContent('Good');
    expect(lit(canvas.getByTestId('9'))).toBe(4);
    expect(canvas.getByTestId('9')).toHaveTextContent('Strong');
  },
};

export const LabelsAreTranslated: Story = {
  ...Translated,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('p')).toHaveTextContent('Robustesse du mot de passe: Bon');
  },
};

export const FieldIsDescribedByTheMeter: Story = {
  ...LiveCheck,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByLabelText('New password');
    // The visible text is the description, not the bar nor the announcement.
    expect(field).toHaveAccessibleDescription('Password strength: Very weak');
    await userEvent.type(field, 'Correct-Horse-9');
    expect(field).toHaveAccessibleDescription('Password strength: Good');
  },
};

// The meter announces on a timer (800 ms of a steady score), so these run in real time with margins
// of 300 ms or more on each side of it. A harness sets the score from buttons.
const Driven = ({ start }: { start: number }) => {
  const [score, setScore] = useState(start);
  return (
    <div className="space-y-3">
      <PasswordStrengthMeter score={score} />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <button key={n} type="button" onClick={() => setScore(n)}>
            Score {n}
          </button>
        ))}
      </div>
    </div>
  );
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const NeverAnnouncesOnMount: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Driven start={3} />,
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    // The live region is there from the start, empty, and stays so past the delay.
    expect(status).toBeEmptyDOMElement();
    await pause(1200);
    expect(status).toBeEmptyDOMElement();
  },
};

export const AnnouncesTheNewLevelAfterAPause: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Driven start={2} />,
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await userEvent.click(canvas.getByRole('button', { name: 'Score 3' }));
    expect(status).toBeEmptyDOMElement();
    await pause(500);
    expect(status).toBeEmptyDOMElement();
    await waitFor(() => expect(status).toHaveTextContent('Password strength: Good'), {
      timeout: 1500,
    });
  },
};

export const WaitsUntilTheScoreHolds: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Driven start={2} />,
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    const said: string[] = [];
    const watcher = new MutationObserver(() => said.push(status.textContent ?? ''));
    watcher.observe(status, { childList: true, characterData: true, subtree: true });
    // A new score every 500 ms keeps pushing the announcement back: `Good` is never said.
    await userEvent.click(canvas.getByRole('button', { name: 'Score 3' }));
    await pause(500);
    await userEvent.click(canvas.getByRole('button', { name: 'Score 4' }));
    await pause(500);
    expect(status).toBeEmptyDOMElement();
    await waitFor(() => expect(status).toHaveTextContent('Password strength: Strong'), {
      timeout: 1500,
    });
    watcher.disconnect();
    expect(said).toEqual(['Password strength: Strong']);
  },
};

export const SaysNothingWhenTheLevelComesBack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Driven start={2} />,
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await userEvent.click(canvas.getByRole('button', { name: 'Score 3' }));
    await pause(300);
    await userEvent.click(canvas.getByRole('button', { name: 'Score 2' }));
    await pause(1200);
    expect(status).toBeEmptyDOMElement();
  },
};
