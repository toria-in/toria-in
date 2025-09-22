import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform, View, Text, Image } from 'react-native';

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ff6b35',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: '#2a2a2a',
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            height: Platform.OS === 'ios' ? 90 : 70,
          },
          headerStyle: {
            backgroundColor: '#1a1a1a',
            borderBottomColor: '#2a2a2a',
            borderBottomWidth: 1,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image 
                  source={require('../assets/images/toria-logo.jpeg')} 
                  style={{ width: 32, height: 32, marginRight: 8, borderRadius: 16 }}
                />
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Toria</Text>
              </View>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'play-circle' : 'play-circle-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plan',
            headerTitle: 'Plan Your Trip',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'map' : 'map-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'My Profile',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}