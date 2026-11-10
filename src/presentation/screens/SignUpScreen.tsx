import { router } from 'expo-router';
import { Button } from 'react-native-paper';

import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../providers/AuthProvider';

export function SignUpScreen() {
  const { signUp } = useAuth();
  return (
    <AuthForm
      mode="signUp"
      onSubmit={signUp}
      footer={
        <Button onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}>
          Já tem conta? Entrar
        </Button>
      }
    />
  );
}
