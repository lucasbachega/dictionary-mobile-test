import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { DependencyContainer } from 'tsyringe';

import type { Token } from '@/core/di/tokens';

const DependenciesContext = createContext<DependencyContainer | null>(null);

export function DependenciesProvider({
  container,
  children,
}: {
  container: DependencyContainer;
  children: ReactNode;
}) {
  return <DependenciesContext.Provider value={container}>{children}</DependenciesContext.Provider>;
}

/** Resolve uma dependência do container de DI atual (o de testes pode ser outro). */
export function useDependency<T>(token: Token): T {
  const container = useContext(DependenciesContext);
  if (!container) throw new Error('useDependency deve ser usado dentro de <DependenciesProvider>.');
  return useMemo(() => container.resolve<T>(token), [container, token]);
}
