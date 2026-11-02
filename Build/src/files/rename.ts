export type RenameResult = "ok" | "unsupported" | "denied";
export type DeleteResult = "ok" | "unsupported" | "denied";

export async function renameFileHandle(
  handle: FileSystemFileHandle,
  newName: string,
): Promise<RenameResult> {
  const move = handle.move;
  if (move === undefined) {
    return "unsupported";
  }
  const descriptor: FileSystemHandlePermissionDescriptor = {
    mode: "readwrite",
  };
  let permission = await handle.queryPermission(descriptor);
  if (permission !== "granted") {
    permission = await handle.requestPermission(descriptor);
  }
  if (permission !== "granted") {
    return "denied";
  }

  await move.call(handle, newName);
  return "ok";
}

export async function deleteFileHandle(
  handle: FileSystemFileHandle,
): Promise<DeleteResult> {
  const remove = handle.remove;
  if (remove === undefined) {
    return "unsupported";
  }
  const descriptor: FileSystemHandlePermissionDescriptor = {
    mode: "readwrite",
  };
  let permission = await handle.queryPermission(descriptor);
  if (permission !== "granted") {
    permission = await handle.requestPermission(descriptor);
  }
  if (permission !== "granted") {
    return "denied";
  }
  await remove.call(handle);
  return "ok";
}
