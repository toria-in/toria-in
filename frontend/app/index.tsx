import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

// Import tab screens
import DiscoverScreen from './screens/DiscoverScreen';
import PlanScreen from './screens/PlanScreen';
import ProfileScreen from './screens/ProfileScreen';

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'discover' | 'plan' | 'profile'>('discover');

  const renderScreen = () => {
    switch (activeTab) {
      case 'discover':
        return <DiscoverScreen />;
      case 'plan':
        return <PlanScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DiscoverScreen />;
    }
  };

  const renderHeader = () => {
    let title = 'Toria';
    if (activeTab === 'plan') title = 'Plan Your Trip';
    if (activeTab === 'profile') title = 'My Profile';

    return (
      <View style={styles.header}>
        {activeTab === 'discover' ? (
          <View style={styles.headerContent}>
            <Image 
              source={require('../assets/images/toria-logo.jpeg')} 
              style={styles.logo}
            />
            <Text style={styles.headerTitle}>Toria</Text>
          </View>
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
      </View>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1a1a1a" />
        
        {renderHeader()}
        
        <View style={styles.content}>
          {renderScreen()}
        </View>
        
        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Ionicons
              name={activeTab === 'discover' ? 'play-circle' : 'play-circle-outline'}
              size={24}
              color={activeTab === 'discover' ? '#ff6b35' : '#8e8e93'}
            />
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'plan' && styles.activeTab]}
            onPress={() => setActiveTab('plan')}
          >
            <Ionicons
              name={activeTab === 'plan' ? 'map' : 'map-outline'}
              size={24}
              color={activeTab === 'plan' ? '#ff6b35' : '#8e8e93'}
            />
            <Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>
              Plan
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={24}
              color={activeTab === 'profile' ? '#ff6b35' : '#8e8e93'}
            />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    height: Platform.OS === 'ios' ? 90 : 70,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Add any active tab styling if needed
  },
  tabText: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ff6b35',
  },
});