import type { Adapter, AdapterMetadata } from "./types.js";
import { mantleTransferAdapter } from "./mantle-transfer.js";

const adapters = new Map<string, Adapter>([
  [mantleTransferAdapter.id, mantleTransferAdapter],
]);

export function getAdapter(id: string): Adapter | undefined {
  return adapters.get(id);
}

export function getAllAdapters(): Adapter[] {
  return Array.from(adapters.values());
}

export function getAdapterMetadata(): AdapterMetadata[] {
  return getAllAdapters().map(
    ({
      id,
      name,
      description,
      icon,
      version,
      author,
      requiredPermissions,
    }) => ({
      id,
      name,
      description,
      icon,
      version,
      author,
      requiredPermissions,
    })
  );
}

export * from "./types.js";
export { mantleTransferAdapter } from "./mantle-transfer.js";
