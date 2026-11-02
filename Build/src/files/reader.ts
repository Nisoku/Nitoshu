export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const { result } = reader;
      resolve(typeof result === "string" ? result : "");
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error(`Failed to read file: ${file.name}`));
    };
    reader.readAsText(file);
  });
}
