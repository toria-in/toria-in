import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { fetchUserDayPlans, fetchSavedReels, trackEvent } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface DayPlan {
  id: string;
  title: string;
  city: string;
  going_with: string;
  focus: string;
  date: string;
  status: 'current' | 'upcoming' | 'past';
  stops: Array<{
    id: string;
    name: string;
    type: 'Food' | 'Place';
    time_window: string;
    quick_info: string;
    completed?: boolean;
  }>;
  items_count: number;
}

interface SavedReel {
  id: string;
  title: string;
  thumbnail_url: string;
  location: string;
  type: string;
  instagram_url: string;
}

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, icon, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: Colors.primary }]}>
            <Ionicons name={icon as any} size={20} color={Colors.textPrimary} />
          </View>
          <Text style={[styles.sectionTitle, Typography.h4]}>{title}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Day Plan Row Component
const DayPlanRow: React.FC<{
  plan: DayPlan;
  onStartDay?: (plan: DayPlan) => void;
  onViewDetails?: (plan: DayPlan) => void;
}> = ({ plan, onStartDay, onViewDetails }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return Colors.current;
      case 'upcoming': return Colors.upcoming;
      case 'past': return Colors.past;
      default: return Colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return 'play-circle';
      case 'upcoming': return 'time';
      case 'past': return 'checkmark-circle';
      default: return 'calendar';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <TouchableOpacity
      style={[styles.planRow, { borderLeftColor: getStatusColor(plan.status) }]}
      onPress={() => onViewDetails?.(plan)}
    >
      <View style={styles.planRowHeader}>
        <View style={styles.planRowLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(plan.status) }]}>
            <Ionicons name={getStatusIcon(plan.status) as any} size={16} color={Colors.textPrimary} />
          </View>
          <View style={styles.planInfo}>
            <Text style={[styles.planTitle, Typography.body1]} numberOfLines={1}>
              {plan.city} — {plan.going_with} — {plan.focus}
            </Text>
            <Text style={[styles.planMeta, Typography.caption]}>
              {formatDate(plan.date)} • {plan.items_count} stops
            </Text>
          </View>
        </View>
        
        {plan.status === 'current' && onStartDay && (
          <TouchableOpacity
            style={styles.startDayButton}
            onPress={() => onStartDay(plan)}
          >
            <Text style={styles.startDayText}>Start My Day</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Saved Reel Grid Item
const SavedReelItem: React.FC<{
  reel: SavedReel;
  onPress: () => void;
  onAddToPlan: () => void;
}> = ({ reel, onPress, onAddToPlan }) => {
  return (
    <TouchableOpacity style={styles.reelItem} onPress={onPress}>
      <View style={styles.reelThumbnail}>
        <View style={[styles.reelPlaceholder, { backgroundColor: Colors.backgroundAccent }]}>
          <Ionicons name="play" size={24} color={Colors.primary} />
        </View>
        <View style={styles.reelOverlay}>
          <Text style={[styles.reelType, { backgroundColor: reel.type === 'Food' ? Colors.food : Colors.place }]}>
            {reel.type}
          </Text>
        </View>
      </View>
      <Text style={[styles.reelTitle, Typography.body2]} numberOfLines={2}>
        {reel.title}
      </Text>
      <Text style={[styles.reelLocation, Typography.caption]} numberOfLines={1}>
        📍 {reel.location}
      </Text>
      
      <TouchableOpacity
        style={styles.addToPlanButton}
        onPress={onAddToPlan}
      >
        <Ionicons name="add-circle" size={16} color={Colors.primary} />
        <Text style={styles.addToPlanText}>Add to Plan</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Start My Day Modal Component
const StartMyDayModal: React.FC<{
  visible: boolean;
  plan: DayPlan | null;
  onClose: () => void;
}> = ({ visible, plan, onClose }) => {
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());

  const handleStopComplete = (stopId: string) => {
    const newCompleted = new Set(completedStops);
    if (newCompleted.has(stopId)) {
      newCompleted.delete(stopId);
    } else {
      newCompleted.add(stopId);
      // Show feedback modal
      Toast.show({
        type: 'success',
        text1: '✓ Stop Completed!',
        text2: 'How was your experience?',
      });
    }
    setCompletedStops(newCompleted);
  };

  const handleGetDirections = async () => {
    if (!plan?.stops.length) return;

    const waypoints = plan.stops.map(stop => encodeURIComponent(stop.name)).join('/');
    const googleMapsUrl = `https://www.google.com/maps/dir/${waypoints}`;
    
    try {
      await Linking.openURL(googleMapsUrl);
      trackEvent('start_my_day_directions', { plan_id: plan.id });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Open Maps',
        text2: 'Please check if Google Maps is installed',
      });
    }
  };

  if (!plan) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Text style={[styles.modalTitle, Typography.h3]}>Day 1</Text>
            <Text style={[styles.modalSubtitle, Typography.body2]}>
              {plan.city} • {plan.going_with}
            </Text>
          </View>
          <View style={styles.modalHeaderRight}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate" size={20} color={Colors.textPrimary} />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.modalContent}>
          {plan.stops.map((stop, index) => (
            <View key={stop.id} style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={styles.stopInfo}>
                  <Text style={[styles.stopName, Typography.h4]}>{stop.name}</Text>
                  <View style={styles.stopMeta}>
                    <View style={[
                      styles.stopType,
                      { backgroundColor: stop.type === 'Food' ? Colors.food : Colors.place }
                    ]}>
                      <Ionicons
                        name={stop.type === 'Food' ? 'restaurant' : 'location'}
                        size={12}
                        color={Colors.textPrimary}
                      />
                      <Text style={styles.stopTypeText}>{stop.type}</Text>
                    </View>
                    <Text style={[styles.stopTime, Typography.caption]}>
                      {stop.time_window}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    completedStops.has(stop.id) && styles.checkButtonCompleted
                  ]}
                  onPress={() => handleStopComplete(stop.id)}
                >
                  <Ionicons
                    name={completedStops.has(stop.id) ? 'checkmark' : 'square-outline'}
                    size={20}
                    color={completedStops.has(stop.id) ? Colors.textPrimary : Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.stopQuickInfo, Typography.body2]}>
                {stop.quick_info}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.addItemButton}>
            <Ionicons name="add-circle" size={20} color={Colors.primary} />
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [startMyDayModal, setStartMyDayModal] = useState<{
    visible: boolean;
    plan: DayPlan | null;
  }>({ visible: false, plan: null });

  // Fetch user's day plans
  const {
    data: dayPlans = [],
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['userDayPlans', user?.id],
    queryFn: () => fetchUserDayPlans(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch saved reels
  const {
    data: savedReels = [],
    isLoading: reelsLoading,
    refetch: refetchReels,
  } = useQuery({
    queryKey: ['savedReels', user?.id],
    queryFn: () => fetchSavedReels(user?.id || ''),
    enabled: !!user?.id,
  });

  // Group day plans by status
  const currentPlans = dayPlans.filter(plan => plan.status === 'current');
  const upcomingPlans = dayPlans.filter(plan => plan.status === 'upcoming');
  const pastPlans = dayPlans.filter(plan => plan.status === 'past');

  // Handle Start My Day
  const handleStartMyDay = (plan: DayPlan) => {
    setStartMyDayModal({ visible: true, plan });
    trackEvent('start_my_day_opened', { plan_id: plan.id });
  };

  // Handle settings navigation
  const handleSettings = (setting: string) => {
    switch (setting) {
      case 'language':
        Alert.alert('Language Settings', 'Language preferences coming soon!');
        break;
      case 'notifications':
        Alert.alert('Notifications', 'Notification settings coming soon!');
        break;
      case 'privacy':
        Alert.alert('Privacy & Safety', 'Privacy settings coming soon!');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Help center coming soon!');
        break;
      case 'legal':
        Alert.alert('Legal', 'Terms and privacy policy coming soon!');
        break;
      case 'logout':
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ]
        );
        break;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Ionicons name="person-circle-outline" size={64} color={Colors.textMuted} />
          <Text style={[styles.notLoggedInText, Typography.h4]}>
            Please sign in to view your profile
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View style={[styles.profileAvatar, { backgroundColor: Colors.primary }]}>
              <Text style={styles.profileInitial}>
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, Typography.h3]}>
                {user.displayName || 'Traveler'}
              </Text>
              <Text style={[styles.profileEmail, Typography.body2]}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>

        {/* 1. My Day Plans */}
        <CollapsibleSection title="My Day Plans" icon="calendar" defaultExpanded={true}>
          {plansLoading ? (
            <Text style={[styles.loadingText, Typography.body2]}>Loading your plans...</Text>
          ) : (
            <View style={styles.plansContainer}>
              {/* Current Plans */}
              {currentPlans.length > 0 && (
                <View style={styles.planGroup}>
                  <Text style={[styles.planGroupTitle, Typography.body1]}>Current</Text>
                  {currentPlans.map(plan => (
                    <DayPlanRow
                      key={plan.id}
                      plan={plan}
                      onStartDay={handleStartMyDay}
                    />
                  ))}
                </View>
              )}

              {/* Upcoming Plans */}
              {upcomingPlans.length > 0 && (
                <View style={styles.planGroup}>
                  <Text style={[styles.planGroupTitle, Typography.body1]}>Upcoming</Text>
                  {upcomingPlans.map(plan => (
                    <DayPlanRow key={plan.id} plan={plan} />
                  ))}
                </View>
              )}

              {/* Past Plans */}
              {pastPlans.length > 0 && (
                <View style={styles.planGroup}>
                  <Text style={[styles.planGroupTitle, Typography.body1]}>Past</Text>
                  {pastPlans.map(plan => (
                    <DayPlanRow key={plan.id} plan={plan} />
                  ))}
                </View>
              )}

              {dayPlans.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
                  <Text style={[styles.emptyText, Typography.body2]}>
                    No day plans yet. Start planning your next adventure!
                  </Text>
                </View>
              )}
            </View>
          )}
        </CollapsibleSection>

        {/* 2. Saved / Favorite Reels */}
        <CollapsibleSection title="Saved Reels" icon="bookmark">
          {reelsLoading ? (
            <Text style={[styles.loadingText, Typography.body2]}>Loading saved reels...</Text>
          ) : (
            <View style={styles.reelsContainer}>
              {savedReels.length > 0 ? (
                <FlatList
                  data={savedReels}
                  renderItem={({ item }) => (
                    <SavedReelItem
                      reel={item}
                      onPress={() => {
                        // Open reel detail or Instagram
                        trackEvent('saved_reel_viewed', { reel_id: item.id });
                      }}
                      onAddToPlan={() => {
                        Toast.show({
                          type: 'success',
                          text1: 'Added to Plan!',
                          text2: 'Reel added to your day plan',
                        });
                      }}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.reelsRow}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={48} color={Colors.textMuted} />
                  <Text style={[styles.emptyText, Typography.body2]}>
                    No saved reels yet. Save your favorite places from Discover!
                  </Text>
                </View>
              )}
            </View>
          )}
        </CollapsibleSection>

        {/* 3. My Content & Stats */}
        <CollapsibleSection title="My Content & Stats" icon="stats-chart">
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, Typography.h3]}>0</Text>
              <Text style={[styles.statLabel, Typography.caption]}>Uploads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, Typography.h3]}>0</Text>
              <Text style={[styles.statLabel, Typography.caption]}>Views</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, Typography.h3]}>
                {savedReels.length}
              </Text>
              <Text style={[styles.statLabel, Typography.caption]}>Saves</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, Typography.h3]}>
                {dayPlans.length}
              </Text>
              <Text style={[styles.statLabel, Typography.caption]}>Plans</Text>
            </View>
          </View>
        </CollapsibleSection>

        {/* 4. Settings */}
        <CollapsibleSection title="Settings" icon="settings">
          <View style={styles.settingsContainer}>
            {[
              { icon: 'language', label: 'Language (EN/HI)', action: 'language' },
              { icon: 'notifications', label: 'Notifications', action: 'notifications' },
              { icon: 'shield', label: 'Privacy & Safety', action: 'privacy' },
              { icon: 'help-circle', label: 'Help & Support', action: 'help' },
              { icon: 'document-text', label: 'Legal', action: 'legal' },
              { icon: 'log-out', label: 'Logout', action: 'logout' },
            ].map((setting) => (
              <TouchableOpacity
                key={setting.action}
                style={styles.settingItem}
                onPress={() => handleSettings(setting.action)}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name={setting.icon as any} size={20} color={Colors.textSecondary} />
                  <Text style={[styles.settingLabel, Typography.body1]}>
                    {setting.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </CollapsibleSection>
      </ScrollView>

      {/* Start My Day Modal */}
      <StartMyDayModal
        visible={startMyDayModal.visible}
        plan={startMyDayModal.plan}
        onClose={() => setStartMyDayModal({ visible: false, plan: null })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    color: Colors.textSecondary,
  },
  sectionContainer: {
    backgroundColor: Colors.backgroundPrimary,
    marginBottom: Spacing.s,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.backgroundSecondary,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: Colors.textPrimary,
  },
  sectionContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
  },
  plansContainer: {
    gap: Spacing.m,
  },
  planGroup: {
    gap: Spacing.s,
  },
  planGroupTitle: {
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.s,
  },
  planRow: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.l,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    ...Shadows.small,
  },
  planRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    flex: 1,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  planMeta: {
    color: Colors.textMuted,
  },
  startDayButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    borderRadius: BorderRadius.m,
  },
  startDayText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  reelsContainer: {
    gap: Spacing.s,
  },
  reelsRow: {
    justifyContent: 'space-between',
  },
  reelItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.l,
    padding: Spacing.s,
    width: (screenWidth - Spacing.m * 3) / 2,
    ...Shadows.small,
  },
  reelThumbnail: {
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.m,
    overflow: 'hidden',
    marginBottom: Spacing.s,
    position: 'relative',
  },
  reelPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelOverlay: {
    position: 'absolute',
    top: Spacing.s,
    right: Spacing.s,
  },
  reelType: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reelTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  reelLocation: {
    color: Colors.textMuted,
    marginBottom: Spacing.s,
  },
  addToPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  addToPlanText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  statCard: {
    backgroundColor: Colors.backgroundSecondary,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.l,
    ...Shadows.small,
  },
  statNumber: {
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textMuted,
  },
  settingsContainer: {
    gap: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  settingLabel: {
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.s,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.m,
  },
  notLoggedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
  },
  notLoggedInText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    color: Colors.textMuted,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    borderRadius: BorderRadius.m,
    gap: 4,
  },
  directionsText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.m,
  },
  stopCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    marginVertical: Spacing.s,
    ...Shadows.small,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.s,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    color: Colors.textPrimary,
    marginBottom: Spacing.s,
  },
  stopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  stopType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  stopTypeText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  stopTime: {
    color: Colors.textMuted,
  },
  checkButton: {
    padding: 4,
  },
  checkButtonCompleted: {
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  stopQuickInfo: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  modalFooter: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.l,
    gap: Spacing.s,
  },
  addItemText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;