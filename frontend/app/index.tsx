import { Redirect } from 'expo-router';

// Root index redirects to tabs
export default function Index() {
  return <Redirect href="/(tabs)" />;
}