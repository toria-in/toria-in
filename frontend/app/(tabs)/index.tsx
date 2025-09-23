import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';

import { fetchReels, upvoteReel, saveReel, trackEvent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Reel {
  id: string;
  instagram_url: string;
  embed_code: string;
  title: string;
  description?: string;
  location: string;
  type: string;
  creator_handle?: string;
  tags: string[];
  metadata: Record<string, any>;
  upvotes: number;
  saves: number;
}

// City selection modal component with search
const CitySelectionModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
  currentCity: string;
}> = ({ isVisible, onClose, onSelect, currentCity }) => {
  const [searchText, setSearchText] = useState('');
  
  const popularCities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Goa', 'Udaipur', 'Jodhpur', 'Varanasi', 'Rishikesh', 'Manali'
  ];

  const filteredCities = popularCities.filter(city =>
    city.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.6}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View
        style={[styles.modalContent, { backgroundColor: Colors.backgroundSecondary }]}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, Typography.h3]}>Select City</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
          {filteredCities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityItem,
                currentCity === city && styles.selectedCityItem
              ]}
              onPress={() => {
                onSelect(city);
                onClose();
                trackEvent('city_selected', { city });
              }}
            >
              <Ionicons name="location" size={16} color={currentCity === city ? Colors.primary : Colors.textMuted} />
              <Text style={[
                styles.cityText,
                currentCity === city && styles.selectedCityText
              ]}>
                {city}
              </Text>
              {currentCity === city && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Add to Plan Modal component with enhanced design
const AddToPlanModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  reel: Reel | null;
  onAddToNewPlan: () => void;
  onAddToExistingPlan: () => void;
}> = ({ isVisible, onClose, reel, onAddToNewPlan, onAddToExistingPlan }) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.bottomModal}
      swipeDirection="down"
      onSwipeComplete={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View
        style={[styles.bottomModalContent, { backgroundColor: Colors.backgroundSecondary }]}
      >
        <View style={[styles.modalHandle, { backgroundColor: Colors.textMuted }]} />
        
        <Text style={[styles.bottomModalTitle, Typography.h3]}>Add to Day Plan</Text>
        <Text style={[styles.bottomModalSubtitle, Typography.body2]}>
          {reel?.title} • {reel?.location}
        </Text>

        <TouchableOpacity
          style={styles.planOption}
          onPress={() => {
            onAddToNewPlan();
            trackEvent('reel_add_to_plan', { reel_id: reel?.id, plan_type: 'new' });
          }}
        >
          <View
            style={[styles.planOptionIcon, { backgroundColor: Colors.primary }]}
          >
            <Ionicons name="add-circle" size={24} color={Colors.textPrimary} />
          </View>
          <View style={styles.planOptionContent}>
            <Text style={styles.planOptionTitle}>New Day Plan</Text>
            <Text style={styles.planOptionSubtitle}>Create a new plan for {reel?.location}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.planOption}
          onPress={() => {
            onAddToExistingPlan();
            trackEvent('reel_add_to_plan', { reel_id: reel?.id, plan_type: 'existing' });
          }}
        >
          <View
            style={[styles.planOptionIcon, { backgroundColor: Colors.secondary }]}
          >
            <Ionicons name="calendar" size={24} color={Colors.textPrimary} />
          </View>
          <View style={styles.planOptionContent}>
            <Text style={styles.planOptionTitle}>Existing Plan</Text>
            <Text style={styles.planOptionSubtitle}>Add to upcoming plan</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// Move components outside to fix React Hooks violation
