export function createRegistryWebhookHandler(options: {
  secret: string;
  repositories: string[];
  dispatch: (repository: string) => Promise<void>;
}): (request: Request) => Promise<Response>;
export function createRegistryDispatcher(options: {
  appId: string;
  installationId: string;
  privateKey: string;
}): (repository: string) => Promise<void>;
