import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: '#4CAF50',
        backgroundColor: '#2a2a2a',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      }}
      text2Style={{
        fontSize: 14,
        color: '#8e8e93',
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: '#ff4444',
        backgroundColor: '#2a2a2a',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      }}
      text2Style={{
        fontSize: 14,
        color: '#8e8e93',
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: '#ff6b35',
        backgroundColor: '#2a2a2a',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      }}
      text2Style={{
        fontSize: 14,
        color: '#8e8e93',
      }}
    />
  ),
};

// Add a default export to satisfy Expo Router's requirement
export default function ToastConfig() {
  return null; // This component doesn't render anything directly
}