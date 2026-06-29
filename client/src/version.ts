import version from "../../version.json";

export interface AppVersion {
  major: number;
  minor: number;
  build: number;
}

export const APP_VERSION: AppVersion = version;

export function formatAppVersion(v: AppVersion = APP_VERSION): string {
  return `${v.major}.${v.minor}.${v.build}`;
}