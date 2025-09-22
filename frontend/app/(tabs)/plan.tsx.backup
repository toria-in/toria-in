import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { planMyTrip, getTopPlaces } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../contexts/PlanContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';

interface PlanFormData {
  places: string[];
  goingWith: string;
  focus: string;
  duration: number;
  durationUnit: 'hours' | 'days';
  date: Date;
  time: Date;
  diet: string;
  budget: string;
  vibe: string;
}

const BUDGET_OPTIONS = [
  { label: 'Budget-friendly (₹500-1000)', value: 'budget' },
  { label: 'Mid-range (₹1000-2500)', value: 'mid-range' },
  { label: 'Premium (₹2500-5000)', value: 'premium' },
  { label: 'Luxury (₹5000+)', value: 'luxury' },
];

const DURATION_UNITS = [
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
];

const GOING_WITH_OPTIONS = [
  { icon: 'heart', label: 'Partner', value: 'partner', color: Colors.partner },
  { icon: 'people', label: 'Family', value: 'family', color: Colors.family },
  { icon: 'happy', label: 'Friends', value: 'friends', color: Colors.friends },
  { icon: 'briefcase', label: 'Business', value: 'business', color: Colors.business },
  { icon: 'person', label: 'Solo', value: 'solo', color: Colors.solo },
];

const FOCUS_OPTIONS = [
  { icon: 'restaurant', label: 'Food', value: 'food', color: Colors.food },
  { icon: 'location', label: 'Places', value: 'places', color: Colors.place },
  { icon: 'star', label: 'Both', value: 'both', color: Colors.both },
];

const DIET_OPTIONS = [
  { label: 'No Restrictions', value: 'none' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Jain', value: 'jain' },
  { label: 'Halal', value: 'halal' },
  { label: 'Keto', value: 'keto' },
];

const VIBE_OPTIONS = [
  { label: 'Relaxed', value: 'relaxed' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Nightlife', value: 'nightlife' },
  { label: 'Nature', value: 'nature' },
  { label: 'Photography', value: 'photography' },
];

// Custom dropdown component
const DropdownSelector: React.FC<{
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, options, onSelect, placeholder }) => {
  const [isVisible, setIsVisible] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.dropdownText, !selectedOption && styles.placeholderText]}>
          {selectedOption?.label || placeholder || 'Select...'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    item.value === value && styles.selectedOption
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setIsVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    item.value === value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Enhanced duration input with number input and unit dropdown
const DurationInput: React.FC<{
  duration: number;
  unit: 'hours' | 'days';
  onDurationChange: (duration: number) => void;
  onUnitChange: (unit: 'hours' | 'days') => void;
}> = ({ duration, unit, onDurationChange, onUnitChange }) => {
  const [textValue, setTextValue] = useState(duration.toString());

  const handleTextChange = (text: string) => {
    setTextValue(text);
    const numValue = parseInt(text) || 0;
    if (numValue > 0) {
      onDurationChange(numValue);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Duration *</Text>
      <View style={styles.durationContainer}>
        <TextInput
          style={styles.durationInput}
          value={textValue}
          onChangeText={handleTextChange}
          placeholder="Enter duration"
          placeholderTextColor={Colors.inputPlaceholder}
          keyboardType="numeric"
          returnKeyType="done"
        />
        <View style={styles.unitSeparator} />
        <DropdownSelector
          label=""
          value={unit}
          options={DURATION_UNITS}
          onSelect={(value) => onUnitChange(value as 'hours' | 'days')}
          placeholder="Unit"
        />
      </View>
    </View>
  );
};

// Date and time picker component
const DateTimeInput: React.FC<{
  date: Date;
  time: Date;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
}> = ({ date, time, onDateChange, onTimeChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View style={styles.dateTimeContainer}>
      <View style={styles.dateTimeRow}>
        <View style={[styles.inputContainer, styles.dateTimeInput]}>
          <Text style={styles.inputLabel}>Date *</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, styles.dateTimeInput]}>
          <Text style={styles.inputLabel}>Time *</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time" size={20} color={Colors.primary} />
            <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              onDateChange(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              onTimeChange(selectedTime);
            }
          }}
        />
      )}
    </View>
  );
};

