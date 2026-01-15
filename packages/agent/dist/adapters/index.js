import { mantleTransferAdapter } from "./mantle-transfer.js";
const adapters = new Map([
    [mantleTransferAdapter.id, mantleTransferAdapter],
]);
export function getAdapter(id) {
    return adapters.get(id);
}
export function getAllAdapters() {
    return Array.from(adapters.values());
}
export function getAdapterMetadata() {
    return getAllAdapters().map(({ id, name, description, icon, version, author, requiredPermissions, }) => ({
        id,
        name,
        description,
        icon,
        version,
        author,
        requiredPermissions,
    }));
}
export * from "./types.js";
export { mantleTransferAdapter } from "./mantle-transfer.js";
