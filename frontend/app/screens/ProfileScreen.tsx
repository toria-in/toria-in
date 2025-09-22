import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FlatGrid } from 'react-native-super-grid';

import { getUserDayPlans, getSavedReels } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface DayPlan {
  id: string;
  title: string;
  city: string;
  going_with: string;
  focus: string;
  status: string;
  stops: any[];
  created_at: string;
}

interface SavedReel {
  id: string;
  title: string;
  location: string;
  type: string;
  embed_code: string;
}

const ProfileScreen: React.FC = () => {
  const [userId] = useState<string>('user-demo-123'); // Mock user ID
  const [activeTab, setActiveTab] = useState<'plans' | 'saved' | 'content'>('plans');

  // Fetch user day plans
  const {
    data: dayPlans = [],
    isLoading: plansLoading,
  } = useQuery({
    queryKey: ['dayPlans', userId],
    queryFn: () => getUserDayPlans(userId),
  });

  // Fetch saved reels
  const {
    data: savedReels = [],
    isLoading: reelsLoading,
  } = useQuery({
    queryKey: ['savedReels', userId],
    queryFn: () => getSavedReels(userId),
  });

  const currentPlans = dayPlans.filter((plan: DayPlan) => plan.status === 'current');
  const upcomingPlans = dayPlans.filter((plan: DayPlan) => plan.status === 'upcoming');
  const pastPlans = dayPlans.filter((plan: DayPlan) => plan.status === 'past');

  const handleStartMyDay = (planId: string) => {
    Alert.alert(
      'Start My Day',
      'Ready to begin your adventure?',
      [
        {
          text: 'Get Directions',
          onPress: () => {
            Alert.alert('Opening Maps', 'Multi-stop route will open in Google Maps');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const ProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#ff6b35" />
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.displayName}>Travel Explorer</Text>
      <Text style={styles.userStats}>
        {dayPlans.length} trips • {savedReels.length} saved
      </Text>
    </View>
  );

  const TabNavigation = () => (
    <View style={styles.tabNavigation}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'plans' && styles.activeTab]}
        onPress={() => setActiveTab('plans')}
      >
        <Ionicons
          name={activeTab === 'plans' ? 'map' : 'map-outline'}
          size={20}
          color={activeTab === 'plans' ? '#ff6b35' : '#8e8e93'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'plans' && styles.activeTabText,
        ]}>
          My Day Plans
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'saved' && styles.activeTab]}
        onPress={() => setActiveTab('saved')}
      >
        <Ionicons
          name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={activeTab === 'saved' ? '#ff6b35' : '#8e8e93'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'saved' && styles.activeTabText,
        ]}>
          Saved Reels
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'content' && styles.activeTab]}
        onPress={() => setActiveTab('content')}
      >
        <Ionicons
          name={activeTab === 'content' ? 'stats-chart' : 'stats-chart-outline'}
          size={20}
          color={activeTab === 'content' ? '#ff6b35' : '#8e8e93'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'content' && styles.activeTabText,
        ]}>
          My Content
        </Text>
      </TouchableOpacity>
    </View>
  );

  const DayPlanCard = ({ plan }: { plan: DayPlan }) => (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planMeta}>
            <Ionicons name="location-outline" size={12} color="#8e8e93" />
            {' '}{plan.city} • {plan.stops.length} stops
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: plan.status === 'current' ? '#4CAF50' : plan.status === 'upcoming' ? '#ff6b35' : '#8e8e93' }
        ]}>
          <Text style={styles.statusText}>{plan.status}</Text>
        </View>
      </View>

      <View style={styles.planDetails}>
        <Text style={styles.planDetailText}>
          <Ionicons name="people-outline" size={12} color="#8e8e93" />
          {' '}{plan.going_with}
        </Text>
        <Text style={styles.planDetailText}>
          <Ionicons name="restaurant-outline" size={12} color="#8e8e93" />
          {' '}{plan.focus}
        </Text>
      </View>

      {plan.status === 'current' && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => handleStartMyDay(plan.id)}
        >
          <Ionicons name="play" size={16} color="#ffffff" />
          <Text style={styles.startButtonText}>Start My Day</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const MyDayPlansTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Plans */}
      {currentPlans.length > 0 && (
        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>Current</Text>
          {currentPlans.map((plan: DayPlan) => (
            <DayPlanCard key={plan.id} plan={plan} />
          ))}
        </View>
      )}

      {/* Upcoming Plans */}
      {upcomingPlans.length > 0 && (
        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingPlans.map((plan: DayPlan) => (
            <DayPlanCard key={plan.id} plan={plan} />
          ))}
        </View>
      )}

      {/* Past Plans */}
      {pastPlans.length > 0 && (
        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>Past</Text>
          {pastPlans.map((plan: DayPlan) => (
            <DayPlanCard key={plan.id} plan={plan} />
          ))}
        </View>
      )}

      {dayPlans.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color="#8e8e93" />
          <Text style={styles.emptyTitle}>No Day Plans Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first travel plan in the Plan tab!
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const SavedReelCard = ({ reel }: { reel: SavedReel }) => (
    <TouchableOpacity style={styles.reelCard}>
      <View style={styles.reelThumbnail}>
        <Ionicons name="play-circle" size={40} color="#ff6b35" />
      </View>
      <View style={styles.reelOverlay}>
        <Text style={styles.reelTitle} numberOfLines={2}>
          {reel.title}
        </Text>
        <Text style={styles.reelLocation}>
          <Ionicons name="location-outline" size={10} color="#ffffff" />
          {' '}{reel.location}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const SavedReelsTab = () => (
    <View style={styles.tabContent}>
      {savedReels.length > 0 ? (
        <FlatGrid
          itemDimension={screenWidth / 2 - 30}
          data={savedReels}
          style={styles.reelGrid}
          spacing={10}
          renderItem={({ item }) => <SavedReelCard reel={item} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color="#8e8e93" />
          <Text style={styles.emptyTitle}>No Saved Reels</Text>
          <Text style={styles.emptySubtitle}>
            Save reels you love from the Discover tab!
          </Text>
        </View>
      )}
    </View>
  );

  const MyContentTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Uploads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{savedReels.length}</Text>
          <Text style={styles.statLabel}>Saves</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Add-to-Plan</Text>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Ionicons name="camera-outline" size={64} color="#8e8e93" />
        <Text style={styles.emptyTitle}>Creator Dashboard</Text>
        <Text style={styles.emptySubtitle}>
          Share your travel experiences and track your content performance
        </Text>
        <TouchableOpacity style={styles.featureButton}>
          <Text style={styles.featureButtonText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader />
      <TabNavigation />
      
      {activeTab === 'plans' && <MyDayPlansTab />}
      {activeTab === 'saved' && <SavedReelsTab />}
      {activeTab === 'content' && <MyContentTab />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ff6b35',
  },
  settingsButton: {
    padding: 8,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  userStats: {
    color: '#8e8e93',
    fontSize: 16,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3a3a3a',
  },
  tabText: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ff6b35',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  planSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  planMeta: {
    color: '#8e8e93',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  planDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  planDetailText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reelGrid: {
    flex: 1,
  },
  reelCard: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  reelThumbnail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3a3a',
  },
  reelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  reelLocation: {
    color: '#ffffff',
    fontSize: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ff6b35',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  featureButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  featureButtonText: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;