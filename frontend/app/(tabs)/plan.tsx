import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

import { planMyTrip, getTopPlaces, createDayPlan } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface PlanFormData {
  places: string[];
  goingWith: string;
  focus: string;
  duration?: string;
  dateTime?: string;
  diet?: string;
  budget?: string;
  vibe?: string[];
}

const PlanScreen: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PlanFormData>({
    places: [''],
    goingWith: '',
    focus: '',
    vibe: [],
  });
  
  const [showResults, setShowResults] = useState(false);
  const [showBuildYourDay, setShowBuildYourDay] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Plan mutation
  const planMutation = useMutation({
    mutationFn: planMyTrip,
    onSuccess: (data) => {
      setShowResults(true);
      setShowBuildYourDay(false);
      Toast.show({
        type: 'success',
        text1: 'Recommendations Ready!',
        text2: 'AI has generated your travel suggestions',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Please try again with different details',
      });
    },
  });

  // Top places mutation
  const topPlacesMutation = useMutation({
    mutationFn: getTopPlaces,
    onSuccess: (data) => {
      setShowBuildYourDay(true);
      setShowResults(false);
      Toast.show({
        type: 'success',
        text1: 'Places Found!',
        text2: 'Select items to build your day',
      });
    },
  });

  // Create day plan mutation
  const createPlanMutation = useMutation({
    mutationFn: createDayPlan,
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Day Plan Created!',
        text2: 'Find it in your profile',
      });
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      places: [''],
      goingWith: '',
      focus: '',
      vibe: [],
    });
    setShowResults(false);
    setShowBuildYourDay(false);
    setSelectedItems([]);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.places[0] || formData.places[0].trim() === '') {
      newErrors.places = 'At least one place is required';
    }
    
    if (!formData.goingWith) {
      newErrors.goingWith = 'Please select who you\'re going with';
    }
    
    if (!formData.focus) {
      newErrors.focus = 'Please select your focus';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePlace = (index: number, value: string) => {
    const newPlaces = [...formData.places];
    newPlaces[index] = value;
    setFormData({ ...formData, places: newPlaces });
    
    // Clear error when user starts typing
    if (errors.places && value.trim()) {
      setErrors(prev => ({ ...prev, places: '' }));
    }
  };

  const addPlace = () => {
    setFormData({ ...formData, places: [...formData.places, ''] });
  };

  const removePlace = (index: number) => {
    if (formData.places.length > 1) {
      const newPlaces = formData.places.filter((_, i) => i !== index);
      setFormData({ ...formData, places: newPlaces });
    }
  };

  const toggleVibe = (vibe: string) => {
    const currentVibes = formData.vibe || [];
    const newVibes = currentVibes.includes(vibe)
      ? currentVibes.filter(v => v !== vibe)
      : [...currentVibes, vibe];
    setFormData({ ...formData, vibe: newVibes });
  };

  const handleGetRecommendations = () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please sign in to get recommendations',
      });
      return;
    }

    const requestData = {
      places: formData.places.filter(p => p.trim()),
      going_with: formData.goingWith,
      focus: formData.focus,
      duration: formData.duration,
      date_time: formData.dateTime,
      diet: formData.diet,
      budget: formData.budget,
      vibe: formData.vibe,
    };

    planMutation.mutate(requestData);
  };

  const handleBuildYourDay = () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please sign in to build your day',
      });
      return;
    }

    const requestData = {
      places: formData.places.filter(p => p.trim()),
      going_with: formData.goingWith,
      focus: formData.focus,
      filters: {
        duration: formData.duration,
        diet: formData.diet,
        budget: formData.budget,
        vibe: formData.vibe,
      },
    };

    topPlacesMutation.mutate(requestData);
  };

  const handleCreatePlan = () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please sign in to create plans',
      });
      return;
    }

    const planData = {
      user_id: user.id,
      title: `${formData.places[0]} - ${formData.goingWith} - ${formData.focus}`,
      city: formData.places[0],
      going_with: formData.goingWith,
      focus: formData.focus,
      duration: formData.duration,
      stops: selectedItems,
      generated_by_ai: showResults,
    };

    createPlanMutation.mutate(planData);
  };

  const MandatoryInputs = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trip Details</Text>
      
      {/* Places */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, errors.places && styles.errorLabel]}>
          Places *
        </Text>
        {formData.places.map((place, index) => (
          <View key={index} style={styles.placeInputContainer}>
            <TextInput
              style={[styles.textInput, errors.places && styles.errorInput]}
              placeholder="Enter city or place"
              placeholderTextColor="#8e8e93"
              value={place}
              onChangeText={(value) => updatePlace(index, value)}
            />
            {formData.places.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePlace(index)}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {errors.places && <Text style={styles.errorText}>{errors.places}</Text>}
        
        <TouchableOpacity style={styles.addButton} onPress={addPlace}>
          <Ionicons name="add" size={20} color="#ff6b35" />
          <Text style={styles.addButtonText}>Add Place</Text>
        </TouchableOpacity>
      </View>

      {/* Going With */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, errors.goingWith && styles.errorLabel]}>
          Going With *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsContainer}>
            {['friends', 'family', 'partner', 'business', 'solo'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  formData.goingWith === option && styles.selectedOption,
                ]}
                onPress={() => {
                  setFormData({ ...formData, goingWith: option });
                  if (errors.goingWith) {
                    setErrors(prev => ({ ...prev, goingWith: '' }));
                  }
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.goingWith === option && styles.selectedOptionText,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {errors.goingWith && <Text style={styles.errorText}>{errors.goingWith}</Text>}
      </View>

      {/* Focus */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, errors.focus && styles.errorLabel]}>
          Focus *
        </Text>
        <View style={styles.optionsContainer}>
          {['food', 'attractions', 'both'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.focus === option && styles.selectedOption,
              ]}
              onPress={() => {
                setFormData({ ...formData, focus: option });
                if (errors.focus) {
                  setErrors(prev => ({ ...prev, focus: '' }));
                }
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.focus === option && styles.selectedOptionText,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.focus && <Text style={styles.errorText}>{errors.focus}</Text>}
      </View>
    </View>
  );

  const OptionalFilters = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Optional Filters</Text>
      
      {/* Duration */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duration</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., 4 hours, Half day, Full day"
          placeholderTextColor="#8e8e93"
          value={formData.duration}
          onChangeText={(value) => setFormData({ ...formData, duration: value })}
        />
      </View>

      {/* Date/Time */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date & Time</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Tomorrow evening, Weekend morning"
          placeholderTextColor="#8e8e93"
          value={formData.dateTime}
          onChangeText={(value) => setFormData({ ...formData, dateTime: value })}
        />
      </View>

      {/* Contextual Filters */}
      {(formData.focus === 'food' || formData.focus === 'both') && (
        <>
          {/* Diet */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Diet</Text>
            <View style={styles.optionsContainer}>
              {['non-veg', 'veg', 'pure veg'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    formData.diet === option && styles.selectedOption,
                  ]}
                  onPress={() => setFormData({ ...formData, diet: option })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.diet === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Budget</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Budget-friendly, Moderate, Premium"
              placeholderTextColor="#8e8e93"
              value={formData.budget}
              onChangeText={(value) => setFormData({ ...formData, budget: value })}
            />
          </View>

          {/* Food Vibe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vibe</Text>
            <View style={styles.vibeContainer}>
              {['drink & dine', 'family', 'romantic', 'party', 'premium', 'buffets', 'religious'].map((vibe) => (
                <TouchableOpacity
                  key={vibe}
                  style={[
                    styles.vibeButton,
                    formData.vibe?.includes(vibe) && styles.selectedVibe,
                  ]}
                  onPress={() => toggleVibe(vibe)}
                >
                  <Text
                    style={[
                      styles.vibeText,
                      formData.vibe?.includes(vibe) && styles.selectedVibeText,
                    ]}
                  >
                    {vibe}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {(formData.focus === 'attractions' || formData.focus === 'both') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Attraction Vibe</Text>
          <View style={styles.vibeContainer}>
            {['nature', 'adventure', 'religious', 'culture-history'].map((vibe) => (
              <TouchableOpacity
                key={vibe}
                style={[
                  styles.vibeButton,
                  formData.vibe?.includes(vibe) && styles.selectedVibe,
                ]}
                onPress={() => toggleVibe(vibe)}
              >
                <Text
                  style={[
                    styles.vibeText,
                    formData.vibe?.includes(vibe) && styles.selectedVibeText,
                  ]}
                >
                  {vibe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const ActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={[styles.primaryButton, planMutation.isPending && styles.disabledButton]}
        onPress={handleGetRecommendations}
        disabled={planMutation.isPending}
      >
        {planMutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Get Toria Recommendations</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, topPlacesMutation.isPending && styles.disabledButton]}
        onPress={handleBuildYourDay}
        disabled={topPlacesMutation.isPending}
      >
        {topPlacesMutation.isPending ? (
          <ActivityIndicator color="#ff6b35" />
        ) : (
          <>
            <Ionicons name="construct" size={20} color="#ff6b35" />
            <Text style={styles.secondaryButtonText}>Build Your Day</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const ResultsSection = () => {
    if (!planMutation.data) return null;

    const { toria_recommended } = planMutation.data;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>🌟 Toria Recommended</Text>
        {toria_recommended.suggestions?.map((item: any, index: number) => (
          <View key={index} style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionName}>{item.name}</Text>
              <View style={[styles.typeChip, { backgroundColor: item.type === 'Food' ? '#ff6b35' : '#4CAF50' }]}>
                <Text style={styles.typeChipText}>{item.type}</Text>
              </View>
            </View>
            {item.time && (
              <Text style={styles.suggestionTime}>
                <Ionicons name="time" size={12} color="#8e8e93" /> {item.time}
              </Text>
            )}
            {item.reason && (
              <Text style={styles.suggestionReason}>{item.reason}</Text>
            )}
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.createPlanButton}
          onPress={handleCreatePlan}
          disabled={createPlanMutation.isPending}
        >
          {createPlanMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createPlanText}>Create This Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const BuildYourDaySection = () => {
    if (!topPlacesMutation.data) return null;

    const { food_places = [], attraction_places = [] } = topPlacesMutation.data;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>🛠️ Build Your Day</Text>
        <Text style={styles.guidanceText}>
          💡 For ~{formData.duration || '4 hours'}, travelers usually cover 3-5 items
        </Text>

        {(formData.focus === 'food' || formData.focus === 'both') && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>🍕 Food Options</Text>
            {food_places.map((place: any, index: number) => (
              <TouchableOpacity
                key={`food-${index}`}
                style={[
                  styles.placeCard,
                  selectedItems.some(item => item.name === place.name) && styles.selectedPlace,
                ]}
                onPress={() => {
                  const isSelected = selectedItems.some(item => item.name === place.name);
                  if (isSelected) {
                    setSelectedItems(prev => prev.filter(item => item.name !== place.name));
                  } else {
                    setSelectedItems(prev => [...prev, { ...place, type: 'Food' }]);
                  }
                }}
              >
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeDetails}>
                  🍽️ Top dishes: {place.top_dishes?.join(', ')}
                </Text>
                <View style={styles.placeMetaContainer}>
                  <Text style={styles.placeMeta}>{place.price_band}</Text>
                  <Text style={styles.placeMeta}>{place.hygiene}</Text>
                  <Text style={styles.placeMeta}>{place.open_hours}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(formData.focus === 'attractions' || formData.focus === 'both') && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>🏛️ Places to Visit</Text>
            {attraction_places.map((place: any, index: number) => (
              <TouchableOpacity
                key={`place-${index}`}
                style={[
                  styles.placeCard,
                  selectedItems.some(item => item.name === place.name) && styles.selectedPlace,
                ]}
                onPress={() => {
                  const isSelected = selectedItems.some(item => item.name === place.name);
                  if (isSelected) {
                    setSelectedItems(prev => prev.filter(item => item.name !== place.name));
                  } else {
                    setSelectedItems(prev => [...prev, { ...place, type: 'Place' }]);
                  }
                }}
              >
                <Text style={styles.placeName}>{place.name}</Text>
                <View style={styles.placeMetaContainer}>
                  {place.vibe_tags?.map((tag: string) => (
                    <Text key={tag} style={styles.placeMeta}>{tag}</Text>
                  ))}
                </View>
                <Text style={styles.placeDetails}>💰 {place.fee_info} • ⏰ {place.ideal_time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedItems.length > 0 && (
          <TouchableOpacity
            style={styles.createPlanButton}
            onPress={handleCreatePlan}
            disabled={createPlanMutation.isPending}
          >
            {createPlanMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createPlanText}>
                Create Plan with {selectedItems.length} items
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <MandatoryInputs />
          <OptionalFilters />
          <ActionButtons />
          
          {showResults && <ResultsSection />}
          {showBuildYourDay && <BuildYourDaySection />}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorLabel: {
    color: '#ff4444',
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  errorInput: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  placeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeButton: {
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ff6b35',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedOption: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  vibeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibeButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedVibe: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderColor: '#ff6b35',
  },
  vibeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedVibeText: {
    color: '#ff6b35',
  },
  actionSection: {
    marginBottom: 32,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#ff6b35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultsSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  guidanceText: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  suggestionCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionTime: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 4,
  },
  suggestionReason: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  placeCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlace: {
    borderColor: '#ff6b35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  placeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeDetails: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 8,
  },
  placeMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placeMeta: {
    color: '#ff6b35',
    fontSize: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  createPlanButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createPlanText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PlanScreen;