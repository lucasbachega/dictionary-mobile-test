import type { ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { container as rootContainer, type DependencyContainer } from 'tsyringe';

import { buildConfig } from '@/core/config/env';
import { TOKENS, type Token } from '@/core/di/tokens';
import { DependenciesProvider } from '@/presentation/providers/DependenciesProvider';
import { lightTheme } from '@/presentation/theme/theme';

/** Container de DI isolado por teste: cada dependência pode ser trocada por um fake. */
export function createTestContainer(overrides: Partial<Record<Token, unknown>> = {}): DependencyContainer {
  const child = rootContainer.createChildContainer();
  child.register(TOKENS.Config, { useValue: { ...buildConfig({}), pageSize: 5 } });
  for (const [token, value] of Object.entries(overrides)) {
    child.register(token, { useValue: value });
  }
  return child;
}

export function TestProviders({
  container,
  children,
}: {
  container: DependencyContainer;
  children: ReactNode;
}) {
  return (
    <PaperProvider theme={lightTheme}>
      <DependenciesProvider container={container}>{children}</DependenciesProvider>
    </PaperProvider>
  );
}

export const wrapperFor = (container: DependencyContainer) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <TestProviders container={container}>{children}</TestProviders>;
  };
