import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectTextContrast,
  inEachTheme,
  startOffset,
} from '../storybook-helpers';
import { estimateStrength } from '../storybook-strength';
import { Button } from '../ui/Button';
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

/** Sets the score from buttons, as a form moves it while someone types. */
const Driven = ({ start }: { start: number }) => {
  const [score, setScore] = useState(start);
  return (
    <div className="space-y-3">
      <PasswordStrengthMeter score={score} />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <Button key={n} variant="secondary" size="sm" onClick={() => setScore(n)}>
            Score {n}
          </Button>
        ))}
      </div>
    </div>
  );
};

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

/**
 * Moving the score: a slot fills from the start edge when the score reaches it, empties when it
 * falls back, and the colour fades between levels. Reduced motion shows each level at once.
 */
export const MovesBetweenLevels: Story = {
  render: () => <Driven start={1} />,
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

// The four slots are always there; a fill is lit (`data-segment`) once the score reaches its slot.
const lit = (root: HTMLElement) => root.querySelectorAll('[data-segment]').length;
const fills = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>('[aria-hidden] > div > div'),
];

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
      expect(fills(box)[0]!.closest('[aria-hidden=true]')).not.toBeNull();
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

/**
 * The bar is four fixed slots: a fill is as wide as its slot when the score reaches it and gone
 * when not, and the colour follows the level (red, amber, then green for the last two).
 */
export const FourSlotsFillByLevel: Story = {
  tags: ['!dev', '!autodocs'],
  render: BarIsDecorationAndTextSaysTheLevel.render,
  play: async ({ canvas }) => {
    const colours: string[] = [];
    for (const score of [0, 1, 2, 3, 4]) {
      const box = canvas.getByTestId(`score-${score}`);
      const slots = [...box.querySelector('p')!.nextElementSibling!.children] as HTMLElement[];
      expect(slots).toHaveLength(4);
      slots.forEach((slot, i) => {
        const fill = slot.firstElementChild!;
        const room = slot.getBoundingClientRect().width;
        expect(fill.getBoundingClientRect().width, `score ${score}, slot ${i + 1}`).toBeCloseTo(
          i < score ? room : 0,
          1
        );
      });
      colours.push(getComputedStyle(fills(box)[0]!).backgroundColor);
    }
    // One colour per level: red, amber, green; the last two levels share the green.
    expect(new Set(colours.slice(1)).size).toBe(3);
    expect(colours[3]).toBe(colours[4]);
  },
};

/**
 * A fill grows in from the start edge, the right one in right to left, over 300 ms, while the
 * colour of the fills already lit fades to the new level's. A fill carries `motion-reduce:` so
 * nothing moves for someone who asked for less motion. The check reads the transitions
 * themselves, so it keeps motion on; the others see only the end state.
 */
export const FillGrowsInFromTheStartEdge: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => bothDirections(() => <Driven start={1} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const [first, , third] = fills(box);
      const slot = third!.parentElement!;
      const transition = (fill: HTMLElement, property: string) =>
        fill
          .getAnimations()
          .find((a): a is CSSTransition => (a as CSSTransition).transitionProperty === property);
      expect(third, `${dir}: motion-reduce`).toHaveClass('motion-reduce:transition-none');
      expect(third!.getBoundingClientRect().width, `${dir}: unlit`).toBe(0);

      await userEvent.click(within(box).getByRole('button', { name: 'Score 3' }));
      await waitFor(() => expect(transition(third!, 'scale')).toBeDefined());
      // Both are caught in the same turn, before a loaded machine lets 300 ms go by.
      const growth = transition(third!, 'scale')!;
      const fade = transition(first!, 'background-color');
      growth.pause();
      fade?.pause();
      expect(Number(growth.effect!.getComputedTiming().duration), `${dir}: duration`).toBe(300);
      growth.currentTime = 150;
      // Half way: anchored on the start edge, not yet at the end one.
      expect(startOffset(third!, slot), `${dir}: anchored at the start`).toBeCloseTo(0, 0);
      expect(endOffset(third!, slot), `${dir}: not there yet`).toBeGreaterThan(1);
      // The fill that was lit fades from red to the new colour, in the same time.
      expect(fade, `${dir}: colour fade`).toBeDefined();
      fade!.finish();
      growth.finish();
      await waitFor(() => expect(lit(box)).toBe(3));
      expect(third!.getBoundingClientRect().width, `${dir}: lit`).toBeCloseTo(
        slot.getBoundingClientRect().width,
        1
      );
    }
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
