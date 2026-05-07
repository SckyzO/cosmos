import { setProjectAnnotations } from '@storybook/react-vite';
import { beforeAll } from 'vitest';

import * as projectAnnotations from './preview';

// Wire the framework's preview annotations into the Vitest test runner so
// `context.renderToCanvas` is available when stories mount in browser mode.
//
// Note: addon-vitest 10.3 prints "Skipping automatic provisioning" when it
// detects this call, but the auto-provisioning currently does NOT wire
// renderToCanvas — without this explicit call every story fails with
// `TypeError: context.renderToCanvas is not a function`.
const project = setProjectAnnotations([projectAnnotations.default]);

beforeAll(project.beforeAll);
