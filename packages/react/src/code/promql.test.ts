import { createCssVariablesTheme, createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { describe, expect, it } from 'vitest';
import promql from './promql';

const shiki = createHighlighterCoreSync({
  themes: [createCssVariablesTheme({ name: 'cosmos', variablePrefix: '--color-code-' })],
  langs: promql,
  engine: createJavaScriptRegexEngine(),
});

/** [text, innermost scope] of each token of `code` that has a scope of ours. */
const scopes = (code: string) =>
  shiki
    .codeToTokens(code, { lang: 'promql', theme: 'cosmos', includeExplanation: true })
    .tokens.flat()
    .flatMap((token) =>
      (token.explanation ?? []).map(
        (part) => [part.content, part.scopes.at(-1)?.scopeName ?? ''] as const
      )
    )
    .filter(([text, scope]) => text.trim() && scope !== 'source.promql');

const scopeOf = (code: string, text: string) => scopes(code).find(([t]) => t === text)?.[1];

describe('promql grammar', () => {
  it('colours functions apart from the metric they take', () => {
    expect(scopeOf('rate(http_requests_total[5m])', 'rate')).toBe('support.function.promql');
    expect(scopeOf('rate(http_requests_total[5m])', 'http_requests_total')).toBe(
      'variable.other.metric.promql'
    );
  });

  it('reads aggregations and by / without as keywords, and the labels they list', () => {
    const query = 'sum by (job, instance) (up)';
    expect(scopeOf(query, 'sum')).toBe('keyword.other.aggregation.promql');
    expect(scopeOf(query, 'by')).toBe('keyword.control.grouping.promql');
    expect(scopeOf(query, 'job')).toBe('meta.property-name.label.promql');
    expect(scopeOf(query, 'instance')).toBe('meta.property-name.label.promql');
    expect(scopeOf('count without (pod) (up)', 'without')).toBe('keyword.control.grouping.promql');
  });

  it('does not take a metric called like an aggregation for one', () => {
    expect(scopeOf('sum_over_time(up[1h])', 'sum_over_time')).toBe('support.function.promql');
    expect(scopeOf('max + 1', 'max')).toBe('variable.other.metric.promql');
  });

  it('reads label matchers: names, the four operators and the strings', () => {
    const query = 'up{job="api", code!~"5..", env!="dev", instance=~".+"}';
    expect(scopeOf(query, 'job')).toBe('meta.property-name.label.promql');
    expect(scopeOf(query, '=')).toBe('keyword.operator.comparison.label-matcher.promql');
    expect(scopeOf(query, '!~')).toBe('keyword.operator.comparison.label-matcher.promql');
    expect(scopeOf(query, '!=')).toBe('keyword.operator.comparison.label-matcher.promql');
    expect(scopeOf(query, '=~')).toBe('keyword.operator.comparison.label-matcher.promql');
    expect(scopeOf(query, '5..')).toBe('string.quoted.double.promql');
  });

  it('reads durations, numbers and the offset modifier', () => {
    const query = 'rate(x[1h30m] offset 5m) > 0.5e3';
    expect(scopeOf(query, '1h30m')).toBe('constant.numeric.duration.promql');
    expect(scopeOf(query, '5m')).toBe('constant.numeric.duration.promql');
    expect(scopeOf(query, 'offset')).toBe('keyword.control.modifier.promql');
    expect(scopeOf(query, '0.5e3')).toBe('constant.numeric.promql');
    expect(scopeOf('x / Inf', 'Inf')).toBe('constant.numeric.promql');
    expect(scopeOf('x[30m:1m]', '1m')).toBe('constant.numeric.duration.promql');
  });

  it('reads strings, comments and operators', () => {
    const query = 'label_replace(x, "a", "$1", \'b\', `c`)';
    expect(scopeOf(query, 'a')).toBe('string.quoted.double.promql');
    expect(scopeOf(query, 'b')).toBe('string.quoted.single.promql');
    expect(scopeOf(query, 'c')).toBe('string.quoted.other.backtick.promql');
    expect(scopeOf('up # is it up', '# is it up')).toBe('comment.line.number-sign.promql');
    expect(scopeOf('a and b == 1', 'and')).toBe('keyword.operator.logical.promql');
    expect(scopeOf('a * b', '*')).toBe('keyword.operator.arithmetic.promql');
    expect(scopeOf('a >= b', '>=')).toBe('keyword.operator.comparison.promql');
  });

  it('keeps colons in recording-rule names', () => {
    expect(scopeOf('job:http_requests:rate5m', 'job:http_requests:rate5m')).toBe(
      'variable.other.metric.promql'
    );
  });

  it('tokenises a whole query back into the text it was given', () => {
    const query = [
      '# 5xx ratio',
      'sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))',
      '  / ignoring(code) group_left sum by (job) (rate(http_requests_total[5m])) > 0.05',
    ].join('\n');
    const text = shiki
      .codeToTokens(query, { lang: 'promql', theme: 'cosmos' })
      .tokens.map((line) => line.map((token) => token.content).join(''))
      .join('\n');
    expect(text).toBe(query);
  });
});
