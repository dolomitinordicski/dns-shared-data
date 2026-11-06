export type Observation = Record<string, any>;
export function createGitHubReader(
  token?: string,
): (path: string) => Promise<any>;
export function availableRelease(
  read: (path: string) => Promise<any>,
): Promise<any>;
export function observeTool(
  tool: any,
  read: (path: string) => Promise<any>,
  probe: (url: string | null) => Promise<any>,
  now?: string,
): Promise<Observation>;
export function projectTool(
  tool: any,
  observed: Observation,
  previous: any,
  canonical: any,
): any;
export function persistTool(
  db: any,
  document: any,
  observedAt: string,
): Promise<string>;
export function validateSignal(payload: any, repositories: string[]): string;