const LocationFilter: React.FC<{
  currentLocation: string;
  selectedItinerary: string | null;
  onLocationPress: () => void;
  onClearItinerary: () => void;
}> = ({ currentLocation, selectedItinerary, onLocationPress, onClearItinerary }) => (
  <View style={styles.filterContainer}>
    <TouchableOpacity style={styles.filterPill} onPress={onLocationPress}>
      <View
        style={[styles.filterGradient, { backgroundColor: Colors.primary }]}
      >
        <Ionicons name="location" size={16} color={Colors.textPrimary} />
        <Text style={styles.filterText}>{currentLocation}</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textPrimary} />
      </View>
    </TouchableOpacity>
    
    {selectedItinerary && (
      <TouchableOpacity 
        style={[styles.filterPill, styles.itineraryPill]}
        onPress={onClearItinerary}
      >
        <View
          style={[styles.filterGradient, { backgroundColor: Colors.success }]}
        >
          <Ionicons name="map" size={16} color={Colors.textPrimary} />
          <Text style={[styles.filterText, { color: Colors.textPrimary }]}>My Plan</Text>
          <Ionicons name="close" size={16} color={Colors.textPrimary} />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

const ReelCard: React.FC<{
  reel: Reel;
  onUpvote: (id: string) => void;
  onSave: (id: string) => void;
  onAddToPlan: (reel: Reel) => void;
  isUpvoting: boolean;
  isSaving: boolean;
}> = ({ reel, onUpvote, onSave, onAddToPlan, isUpvoting, isSaving }) => {
  return (
    <View style={[styles.reelCard, Shadows.medium]}>
      {/* Header with enhanced styling */}
      <View style={styles.reelHeader}>
        <View style={styles.reelInfo}>
          <Text style={[styles.reelTitle, Typography.h4]}>{reel.title}</Text>
          <Text style={styles.reelLocation}>
            <Ionicons name="location-outline" size={12} color={Colors.primary} />
            {' '}{reel.location}
          </Text>
        </View>
        <View style={styles.reelMeta}>
          {reel.creator_handle && (
            <View
              style={[styles.creatorBadge, { backgroundColor: Colors.accent }]}
            >
              <Text style={styles.creatorHandle}>{reel.creator_handle}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Enhanced Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
      >
        <View
          style={[styles.chip, { backgroundColor: reel.type === 'Food' ? Colors.food : Colors.place }]}
        >
          <Ionicons 
            name={reel.type === 'Food' ? 'restaurant' : 'location'} 
            size={12} 
            color={Colors.textPrimary} 
          />
          <Text style={styles.chipText}>{reel.type}</Text>
        </View>
        
        {reel.metadata.price && (
          <View style={[styles.chip, { backgroundColor: Colors.backgroundAccent }]}>
            <Ionicons name="card" size={12} color={Colors.accent} />
            <Text style={styles.chipText}>{reel.metadata.price}</Text>
          </View>
        )}
        {reel.metadata.hygiene && (
          <View style={[styles.chip, { backgroundColor: Colors.backgroundAccent }]}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
            <Text style={styles.chipText}>{reel.metadata.hygiene}</Text>
          </View>
        )}
        {reel.metadata.timing && (
          <View style={[styles.chip, { backgroundColor: Colors.backgroundAccent }]}>
            <Ionicons name="time" size={12} color={Colors.secondary} />
            <Text style={styles.chipText}>{reel.metadata.timing}</Text>
          </View>
        )}
      </ScrollView>

      {/* Enhanced Native Reel Display */}
      <View style={styles.reelDisplay}>
        <View
          style={[styles.reelVideoPlaceholder, { backgroundColor: Colors.backgroundAccent }]}
        >
          <TouchableOpacity style={styles.playIconContainer}>
            <View
              style={[styles.playButton, { backgroundColor: Colors.primary }]}
            >
              <Ionicons name="play" size={32} color={Colors.textPrimary} />
            </View>
          </TouchableOpacity>
          
          <View
            style={styles.reelOverlay}
          >
            <Text style={[styles.reelTitleLarge, Typography.h4]}>{reel.title}</Text>
            {reel.description && (
              <Text style={[styles.reelDescription, Typography.body2]} numberOfLines={2}>
                {reel.description}
              </Text>
            )}
            <View style={styles.reelMetaRow}>
              <TouchableOpacity style={styles.instagramLinkButton}>
                <View
                  style={[styles.instagramGradient, { backgroundColor: '#E1306C' }]}
                >
                  <Ionicons name="logo-instagram" size={14} color={Colors.textPrimary} />
                </View>
                <Text style={styles.instagramLink}>View on Instagram</Text>
              </TouchableOpacity>
              <View style={styles.reelStatsContainer}>
                <Ionicons name="heart" size={12} color={Colors.primary} />
                <Text style={styles.reelStats}>{reel.upvotes} likes</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isUpvoting ? Colors.primaryLight : Colors.backgroundAccent }]}
          onPress={() => {
            onUpvote(reel.id);
            trackEvent('reel_upvote', { reel_id: reel.id });
          }}
          disabled={isUpvoting}
        >
          <Ionicons name="thumbs-up" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>{reel.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isSaving ? Colors.accentLight : Colors.backgroundAccent }]}
          onPress={() => {
            onSave(reel.id);
            trackEvent('reel_saved', { reel_id: reel.id });
          }}
          disabled={isSaving}
        >
          <Ionicons name="bookmark" size={20} color={Colors.accent} />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onAddToPlan(reel)}
        >
          <View
            style={[styles.addButtonGradient, { backgroundColor: Colors.primary }]}
          >
            <Ionicons name="add-circle" size={20} color={Colors.textPrimary} />
            <Text style={[styles.actionText, { color: Colors.textPrimary }]}>Add to Plan</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const EmptyState: React.FC<{
  currentLocation: string;
  onRefresh: () => void;
}> = ({ currentLocation, onRefresh }) => (
  <View style={styles.emptyState}>
    <View
      style={[styles.emptyIconContainer, { backgroundColor: Colors.primary + '30' }]}
    >
      <Ionicons name="location-outline" size={64} color={Colors.primary} />
    </View>
    <Text style={[styles.emptyTitle, Typography.h3]}>Discovering {currentLocation}</Text>
    <Text style={[styles.emptySubtitle, Typography.body2]}>
      We're curating fresh reels for your city. Try another location or check back soon!
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
      <View
        style={[styles.retryButtonGradient, { backgroundColor: Colors.primary }]}
      >
        <Text style={styles.retryText}>Refresh</Text>
      </View>
    </TouchableOpacity>
  </View>
);

const DiscoverScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addPendingItem } = usePlan();
  const [currentLocation, setCurrentLocation] = useState<string>('Delhi');
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [addToPlanModal, setAddToPlanModal] = useState<{
    visible: boolean;
    reel: Reel | null;
  }>({ visible: false, reel: null });

  // All hooks called at the top level - no conditional calls
  const {
    data: reels = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['reels', currentLocation, selectedItinerary],
    queryFn: () => fetchReels({ location: currentLocation }),
    enabled: !!currentLocation,
    onSuccess: () => {
      trackEvent('discover_impression', { location: currentLocation, count: reels.length });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: upvoteReel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      Toast.show({
        type: 'success',
        text1: 'Upvoted! 👍',
        text2: 'Thanks for your feedback',
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ reelId }: { reelId: string }) => saveReel(reelId, user?.id || 'anonymous'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedReels'] });
      Toast.show({
        type: 'success',
        text1: 'Saved! 🔖',
        text2: 'Reel saved to your favorites',
      });
    },
  });

  // Get location permission - effect after all hooks
  useEffect(() => {
    getLocationPermission();
    trackEvent('screen_view', { screen: 'discover' });
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'info',
          text1: 'Location Permission',
          text2: 'Enable location for better content discovery',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.city) {
        setCurrentLocation(address.city);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const handleUpvote = (reelId: string) => {
    upvoteMutation.mutate(reelId);
  };

  const handleSave = (reelId: string) => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Login Required 🔐',
        text2: 'Please sign in to save reels',
      });
      return;
    }
    saveMutation.mutate({ reelId });
  };

  const handleAddToPlan = (reel: Reel) => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Login Required 🔐',
        text2: 'Please sign in to create plans',
      });
      return;
    }
    setAddToPlanModal({ visible: true, reel });
  };

  const handleClearItinerary = () => {
    setSelectedItinerary(null);
    trackEvent('filter_itinerary_cleared');
  };

  const handleCitySelect = (city: string) => {
    setCurrentLocation(city);
    trackEvent('filter_place_set', { city });
  };

  const handleAddToNewPlan = () => {
    const reel = addToPlanModal.reel;
    if (reel) {
      // Add to pending items
      addPendingItem({
        id: reel.id,
        title: reel.title,
        location: reel.location,
        type: reel.type,
        raw: reel
      });
    }
    setAddToPlanModal({ visible: false, reel: null });
    Toast.show({
      type: 'success',
      text1: 'Added to Plan! ✨',
      text2: 'Go to Plan tab to complete your itinerary',
    });
  };

  const handleAddToExistingPlan = () => {
    const reel = addToPlanModal.reel;
    if (reel) {
      // Add to pending items for existing plans too
      addPendingItem({
        id: reel.id,
        title: reel.title,
        location: reel.location,
        type: reel.type,
        raw: reel
      });
    }
    setAddToPlanModal({ visible: false, reel: null });
    Toast.show({
      type: 'success',
      text1: 'Added to Plan! 📅',
      text2: 'Go to Plan tab to add it to your itinerary',
    });
  };

  const renderReelCard = ({ item }: { item: Reel }) => (
    <ReelCard
      reel={item}
      onUpvote={handleUpvote}
      onSave={handleSave}
      onAddToPlan={handleAddToPlan}
      isUpvoting={upvoteMutation.isPending}
      isSaving={saveMutation.isPending}
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <LocationFilter
          currentLocation={currentLocation}
          selectedItinerary={selectedItinerary}
          onLocationPress={() => setIsCityModalVisible(true)}
          onClearItinerary={handleClearItinerary}
        />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View
              style={[styles.loadingIcon, { backgroundColor: Colors.primary }]}
            >
              <Ionicons name="sparkles" size={32} color={Colors.textPrimary} />
            </View>
            <Text style={[styles.loadingText, Typography.body1]}>
              Discovering amazing places...
            </Text>
          </View>
        ) : reels.length === 0 ? (
          <EmptyState
            currentLocation={currentLocation}
            onRefresh={refetch}
          />
        ) : (
          <FlashList
            data={reels}
            renderItem={renderReelCard}
            keyExtractor={(item) => item.id}
            estimatedItemSize={500}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                titleColor={Colors.textPrimary}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* City Selection Modal */}
        <CitySelectionModal
          isVisible={isCityModalVisible}
          onClose={() => setIsCityModalVisible(false)}
          onSelect={handleCitySelect}
          currentCity={currentLocation}
        />

        {/* Add to Plan Modal */}
        <AddToPlanModal
          isVisible={addToPlanModal.visible}
          onClose={() => setAddToPlanModal({ visible: false, reel: null })}
          reel={addToPlanModal.reel}
          onAddToNewPlan={handleAddToNewPlan}
          onAddToExistingPlan={handleAddToExistingPlan}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  safeArea: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    gap: Spacing.s,
  },
  filterPill: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    gap: 6,
  },
  itineraryPill: {
    // Additional styling handled by gradient
  },
  filterText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAccent,
    borderRadius: BorderRadius.l,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    paddingHorizontal: Spacing.m,
  },
  searchIcon: {
    marginRight: Spacing.s,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  listContainer: {
    paddingBottom: Spacing.m,
  },
  reelCard: {
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.s,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.m,
    paddingBottom: Spacing.s,
  },
  reelInfo: {
    flex: 1,
  },
  reelTitle: {
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reelLocation: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  reelMeta: {
    alignItems: 'flex-end',
  },
  creatorBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.m,
  },
  creatorHandle: {
    color: Colors.backgroundPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipsContainer: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    borderRadius: BorderRadius.l,
    marginRight: Spacing.s,
    gap: 4,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  reelDisplay: {
    marginHorizontal: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: 'hidden',
    marginBottom: Spacing.m,
  },
  reelVideoPlaceholder: {
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.l,
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -32,
    zIndex: 2,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  reelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.m,
    borderBottomLeftRadius: BorderRadius.l,
    borderBottomRightRadius: BorderRadius.l,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  reelTitleLarge: {
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  reelDescription: {
    color: Colors.textSecondary,
    marginBottom: Spacing.s,
    opacity: 0.9,
  },
  reelMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instagramLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instagramGradient: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramLink: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  reelStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reelStats: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    gap: Spacing.s,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    gap: 6,
    ...Shadows.small,
  },
  addButton: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.m,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.m,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.m,
  },
  retryButtonGradient: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
  },
  retryText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles with new colors
  modal: {
    justifyContent: 'center',
    margin: Spacing.m,
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: 0,
    maxHeight: screenHeight * 0.7,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
  },
  citiesList: {
    maxHeight: screenHeight * 0.5,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.s,
  },
  selectedCityItem: {
    backgroundColor: Colors.primary + '20',
  },
  cityText: {
    color: Colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  selectedCityText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Bottom modal styles
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  bottomModalContent: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.m,
    paddingBottom: 40,
    paddingTop: Spacing.m,
  },
  modalHandle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: Spacing.m,
  },
  bottomModalTitle: {
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  bottomModalSubtitle: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.l,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAccent,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.small,
  },
  planOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.s,
  },
  planOptionContent: {
    flex: 1,
  },
  planOptionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  planOptionSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    alignItems: 'center',
    marginTop: Spacing.s,
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiscoverScreen;