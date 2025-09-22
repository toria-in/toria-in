import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';

import { fetchReels, upvoteReel, saveReel } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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

// City selection modal component
const CitySelectionModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
  currentCity: string;
}> = ({ isVisible, onClose, onSelect, currentCity }) => {
  const popularCities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad'
  ];

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select City</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.citiesList}>
          {popularCities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityItem,
                currentCity === city && styles.selectedCityItem
              ]}
              onPress={() => {
                onSelect(city);
                onClose();
              }}
            >
              <Text style={[
                styles.cityText,
                currentCity === city && styles.selectedCityText
              ]}>
                {city}
              </Text>
              {currentCity === city && (
                <Ionicons name="checkmark" size={20} color="#ff6b35" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Add to Plan Modal component
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
    >
      <View style={styles.bottomModalContent}>
        <View style={styles.modalHandle} />
        
        <Text style={styles.bottomModalTitle}>Add to Day Plan</Text>
        <Text style={styles.bottomModalSubtitle}>
          {reel?.title} • {reel?.location}
        </Text>

        <TouchableOpacity
          style={styles.planOption}
          onPress={onAddToNewPlan}
        >
          <View style={styles.planOptionIcon}>
            <Ionicons name="add-circle" size={24} color="#ff6b35" />
          </View>
          <View style={styles.planOptionContent}>
            <Text style={styles.planOptionTitle}>New Day Plan</Text>
            <Text style={styles.planOptionSubtitle}>Create a new plan for {reel?.location}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.planOption}
          onPress={onAddToExistingPlan}
        >
          <View style={styles.planOptionIcon}>
            <Ionicons name="calendar" size={24} color="#4CAF50" />
          </View>
          <View style={styles.planOptionContent}>
            <Text style={styles.planOptionTitle}>Existing Plan</Text>
            <Text style={styles.planOptionSubtitle}>Add to upcoming plan</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
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
      <Ionicons name="location" size={16} color="#ff6b35" />
      <Text style={styles.filterText}>{currentLocation}</Text>
      <Ionicons name="chevron-down" size={16} color="#ff6b35" />
    </TouchableOpacity>
    
    {selectedItinerary && (
      <TouchableOpacity 
        style={[styles.filterPill, styles.itineraryPill]}
        onPress={onClearItinerary}
      >
        <Ionicons name="map" size={16} color="#4CAF50" />
        <Text style={[styles.filterText, { color: '#4CAF50' }]}>My Plan</Text>
        <Ionicons name="close" size={16} color="#4CAF50" />
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
    <View style={styles.reelCard}>
      {/* Header */}
      <View style={styles.reelHeader}>
        <View style={styles.reelInfo}>
          <Text style={styles.reelTitle}>{reel.title}</Text>
          <Text style={styles.reelLocation}>
            <Ionicons name="location-outline" size={12} color="#8e8e93" />
            {' '}{reel.location}
          </Text>
        </View>
        <View style={styles.reelMeta}>
          {reel.creator_handle && (
            <Text style={styles.creatorHandle}>{reel.creator_handle}</Text>
          )}
        </View>
      </View>

      {/* Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
      >
        <View style={[styles.chip, { backgroundColor: reel.type === 'Food' ? '#ff6b35' : '#4CAF50' }]}>
          <Text style={styles.chipText}>{reel.type}</Text>
        </View>
        {reel.metadata.price && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{reel.metadata.price}</Text>
          </View>
        )}
        {reel.metadata.hygiene && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{reel.metadata.hygiene}</Text>
          </View>
        )}
        {reel.metadata.vibe && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{reel.metadata.vibe}</Text>
          </View>
        )}
        {reel.metadata.timing && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{reel.metadata.timing}</Text>
          </View>
        )}
      </ScrollView>

      {/* Native Reel Display - Instagram Style */}
      <View style={styles.reelDisplay}>
        <View style={styles.reelVideoPlaceholder}>
          <View style={styles.playIconContainer}>
            <Ionicons name="play-circle" size={64} color="rgba(255, 255, 255, 0.9)" />
          </View>
          <View style={styles.reelOverlay}>
            <Text style={styles.reelTitleLarge}>{reel.title}</Text>
            {reel.description && (
              <Text style={styles.reelDescription} numberOfLines={2}>
                {reel.description}
              </Text>
            )}
            <View style={styles.reelMetaRow}>
              <TouchableOpacity style={styles.instagramLinkButton}>
                <Ionicons name="logo-instagram" size={14} color="#ff6b35" />
                <Text style={styles.instagramLink}>View on Instagram</Text>
              </TouchableOpacity>
              <Text style={styles.reelStats}>
                {reel.upvotes} likes
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onUpvote(reel.id)}
          disabled={isUpvoting}
        >
          <Ionicons name="thumbs-up" size={20} color="#ff6b35" />
          <Text style={styles.actionText}>{reel.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onSave(reel.id)}
          disabled={isSaving}
        >
          <Ionicons name="bookmark" size={20} color="#ff6b35" />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.addButton]}
          onPress={() => onAddToPlan(reel)}
        >
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={[styles.actionText, { color: '#ffffff' }]}>Add to Plan</Text>
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
    <Ionicons name="location-outline" size={64} color="#8e8e93" />
    <Text style={styles.emptyTitle}>Discovering {currentLocation}</Text>
    <Text style={styles.emptySubtitle}>
      We're curating fresh reels for your city. Try another location or check back soon!
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
      <Text style={styles.retryText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

const DiscoverScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
  });

  const upvoteMutation = useMutation({
    mutationFn: upvoteReel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      Toast.show({
        type: 'success',
        text1: 'Upvoted!',
        text2: 'Thanks for your feedback',
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ reelId }: { reelId: string }) => saveReel(reelId, user?.id || 'anonymous'),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Saved!',
        text2: 'Reel saved to your favorites',
      });
    },
  });

  // Get location permission - effect after all hooks
  useEffect(() => {
    getLocationPermission();
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
        text1: 'Login Required',
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
        text1: 'Login Required',
        text2: 'Please sign in to create plans',
      });
      return;
    }
    setAddToPlanModal({ visible: true, reel });
  };

  const handleClearItinerary = () => {
    setSelectedItinerary(null);
  };

  const handleCitySelect = (city: string) => {
    setCurrentLocation(city);
  };

  const handleAddToNewPlan = () => {
    setAddToPlanModal({ visible: false, reel: null });
    Toast.show({
      type: 'success',
      text1: 'Added to New Plan!',
      text2: 'Complete it in the Plan tab',
    });
  };

  const handleAddToExistingPlan = () => {
    setAddToPlanModal({ visible: false, reel: null });
    Toast.show({
      type: 'success',
      text1: 'Added to Existing Plan!',
      text2: 'Check your day plans',
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
    <SafeAreaView style={styles.container}>
      <LocationFilter
        currentLocation={currentLocation}
        selectedItinerary={selectedItinerary}
        onLocationPress={() => setIsCityModalVisible(true)}
        onClearItinerary={handleClearItinerary}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Discovering amazing places...</Text>
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
              tintColor="#ff6b35"
              titleColor="#ffffff"
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  itineraryPill: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  filterText: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  reelCard: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  reelInfo: {
    flex: 1,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reelLocation: {
    color: '#8e8e93',
    fontSize: 12,
  },
  reelMeta: {
    alignItems: 'flex-end',
  },
  creatorHandle: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: '600',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chip: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  reelDisplay: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  reelVideoPlaceholder: {
    height: 300,
    backgroundColor: '#2a2a2a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -32,
    zIndex: 2,
  },
  reelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  reelTitleLarge: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  reelDescription: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
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
    gap: 4,
  },
  instagramLink: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: '600',
  },
  reelStats: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  addButton: {
    backgroundColor: '#ff6b35',
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 0,
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  citiesList: {
    maxHeight: screenHeight * 0.5,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  selectedCityItem: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  cityText: {
    color: '#ffffff',
    fontSize: 16,
  },
  selectedCityText: {
    color: '#ff6b35',
    fontWeight: '600',
  },
  // Bottom modal styles
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  bottomModalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#8e8e93',
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 20,
  },
  bottomModalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomModalSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planOptionIcon: {
    marginRight: 12,
  },
  planOptionContent: {
    flex: 1,
  },
  planOptionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  planOptionSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8e8e93',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#8e8e93',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiscoverScreen;