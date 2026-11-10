import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/errors/AppError';
import { hasErrors, validateCredentials, type CredentialErrors } from '@/domain/validation';

import { spacing } from '../theme/theme';

interface AuthFormProps {
  mode: 'signIn' | 'signUp';
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
  footer: React.ReactNode;
}

export function AuthForm({ mode, onSubmit, footer }: AuthFormProps) {
  const theme = useTheme();
  const isSignUp = mode === 'signUp';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return; // evita duplo envio
    const found = validateCredentials(email, password, isSignUp ? confirmPassword : undefined);
    setErrors(found);
    setSubmitError(null);
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={[styles.logo, { backgroundColor: theme.colors.primaryContainer }]}>
            <Icon source="book-open-variant" size={44} color={theme.colors.onPrimaryContainer} />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            {isSignUp ? 'Criar conta' : 'Dictionary'}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {isSignUp
              ? 'Seus favoritos e histórico ficam salvos na sua conta.'
              : 'Entre para ver palavras, salvar favoritos e acompanhar seu histórico.'}
          </Text>

          <TextInput
            label="E-mail"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={!!errors.email}
            left={<TextInput.Icon icon="email-outline" />}
            testID="input-email"
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Senha"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            error={!!errors.password}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              />
            }
            onSubmitEditing={isSignUp ? undefined : handleSubmit}
            testID="input-password"
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          {isSignUp ? (
            <>
              <TextInput
                label="Confirmar senha"
                mode="outlined"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={!!errors.confirmPassword}
                left={<TextInput.Icon icon="lock-check-outline" />}
                onSubmitEditing={handleSubmit}
                testID="input-confirm-password"
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>
            </>
          ) : null}

          {submitError ? (
            <Text
              variant="bodyMedium"
              style={[styles.submitError, { color: theme.colors.error }]}
              testID="submit-error"
            >
              {submitError}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            contentStyle={styles.buttonContent}
            testID="submit"
          >
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>

          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { textAlign: 'center', fontWeight: '700', marginTop: spacing.md },
  subtitle: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  submitError: { textAlign: 'center', marginBottom: spacing.md },
  buttonContent: { paddingVertical: 6 },
  footer: { marginTop: spacing.md, alignItems: 'center' },
});