const PlanScreen: React.FC = () => {
  const { user } = useAuth();
  const { pendingItems, clearPendingItems } = usePlan();
  const [formData, setFormData] = useState<PlanFormData>({
    places: [],
    goingWith: '',
    focus: '',
    duration: 1,
    durationUnit: 'days',
    date: new Date(),
    time: new Date(),
    diet: 'none',
    budget: 'mid-range',
    vibe: 'relaxed',
  });

  const [placesInput, setPlacesInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations for API calls
  const planTripMutation = useMutation({
    mutationFn: planMyTrip,
    onSuccess: (data) => {
      Toast.show({
        type: 'success',
        text1: '🎉 Trip Planned!',
        text2: 'Your personalized itinerary is ready',
      });
      // Navigate to results or show results
      console.log('Trip plan result:', data);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Planning Failed',
        text2: 'Unable to create your trip plan. Please try again.',
      });
    },
  });

  const buildDayMutation = useMutation({
    mutationFn: getTopPlaces,
    onSuccess: (data) => {
      Toast.show({
        type: 'success',
        text1: '🏗️ Day Building Started!',
        text2: 'Browse top places to add to your itinerary',
      });
      console.log('Build day result:', data);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Build Failed',
        text2: 'Unable to fetch places. Please try again.',
      });
    },
  });

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.places.length === 0) {
      newErrors.places = 'Please add at least one place';
    }

    if (!formData.goingWith) {
      newErrors.goingWith = 'Please select who you\'re going with';
    }

    if (!formData.focus) {
      newErrors.focus = 'Please select your trip focus';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle adding places
  const handleAddPlace = () => {
    const trimmedInput = placesInput.trim();
    if (trimmedInput && !formData.places.includes(trimmedInput)) {
      setFormData(prev => ({
        ...prev,
        places: [...prev.places, trimmedInput]
      }));
      setPlacesInput('');
      setErrors(prev => ({ ...prev, places: '' }));
    }
  };

  const handleRemovePlace = (place: string) => {
    setFormData(prev => ({
      ...prev,
      places: prev.places.filter(p => p !== place)
    }));
  };

  // Handle Get Toria Recommendations
  const handleGetRecommendations = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to get personalized recommendations');
      return;
    }

    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    const planData = {
      places: formData.places,
      going_with: formData.goingWith,
      focus: formData.focus,
      duration: formData.duration,
      duration_unit: formData.durationUnit,
      date: formData.date.toISOString(),
      time: formData.time.toISOString(),
      preferences: {
        diet: formData.diet,
        budget: formData.budget,
        vibe: formData.vibe,
      },
      user_id: user.id,
    };

    planTripMutation.mutate(planData);
  };

  // Handle Build Your Day
  const handleBuildYourDay = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to build your day');
      return;
    }

    if (formData.places.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Add Places First',
        text2: 'Please add at least one place to start building',
      });
      return;
    }

    const buildData = {
      places: formData.places,
      focus: formData.focus || 'both',
      preferences: {
        diet: formData.diet,
        budget: formData.budget,
        vibe: formData.vibe,
      },
    };

    buildDayMutation.mutate(buildData);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, Typography.h2]}>Plan Your Trip</Text>
            <Text style={[styles.subtitle, Typography.body2]}>
              Tell us what you're looking for and we'll create the perfect itinerary
            </Text>
          </View>

          {/* Mandatory Inputs Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, Typography.h4]}>Trip Details</Text>
            
            {/* Places Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Places to Visit *</Text>
              <View style={styles.placesInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={placesInput}
                  onChangeText={setPlacesInput}
                  placeholder="Add a place (e.g. Delhi, Connaught Place)"
                  placeholderTextColor={Colors.inputPlaceholder}
                  returnKeyType="done"
                  onSubmitEditing={handleAddPlace}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.addPlaceButton}
                  onPress={handleAddPlace}
                  disabled={!placesInput.trim()}
                >
                  <Ionicons name="add" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Places Tags */}
              {formData.places.length > 0 && (
                <View style={styles.placesContainer}>
                  {formData.places.map((place, index) => (
                    <View key={index} style={styles.placeTag}>
                      <Text style={styles.placeTagText}>{place}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemovePlace(place)}
                        style={styles.removeTagButton}
                      >
                        <Ionicons name="close" size={16} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {errors.places && (
                <Text style={styles.errorText}>{errors.places}</Text>
              )}
            </View>

            {/* Going With Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Going With *</Text>
              <View style={styles.optionsGrid}>
                {GOING_WITH_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      formData.goingWith === option.value && styles.selectedCard,
                      { borderColor: option.color }
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, goingWith: option.value }));
                      setErrors(prev => ({ ...prev, goingWith: '' }));
                    }}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                      <Ionicons name={option.icon as any} size={20} color={Colors.textPrimary} />
                    </View>
                    <Text style={[
                      styles.optionText,
                      formData.goingWith === option.value && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.goingWith && (
                <Text style={styles.errorText}>{errors.goingWith}</Text>
              )}
            </View>

            {/* Focus Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Trip Focus *</Text>
              <View style={styles.focusContainer}>
                {FOCUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.focusCard,
                      formData.focus === option.value && styles.selectedFocusCard,
                      { borderColor: option.color }
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, focus: option.value }));
                      setErrors(prev => ({ ...prev, focus: '' }));
                    }}
                  >
                    <View style={[styles.focusIcon, { backgroundColor: option.color }]}>
                      <Ionicons name={option.icon as any} size={24} color={Colors.textPrimary} />
                    </View>
                    <Text style={[
                      styles.focusText,
                      formData.focus === option.value && styles.selectedFocusText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.focus && (
                <Text style={styles.errorText}>{errors.focus}</Text>
              )}
            </View>

            {/* Duration Input */}
            <DurationInput
              duration={formData.duration}
              unit={formData.durationUnit}
              onDurationChange={(duration) => setFormData(prev => ({ ...prev, duration }))}
              onUnitChange={(unit) => setFormData(prev => ({ ...prev, durationUnit: unit }))}
            />

            {/* Date and Time */}
            <DateTimeInput
              date={formData.date}
              time={formData.time}
              onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
              onTimeChange={(time) => setFormData(prev => ({ ...prev, time }))}
            />
          </View>

          {/* Optional Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, Typography.h4]}>Preferences</Text>
            
            {/* Diet Preferences */}
            <DropdownSelector
              label="Diet Preferences"
              value={formData.diet}
              options={DIET_OPTIONS}
              onSelect={(value) => setFormData(prev => ({ ...prev, diet: value }))}
            />

            {/* Budget */}
            <DropdownSelector
              label="Budget Range"
              value={formData.budget}
              options={BUDGET_OPTIONS}
              onSelect={(value) => setFormData(prev => ({ ...prev, budget: value }))}
            />

            {/* Vibe */}
            <DropdownSelector
              label="Trip Vibe"
              value={formData.vibe}
              options={VIBE_OPTIONS}
              onSelect={(value) => setFormData(prev => ({ ...prev, vibe: value }))}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                planTripMutation.isPending && styles.buttonDisabled
              ]}
              onPress={handleGetRecommendations}
              disabled={planTripMutation.isPending}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="sparkles" size={20} color={Colors.textPrimary} />
                <Text style={styles.primaryButtonText}>
                  {planTripMutation.isPending ? 'Creating...' : 'Get Toria Recommendations'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                buildDayMutation.isPending && styles.buttonDisabled
              ]}
              onPress={handleBuildYourDay}
              disabled={buildDayMutation.isPending}
            >
              <Text style={styles.secondaryButtonText}>
                {buildDayMutation.isPending ? 'Loading...' : 'Build Your Day'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
    backgroundColor: Colors.backgroundSecondary,
  },
  title: {
    marginBottom: Spacing.s,
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
    color: Colors.primary,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: Spacing.l,
  },
  inputLabel: {
    ...Typography.inputLabel,
    marginBottom: Spacing.s,
    color: Colors.textPrimary,
  },
  textInput: {
    ...Typography.inputText,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.l,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    minHeight: 48,
  },
  placesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPlaceButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.m,
    padding: Spacing.s,
    marginLeft: Spacing.s,
  },
  placesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.s,
    gap: Spacing.s,
  },
  placeTag: {
    backgroundColor: Colors.backgroundAccent,
    borderRadius: BorderRadius.l,
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeTagText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  removeTagButton: {
    padding: 2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  optionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderRadius: BorderRadius.l,
    padding: Spacing.s,
    alignItems: 'center',
    ...Shadows.small,
  },
  selectedCard: {
    backgroundColor: Colors.backgroundAccent,
    borderColor: Colors.primary,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s,
  },
  optionText: {
    ...Typography.body2,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  focusContainer: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  focusCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    alignItems: 'center',
    ...Shadows.small,
  },
  selectedFocusCard: {
    backgroundColor: Colors.backgroundAccent,
    borderColor: Colors.primary,
  },
  focusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s,
  },
  focusText: {
    ...Typography.body2,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  selectedFocusText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInput: {
    ...Typography.inputText,
    flex: 2,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.l,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    minHeight: 48,
    textAlign: 'center',
  },
  unitSeparator: {
    width: Spacing.s,
  },
  dateTimeContainer: {
    marginBottom: Spacing.l,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  dateTimeInput: {
    flex: 1,
    marginBottom: 0,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.l,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    minHeight: 48,
    gap: Spacing.s,
  },
  dateTimeText: {
    ...Typography.inputText,
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.l,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    minHeight: 48,
  },
  dropdownText: {
    ...Typography.inputText,
    flex: 1,
  },
  placeholderText: {
    color: Colors.inputPlaceholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.l,
    margin: Spacing.m,
    maxHeight: 300,
    minWidth: 250,
    ...Shadows.large,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.backgroundAccent,
  },
  dropdownOptionText: {
    ...Typography.body1,
    flex: 1,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.m,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.l,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    ...Shadows.medium,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.l,
    paddingVertical: Spacing.m,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  secondaryButtonText: {
    ...Typography.buttonSecondary,
    color: Colors.primary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default PlanScreen;