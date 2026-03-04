import type { CommunicationLog } from '../types/log';
import { read, write } from './storage';

const KEY = 'communicationLogs';

/** Returns logs newest-first (appendLog prepends). */
export function listLogs(): CommunicationLog[] {
  return read<CommunicationLog[]>(KEY, []);
}

/** Prepend a new log entry so listLogs() stays newest-first. */
export function appendLog(log: CommunicationLog): void {
  const logs = read<CommunicationLog[]>(KEY, []);
  write(KEY, [log, ...logs]);
}
