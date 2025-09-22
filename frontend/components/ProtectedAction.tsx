import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedActionProps extends TouchableOpacityProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  onPress?: () => void;
  fallbackMessage?: string;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  children,
  requireAuth = true,
  onPress,
  fallbackMessage = 'Please sign in to continue',
  ...props
}) => {
  const { isAuthenticated } = useAuth();

  const handlePress = () => {
    if (requireAuth && !isAuthenticated) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: fallbackMessage,
      });
      router.push('/(auth)/login');
      return;
    }

    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity {...props} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
};

export default ProtectedAction;