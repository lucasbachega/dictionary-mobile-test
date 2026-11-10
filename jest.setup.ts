/* eslint-disable @typescript-eslint/no-require-imports */
import 'reflect-metadata';

// Mock oficial: fornece insets fixos para SafeAreaView/useSafeAreaInsets nos testes.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
