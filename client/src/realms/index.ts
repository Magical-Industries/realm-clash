import type { RealmDefinition } from "./types.js";
import { wildlifeRealm } from "./wildlife/index.js";

const REALMS: RealmDefinition[] = [wildlifeRealm];

const byId = new Map(REALMS.map((realm) => [realm.id, realm]));

export function listRealms(): RealmDefinition[] {
  return [...REALMS];
}

export function getRealm(id: string): RealmDefinition | undefined {
  return byId.get(id);
}

export function requireRealm(id: string): RealmDefinition {
  const realm = getRealm(id);
  if (!realm) {
    throw new Error(`Unknown realm: ${id}`);
  }
  return realm;
}

export const DEFAULT_REALM_ID = wildlifeRealm.id;

export type { CollectionCardPreview, CreatorDefaults, RealmDefinition, RealmStatus } from "./types.js";