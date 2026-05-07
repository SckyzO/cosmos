import { setProjectAnnotations } from '@storybook/react-vite';
import { beforeAll } from 'vitest';
import projectAnnotations from './preview';

const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
