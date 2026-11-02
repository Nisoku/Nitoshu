export function registerFileHandlers(onFile: (file: File) => void): void {
  if (window.launchQueue === undefined) {
    return;
  }

  window.launchQueue.setConsumer((params) => {
    void handleLaunch(params, onFile);
  });
}

async function handleLaunch(
  params: LaunchParams,
  onFile: (file: File) => void,
): Promise<void> {
  const handles = params.files ?? [];
  for (const handle of handles) {
    try {
      const file = await handle.getFile();
      onFile(file);
    } catch (error) {
      alert(`Failed to open file: ${String(error)}`);
    }
  }
}
