import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Gradients } from '../constants/Colors';

export default function TabsLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.backgroundSecondary,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        headerStyle: {
          backgroundColor: Colors.backgroundPrimary,
          borderBottomColor: Colors.border,
          borderBottomWidth: 0,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        headerTintColor: Colors.textPrimary,
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
              <View style={{
                width: 32,
                height: 32,
                marginRight: 8,
                borderRadius: 16,
                backgroundColor: Colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>T</Text>
              </View>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: 20, 
                fontWeight: '800',
                textShadowColor: Colors.primary,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                Toria
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              backgroundColor: focused ? `${Colors.primary}20` : 'transparent',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Ionicons 
                name={focused ? 'play-circle' : 'play-circle-outline'} 
                size={size} 
                color={focused ? Colors.primary : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              color: focused ? Colors.primary : color,
              fontSize: 12,
              fontWeight: focused ? '600' : '400',
              marginTop: 2,
            }}>
              Discover
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 6,
                  height: 24,
                  borderRadius: 3,
                  marginRight: 8,
                  backgroundColor: Colors.secondary,
                }}
              />
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: 18, 
                fontWeight: '700' 
              }}>
                Plan Your Trip
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              backgroundColor: focused ? `${Colors.secondary}20` : 'transparent',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Ionicons 
                name={focused ? 'map' : 'map-outline'} 
                size={size} 
                color={focused ? Colors.secondary : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              color: focused ? Colors.secondary : color,
              fontSize: 12,
              fontWeight: focused ? '600' : '400',
              marginTop: 2,
            }}>
              Plan
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
                <Ionicons name="person" size={16} color={Colors.backgroundPrimary} />
              </View>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: 18, 
                fontWeight: '700' 
              }}>
                {user?.displayName || 'Profile'}
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              backgroundColor: focused ? `${Colors.accent}20` : 'transparent',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size} 
                color={focused ? Colors.accent : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              color: focused ? Colors.accent : color,
              fontSize: 12,
              fontWeight: focused ? '600' : '400',
              marginTop: 2,
            }}>
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}