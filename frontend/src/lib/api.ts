/** All transport concerns live here; pages only consume typed domain objects. */
export async function getJson<T>(
  path: string,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok)
    throw new Error("The snapshot could not be loaded. Please retry.");
  return response.json() as Promise<T>;
}
