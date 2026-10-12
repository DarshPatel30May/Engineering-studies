import { civil } from './civil';
import { transport } from './transport';
import { aero } from './aero';
import { telecom } from './telecom';
import type { ModuleData, ModuleId } from '../types';

export const MODULES: ModuleData[] = [civil, transport, aero, telecom];
export const MODULE_MAP: Record<ModuleId, ModuleData> = { civil, transport, aero, telecom };
export const isModuleId = (s: string | undefined): s is ModuleId => !!s && s in MODULE_MAP;

/** All syllabus dot point ids for progress tracking. */
export function allDotPoints(m: ModuleData) {
  return m.syllabus.flatMap((g) => [...g.learnAbout, ...g.learnTo].map((d) => ({ ...d, group: g.heading })));
}
