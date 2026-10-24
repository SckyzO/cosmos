import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, spyOn, userEvent, waitFor } from 'storybook/test';
import { useControllableState } from './useControllableState';

/**
 * The contract of the internal `useControllableState`, through a bare harness. Test-only: the
 * hook is not exported, and each component using it keeps its own stories.
 */

type HarnessProps = {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null, source: string) => void;
  /** Counts the setter identities seen, to prove it stays the same across renders. */
  onSetterChange?: () => void;
};

function Harness({ value, defaultValue = 'a', onChange, onSetterChange }: HarnessProps) {
  const [current, setCurrent, isControlled] = useControllableState<string | null, [string]>({
    value,
    defaultValue,
    onChange,
    name: 'Harness.value',
  });
  useEffect(() => onSetterChange?.(), [setCurrent, onSetterChange]);
  return (
    <div className="space-y-2 text-sm text-[var(--color-text-base)]">
      <p>
        Value: <output aria-label="Value">{String(current)}</output>
      </p>
      <p>
        Mode: <output aria-label="Mode">{isControlled ? 'controlled' : 'uncontrolled'}</output>
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setCurrent('b', 'set')}>
          Set b
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrent((v) => `${v}+`, 'append');
            setCurrent((v) => `${v}+`, 'append');
          }}
        >
          Append twice
        </button>
      </div>
    </div>
  );
}

/** A host that owns the value: the harness only moves when the host passes it back. */
function Host({
  initial,
  onChange,
}: {
  initial: string | null;
  onChange?: HarnessProps['onChange'];
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <div className="space-y-2">
      <Harness
        value={value}
        onChange={(next, source) => {
          onChange?.(next, source);
          setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue('c')}>
        Host sets c
      </button>
    </div>
  );
}

const meta = {
  title: 'Foundations/useControllableState',
  component: Harness,
  parameters: { layout: 'padded' },
  tags: ['!dev', '!autodocs'],
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UncontrolledStartsFromDefault: Story = {
  args: { defaultValue: 'a', onChange: fn() },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('a');
    await expect(canvas.getByLabelText('Mode')).toHaveTextContent('uncontrolled');
    await userEvent.click(canvas.getByRole('button', { name: 'Set b' }));
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('b');
    // The setter's extra arguments reach the callback.
    await expect(args.onChange).toHaveBeenCalledExactlyOnceWith('b', 'set');
  },
};

/** An updater reads the value the previous set of the same event moved to. */
export const UpdatersChainInOneEvent: Story = {
  args: { defaultValue: 'a', onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Append twice' }));
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('a++');
    await expect(args.onChange).toHaveBeenNthCalledWith(1, 'a+', 'append');
    await expect(args.onChange).toHaveBeenNthCalledWith(2, 'a++', 'append');
  },
};

export const ControlledIgnoresItsOwnSet: Story = {
  args: { value: 'x', defaultValue: 'a', onChange: fn() },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('x');
    await expect(canvas.getByLabelText('Mode')).toHaveTextContent('controlled');
    await userEvent.click(canvas.getByRole('button', { name: 'Set b' }));
    // The callback still fires, but the value stays the host's.
    await expect(args.onChange).toHaveBeenCalledExactlyOnceWith('b', 'set');
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('x');
  },
};

export const ControlledReflectsTheProp: Story = {
  args: { onChange: fn() },
  render: (args) => <Host initial="x" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Set b' }));
    await expect(args.onChange).toHaveBeenCalledExactlyOnceWith('b', 'set');
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('b');
    // A change made by the host alone shows too.
    await userEvent.click(canvas.getByRole('button', { name: 'Host sets c' }));
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('c');
  },
};

/** Only `undefined` means uncontrolled: `null` is a value the host controls. */
export const NullIsAControlledValue: Story = {
  args: { value: null, defaultValue: 'a', onChange: fn() },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('null');
    await expect(canvas.getByLabelText('Mode')).toHaveTextContent('controlled');
    await userEvent.click(canvas.getByRole('button', { name: 'Set b' }));
    await expect(args.onChange).toHaveBeenCalledExactlyOnceWith('b', 'set');
    await expect(canvas.getByLabelText('Value')).toHaveTextContent('null');
  },
};

/** The setter keeps its identity, and calls the `onChange` of the latest render. */
export const SetterIsStableAndCallsTheLatestCallback: Story = {
  args: { onChange: fn(), onSetterChange: fn() },
  render: function Render(args) {
    const [renders, setRenders] = useState(0);
    const onSetterChange = useRef(args.onSetterChange).current;
    return (
      <div className="space-y-2">
        <Harness
          // A new callback on every render, naming the render it comes from.
          onChange={(value, source) => args.onChange?.(value, `${source} after ${renders}`)}
          onSetterChange={onSetterChange}
        />
        <button type="button" onClick={() => setRenders((n) => n + 1)}>
          Rerender
        </button>
      </div>
    );
  },
  play: async ({ args, canvas }) => {
    const rerender = canvas.getByRole('button', { name: 'Rerender' });
    await userEvent.click(rerender);
    await userEvent.click(rerender);
    await userEvent.click(canvas.getByRole('button', { name: 'Set b' }));
    await expect(args.onChange).toHaveBeenCalledExactlyOnceWith('b', 'set after 2');
    await expect(args.onSetterChange).toHaveBeenCalledTimes(1);
  },
};

/** Going from uncontrolled to controlled warns once, naming the component and prop. */
export const WarnsOnceWhenTheModeSwitches: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div className="space-y-2">
        <Harness value={value} />
        <button type="button" onClick={() => setValue((v) => (v === undefined ? 'x' : undefined))}>
          Switch
        </button>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const toggle = canvas.getByRole('button', { name: 'Switch' });
      await userEvent.click(toggle);
      await expect(canvas.getByLabelText('Mode')).toHaveTextContent('controlled');
      await userEvent.click(toggle);
      await expect(canvas.getByLabelText('Mode')).toHaveTextContent('uncontrolled');
      await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
      await expect(warn.mock.calls[0][0]).toContain(
        'Harness.value switched from uncontrolled to controlled'
      );
    } finally {
      warn.mockRestore();
    }
  },
};
