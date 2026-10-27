import { clsx } from 'clsx';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { DescriptionList } from '../data/DescriptionList';
import { TimeLabel, TimePlaceholder } from '../data/TimeLabel';
import { formatDateTime, toTimestamp } from '../data/time';
import { useIsClient } from '../hooks/useIsClient';
import { Button } from '../ui/Button';
import { Clipboard } from '../ui/Clipboard';
import { CodeBlock } from '../ui/CodeBlock';
import { LogLevelBadge, LOG_MESSAGE_CLASS } from './LogLevelBadge';
import { LogViewer } from './LogViewer';
import { formatLogField, parseLogLevel, stringifyLogLine } from './log-lines';
import type { LogLine } from './types';

export type LogEntryContext = {
  /** The lines just before the entry, oldest first. */
  before: readonly LogLine[];
  /** The lines just after it, oldest first. */
  after: readonly LogLine[];
};

export type LogEntryDetailProps = {
  /** The record to show in full. */
  line: LogLine;
  /**
   * The lines around the entry, for "Show context". Passed up front, the button only shows them;
   * left out, pressing it calls `onShowContext` and the host passes them once it has them.
   */
  context?: LogEntryContext;
  /**
   * Called when "Show context" is pressed and there is no `context` yet: fetch the lines around
   * `line`. The button is there when this or `context` is given.
   */
  onShowContext?: (line: LogLine) => void;
  /** Called after a field value is copied. Every field has a copy button. */
  onCopyField?: (field: string, value: unknown) => void;
  /** Adds a "Filter on this value" button to every field, called with the field and its value. */
  onFilterValue?: (field: string, value: unknown) => void;
  /** Adds an "Exclude this value" button to every field, called with the field and its value. */
  onExcludeValue?: (field: string, value: unknown) => void;
  /** BCP 47 tag for the time. Default: the browser's language. */
  locale?: string;
  /** IANA zone for the time. Default: the browser's zone. */
  timeZone?: string;
  className?: string;
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
};

const Heading = ({ children }: { children: string }) => (
  <h3 className="m-0 mb-2 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
    {children}
  </h3>
);

/**
 * LogEntryDetail — one log record in full, for a drawer or a side panel: its level, time, source
 * and message, the fields as key / value pairs with a copy button (and "filter on" / "exclude"
 * buttons when the host handles them), the stack trace, the raw JSON, and the lines around it on
 * demand. Everything is text, never HTML.
 */
export const LogEntryDetail = ({
  line,
  context,
  onShowContext,
  onCopyField,
  onFilterValue,
  onExcludeValue,
  locale,
  timeZone,
  className,
}: LogEntryDetailProps) => {
  const isClient = useIsClient();
  const [showContext, setShowContext] = useState(false);
  const level = parseLogLevel(line.level);
  const timestamp = toTimestamp(line.time);
  const fields = line.fields ? Object.entries(line.fields) : [];
  const hasContextButton = context !== undefined || onShowContext !== undefined;

  const toggleContext = () => {
    if (!showContext && context === undefined) onShowContext?.(line);
    setShowContext(!showContext);
  };

  return (
    <div className={clsx('flex flex-col gap-6 text-sm', className)}>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--color-text-secondary)]">
          <LogLevelBadge level={line.level} />
          {isClient ? (
            <TimeLabel
              timestamp={timestamp}
              text={formatDateTime(timestamp, TIME_OPTIONS, locale, timeZone)}
              tooltip={false}
            />
          ) : (
            <TimePlaceholder width="26ch" />
          )}
          {line.source && <span className="break-all">{line.source}</span>}
        </div>
        <p
          className={clsx(
            'm-0 mt-2 font-mono text-sm break-words whitespace-pre-wrap [unicode-bidi:isolate]',
            LOG_MESSAGE_CLASS.surface[level]
          )}
        >
          {line.message}
        </p>
      </div>

      {fields.length > 0 && (
        <section>
          <Heading>Fields</Heading>
          <DescriptionList compact>
            {fields.map(([key, value]) => {
              const text = formatLogField(value);
              return (
                <DescriptionList.Item key={key} label={<span className="font-mono">{key}</span>}>
                  <span className="flex items-center justify-end gap-1">
                    <span className="min-w-0 font-mono text-xs font-normal break-all whitespace-pre-wrap [unicode-bidi:isolate]">
                      {text}
                    </span>
                    <Clipboard
                      value={text}
                      plain
                      copyLabel={`Copy ${key}`}
                      onCopy={() => onCopyField?.(key, value)}
                    />
                    {onFilterValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="square"
                        icon={Plus}
                        aria-label={`Filter on ${key}`}
                        title="Filter on this value"
                        onClick={() => onFilterValue(key, value)}
                      />
                    )}
                    {onExcludeValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="square"
                        icon={Minus}
                        aria-label={`Exclude ${key}`}
                        title="Exclude this value"
                        onClick={() => onExcludeValue(key, value)}
                      />
                    )}
                  </span>
                </DescriptionList.Item>
              );
            })}
          </DescriptionList>
        </section>
      )}

      {line.stack && (
        <section>
          <Heading>Stack trace</Heading>
          <pre className="m-0 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-red-700 dark:border-gray-800 dark:bg-gray-900 dark:text-red-300">
            {line.stack}
          </pre>
        </section>
      )}

      {hasContextButton && (
        <section>
          <Heading>Context</Heading>
          <Button variant="secondary" size="sm" aria-expanded={showContext} onClick={toggleContext}>
            {showContext ? 'Hide context' : 'Show context'}
          </Button>
          {showContext && context !== undefined && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <LogViewer
                lines={[...context.before, line, ...context.after]}
                aria-label={`Lines around ${line.id}`}
                tone="surface"
                currentId={line.id}
                height="auto"
                locale={locale}
                timeZone={timeZone}
              />
            </div>
          )}
        </section>
      )}

      <section>
        <Heading>Raw record</Heading>
        <CodeBlock code={stringifyLogLine(line)} language="json" />
      </section>
    </div>
  );
};
