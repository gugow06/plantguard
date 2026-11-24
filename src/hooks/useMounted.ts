import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** true só no cliente, após a hidratação (substitui o padrão useEffect + setMounted). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
