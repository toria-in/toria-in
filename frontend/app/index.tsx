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
import { ImageBackground, LinearGradient } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { FlashList } from '@shopify/flash-list';

import { fetchReels, upvoteReel, saveReel } from './services/api';

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

// Move components outside to fix React Hooks violation
const LocationFilter: React.FC<{
  currentLocation: string;
  selectedItinerary: string | null;
  onClearItinerary: () => void;
}> = ({ currentLocation, selectedItinerary, onClearItinerary }) => (
  <View style={styles.filterContainer}>
    <TouchableOpacity style={styles.filterPill}>
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
  const [webViewHeight, setWebViewHeight] = useState(400);

  // Create a beautiful native reel display instead of WebView

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

      {/* Instagram Embed */}
      <View style={[styles.webViewContainer, { height: webViewHeight }]}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          scrollEnabled={false}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
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
  const [currentLocation, setCurrentLocation] = useState<string>('Delhi');
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);
  const [userId] = useState<string>('user-demo-123'); // Mock user ID

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
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ reelId }: { reelId: string }) => saveReel(reelId, userId),
    onSuccess: () => {
      Alert.alert('Saved!', 'Reel saved to your favorites');
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
        Alert.alert(
          'Location Permission',
          'Please enable location access for better content discovery.',
          [{ text: 'OK' }]
        );
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
    saveMutation.mutate({ reelId });
  };

  const handleAddToPlan = (reel: Reel) => {
    Alert.alert(
      'Add to Day Plan',
      'Where would you like to add this?',
      [
        {
          text: 'New Day Plan',
          onPress: () => {
            Alert.alert('Success', 'Added to new day plan. Complete it in the Plan tab!');
          },
        },
        {
          text: 'Existing Plan',
          onPress: () => {
            Alert.alert('Success', 'Added to existing day plan!');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleClearItinerary = () => {
    setSelectedItinerary(null);
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
  webViewContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: 'transparent',
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
});

export default DiscoverScreen;