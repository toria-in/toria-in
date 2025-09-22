import { Redirect } from 'expo-router';

// Root index redirects to tabs
export default function RootIndex() {
  return <Redirect href="/(tabs)" />;
}