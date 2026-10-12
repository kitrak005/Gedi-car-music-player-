export {};
declare global {
  interface Window {
    __APP_CONFIG__?: {
      projectId: string; oauthPortalUrl: string; apiUrl: string; apiBrowserKey: string;
    };
  }
}
