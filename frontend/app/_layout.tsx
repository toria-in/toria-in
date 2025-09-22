import React from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Colors } from '../constants/Colors';

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Toast configuration with new colors
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: Colors.success,
        backgroundColor: Colors.backgroundTertiary,
        borderWidth: 0,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.textMuted,
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: Colors.error,
        backgroundColor: Colors.backgroundTertiary,
        borderWidth: 0,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.textMuted,
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: Colors.primary,
        backgroundColor: Colors.backgroundTertiary,
        borderWidth: 0,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.textMuted,
      }}
    />
  ),
};

const InitialLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    } else if (!inAuthGroup && !inTabsGroup && isAuthenticated) {
      // Handle other authenticated routes
      return;
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.backgroundPrimary} />
      <Slot />
      <Toast config={toastConfig} />
    </>
  );
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}