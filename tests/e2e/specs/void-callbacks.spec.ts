import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import ts from 'typescript';

// A callback prop typed `() => void` is called with no argument (CONTRIBUTING, "Component API").
// `onClick={onRetry}` hands the host's function to the button as it is, so it gets the click event:
// a handler with an optional parameter (`reload(force?: boolean)`) takes it for its own, and the
// type promised it gets nothing. TypeScript accepts it, as a function with fewer parameters fits a
// type with more. This reads the package with the type checker: a JSX attribute whose prop passes
// arguments (the `onClick` of a button) must not be given a function that takes none and comes from
// outside the component, a prop or a parameter. The wrapper `() => onRetry()` is what it asks for.
//
// What it does not see: a callback given to a function (`new MutationObserver(onChange)`, `.map(f)`),
// and one that goes through a variable (`const handler = onRetry`).

const PACKAGE = fileURLToPath(new URL('../../../packages/react/tsconfig.json', import.meta.url));

const parameterCount = (type: ts.Type) => {
  const signatures = type.getCallSignatures();
  return signatures.length ? Math.max(...signatures.map((s) => s.getParameters().length)) : -1;
};

const members = (type: ts.Type) => (type.isUnion() ? type.types : [type]);

/**
 * The functions an expression can hand over: both branches of a condition, the right side of `a && f`
 * (the left one is only a guard, never a function), both of `a ?? f`. An arrow function or a function
 * expression is written here and is its own.
 */
const functionsOf = (expr: ts.Expression): ts.Expression[] => {
  if (ts.isParenthesizedExpression(expr)) return functionsOf(expr.expression);
  if (ts.isConditionalExpression(expr))
    return [...functionsOf(expr.whenTrue), ...functionsOf(expr.whenFalse)];
  if (ts.isBinaryExpression(expr)) {
    const operator = expr.operatorToken.kind;
    if (operator === ts.SyntaxKind.AmpersandAmpersandToken) return functionsOf(expr.right);
    if (operator === ts.SyntaxKind.BarBarToken || operator === ts.SyntaxKind.QuestionQuestionToken)
      return [...functionsOf(expr.left), ...functionsOf(expr.right)];
  }
  return [expr];
};

/** From outside the component: a property (`crumb.onClick`), or a parameter or destructured prop. */
const comesFromOutside = (expr: ts.Expression, checker: ts.TypeChecker) => {
  if (ts.isPropertyAccessExpression(expr)) return true;
  if (!ts.isIdentifier(expr)) return false;
  const declaration = checker.getSymbolAtLocation(expr)?.declarations?.[0];
  return !!declaration && (ts.isBindingElement(declaration) || ts.isParameter(declaration));
};

type Leak = { file: string; line: number; attribute: string; text: string };

/** The JSX attributes of `files` that hand a no-parameter function from outside to a prop that passes arguments. */
const voidCallbackLeaks = (program: ts.Program, files: ts.SourceFile[]): Leak[] => {
  const checker = program.getTypeChecker();
  const leaks: Leak[] = [];
  const visit = (file: ts.SourceFile) => (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression
    ) {
      const expression = node.initializer.expression;
      // What the prop takes: from the type the attribute is checked against.
      const target = checker.getContextualType(expression);
      const passesArguments = !!target && members(target).some((t) => parameterCount(t) >= 1);
      if (passesArguments) {
        for (const fn of functionsOf(expression)) {
          const givesNone = members(checker.getTypeAtLocation(fn))
            .filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)))
            .every((t) => parameterCount(t) === 0);
          if (givesNone && comesFromOutside(fn, checker)) {
            const { line } = file.getLineAndCharacterOfPosition(fn.getStart(file));
            leaks.push({
              file: file.fileName,
              line: line + 1,
              attribute: node.name.getText(file),
              text: fn.getText(file),
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit(file));
  };
  for (const file of files) visit(file)(file);
  return leaks;
};

const VIRTUAL = '/virtual/leaks.tsx';

/** A program of one in-memory file, with the JSX of a `button` that takes the click event. */
const virtualProgram = (code: string) => {
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.Preserve,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    types: [],
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(options);
  const text = `declare global { namespace JSX { interface IntrinsicElements { button: { onClick?: (event: MouseEvent) => void; onFocus?: () => void }; } } }
export {};
${code}`;
  const { getSourceFile, fileExists, readFile } = host;
  host.getSourceFile = (name, language, ...rest) =>
    name === VIRTUAL
      ? ts.createSourceFile(name, text, language)
      : getSourceFile.call(host, name, language, ...rest);
  host.fileExists = (name) => name === VIRTUAL || fileExists.call(host, name);
  host.readFile = (name) => (name === VIRTUAL ? text : readFile.call(host, name));
  const program = ts.createProgram([VIRTUAL], options, host);
  return { program, file: program.getSourceFile(VIRTUAL)! };
};

test('the check sees a prop handed to a control as it is, and lets a wrapper through', () => {
  const found = (code: string) => {
    const { program, file } = virtualProgram(code);
    return voidCallbackLeaks(program, [file]).map((leak) => `${leak.attribute}=${leak.text}`);
  };
  // Handed over as it is: the click event goes to a function typed with no parameter.
  expect(
    found('const A = ({ onClose }: { onClose: () => void }) => <button onClick={onClose} />;')
  ).toEqual(['onClick=onClose']);
  expect(
    found('const A = (p: { onClose?: () => void }) => <button onClick={p.onClose} />;')
  ).toEqual(['onClick=p.onClose']);
  expect(
    found(
      'const A = ({ a, b, on }: { a: () => void; b: () => void; on: boolean }) => <button onClick={on ? a : b} />;'
    )
  ).toEqual(['onClick=a', 'onClick=b']);
  // The wrapper, with or without a guard, and a function written in the component.
  expect(
    found(
      'const A = ({ onClose }: { onClose: () => void }) => <button onClick={() => onClose()} />;'
    )
  ).toEqual([]);
  expect(
    found(
      'const A = ({ onClose }: { onClose?: () => void }) => <button onClick={onClose && (() => onClose())} />;'
    )
  ).toEqual([]);
  expect(
    found('const A = () => { const close = () => {}; return <button onClick={close} />; };')
  ).toEqual([]);
  // A function that takes the event is the prop's own, and so is a prop that passes none.
  expect(
    found(
      'const A = ({ onClose }: { onClose: (event: MouseEvent) => void }) => <button onClick={onClose} />;'
    )
  ).toEqual([]);
  expect(found('const A = ({ show }: { show: () => void }) => <button onFocus={show} />;')).toEqual(
    []
  );
});

test('no component hands a `() => void` prop to a control as it is', () => {
  test.setTimeout(120_000);
  const config = ts.readConfigFile(PACKAGE, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(PACKAGE));
  const sources = parsed.fileNames.filter(
    (file) => !/\.(stories|test)\.tsx?$/.test(file) && !file.endsWith('.d.ts')
  );
  expect(sources.length, 'source files').toBeGreaterThan(100);
  const program = ts.createProgram(sources, parsed.options);
  const root = dirname(PACKAGE);
  const leaks = voidCallbackLeaks(
    program,
    sources.map((file) => program.getSourceFile(file)!)
  ).map(
    (leak) => `${leak.file.replace(`${root}/`, '')}:${leak.line}  ${leak.attribute}={${leak.text}}`
  );
  // Each line is a callback the host would get an event in: `onClick={() => onRetry()}`.
  expect(leaks).toEqual([]);
});
