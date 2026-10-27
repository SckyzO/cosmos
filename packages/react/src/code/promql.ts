import type { LanguageRegistration } from 'shiki/core';

// Shiki ships no PromQL grammar. This is a small TextMate one, written for the
// scopes the `--color-code-*` theme colours: functions and metric/label names
// stand apart, aggregations and `by` / `without` read as keywords.

const IDENT = '[a-zA-Z_][a-zA-Z0-9_]*';
const GROUPING = 'by|without|on|ignoring|group_left|group_right';

const promql: LanguageRegistration = {
  name: 'promql',
  displayName: 'PromQL',
  scopeName: 'source.promql',
  aliases: ['prometheus'],
  patterns: [{ include: '#expression' }],
  repository: {
    expression: {
      patterns: [
        { include: '#comment' },
        { include: '#string' },
        { include: '#label-matchers' },
        { include: '#grouping' },
        { include: '#duration' },
        { include: '#number' },
        { include: '#aggregation' },
        { include: '#keyword' },
        { include: '#function' },
        { include: '#metric' },
        { include: '#operator' },
        { include: '#punctuation' },
      ],
    },
    comment: {
      name: 'comment.line.number-sign.promql',
      match: '#.*$',
    },
    string: {
      patterns: [
        {
          name: 'string.quoted.double.promql',
          begin: '"',
          end: '"',
          patterns: [{ name: 'constant.character.escape.promql', match: '\\\\.' }],
        },
        {
          name: 'string.quoted.single.promql',
          begin: "'",
          end: "'",
          patterns: [{ name: 'constant.character.escape.promql', match: '\\\\.' }],
        },
        {
          name: 'string.quoted.other.backtick.promql',
          begin: '`',
          end: '`',
        },
      ],
    },
    // {job="api", code!~"5..", instance=~".+"}
    'label-matchers': {
      name: 'meta.label-matchers.promql',
      begin: '\\{',
      end: '\\}',
      beginCaptures: { 0: { name: 'punctuation.definition.label-matchers.begin.promql' } },
      endCaptures: { 0: { name: 'punctuation.definition.label-matchers.end.promql' } },
      patterns: [
        { include: '#comment' },
        { include: '#string' },
        {
          name: 'keyword.operator.comparison.label-matcher.promql',
          match: '=~|!~|!=|=',
        },
        {
          name: 'meta.property-name.label.promql',
          match: IDENT,
        },
        { name: 'punctuation.separator.comma.promql', match: ',' },
      ],
    },
    // sum by (job, instance) (...), a / on (job) group_left (...)
    grouping: {
      name: 'meta.grouping.promql',
      begin: `\\b(${GROUPING})\\b\\s*(\\()`,
      end: '\\)',
      beginCaptures: {
        1: { name: 'keyword.control.grouping.promql' },
        2: { name: 'punctuation.definition.grouping.begin.promql' },
      },
      endCaptures: { 0: { name: 'punctuation.definition.grouping.end.promql' } },
      patterns: [
        { include: '#string' },
        { name: 'meta.property-name.label.promql', match: IDENT },
        { name: 'punctuation.separator.comma.promql', match: ',' },
      ],
    },
    // 5m, 1h30m, 500ms, as in [5m], [1h:5m] and offset 1d
    duration: {
      name: 'constant.numeric.duration.promql',
      match: '\\b\\d+(?:ms|[smhdwy])(?:\\d+(?:ms|[smhdwy]))*\\b',
    },
    number: {
      name: 'constant.numeric.promql',
      match:
        '\\b(?:0[xX][0-9a-fA-F]+|\\d+\\.?\\d*(?:[eE][+-]?\\d+)?|[Ii]nf|[Nn]a[Nn])\\b|(?<![\\w.])\\.\\d+(?:[eE][+-]?\\d+)?\\b',
    },
    aggregation: {
      name: 'keyword.other.aggregation.promql',
      match:
        '\\b(?:sum|min|max|avg|group|stddev|stdvar|count_values|count|bottomk|topk|quantile|limitk|limit_ratio)\\b(?=\\s*(?:\\(|by\\b|without\\b))',
    },
    keyword: {
      patterns: [
        {
          name: 'keyword.control.modifier.promql',
          match: '\\b(?:offset|bool)\\b',
        },
        {
          name: 'keyword.operator.logical.promql',
          match: '\\b(?:and|or|unless|atan2)\\b',
        },
        {
          name: 'keyword.control.grouping.promql',
          match: `\\b(?:${GROUPING})\\b`,
        },
      ],
    },
    // Any name followed by "(" is a function: the list of PromQL functions grows with Prometheus.
    function: {
      name: 'support.function.promql',
      match: `\\b${IDENT}(?=\\s*\\()`,
    },
    metric: {
      name: 'variable.other.metric.promql',
      match: '(?<![\\w:])[a-zA-Z_][a-zA-Z0-9_:]*',
    },
    operator: {
      patterns: [
        { name: 'keyword.operator.comparison.promql', match: '==|!=|>=|<=|=~|!~|>|<' },
        { name: 'keyword.operator.arithmetic.promql', match: '[-+*/%^]' },
        { name: 'keyword.operator.modifier.at.promql', match: '@' },
      ],
    },
    punctuation: {
      patterns: [
        { name: 'punctuation.definition.range.promql', match: '[\\[\\]:]' },
        { name: 'punctuation.definition.group.promql', match: '[()]' },
        { name: 'punctuation.separator.comma.promql', match: ',' },
      ],
    },
  },
};

export default [promql];
