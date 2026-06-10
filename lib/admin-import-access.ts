export function isAdminImportAvailable() {
  return process.env.NODE_ENV !== "production";
}
