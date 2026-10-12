export function getElement<T extends HTMLElement>(
  id: string,
  guard: (element: HTMLElement) => element is T,
): T {
  const element = document.getElementById(id);
  if (element === null || !guard(element)) {
    throw new Error(`Expected element #${id} to exist and be of the correct type.`);
  }
  return element;
}
