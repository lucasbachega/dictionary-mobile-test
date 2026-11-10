import { Link } from 'expo-router';
import { Button } from 'react-native-paper';

import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../providers/AuthProvider';

export function SignInScreen() {
  const { signIn } = useAuth();
  return (
    <AuthForm
      mode="signIn"
      onSubmit={signIn}
      footer={
        <Link href="/sign-up" asChild>
          <Button>Não tem conta? Criar conta</Button>
        </Link>
      }
    />
  );
}
