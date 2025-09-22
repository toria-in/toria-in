import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';

import { getUserDayPlans, chatbotFromStartMyDay } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface Stop {
  id: string;
  name: string;
  type: 'Food' | 'Place';
  time_window?: string;
  quick_info?: string;
  completed?: boolean;
  liked?: boolean;
  feedback?: string;
}

interface DayPlan {
  id: string;
  title: string;
  city: string;
  going_with: string;
  focus: string;
  stops: Stop[];
  status: string;
}

const StartMyDayScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    stop: Stop | null;
  }>({ visible: false, stop: null });
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Fetch day plan
  const { data: dayPlans = [] } = useQuery({
    queryKey: ['dayPlans', user?.id],
    queryFn: () => getUserDayPlans(user?.id || ''),
    enabled: !!user,
  });

  const currentPlan = dayPlans.find((plan: DayPlan) => plan.id === id);

  // Chatbot mutation
  const chatMutation = useMutation({
    mutationFn: (message: string) => chatbotFromStartMyDay(user?.id || '', message),
    onSuccess: (response) => {
      setChatMessages(prev => [
        ...prev,
        { type: 'user', message: chatInput },
        { type: 'bot', message: response.message }
      ]);
      setChatInput('');
    },
  });

  useEffect(() => {
    if (currentPlan) {
      setStops(currentPlan.stops.map((stop: any, index: number) => ({
        ...stop,
        id: stop.id || `stop-${index}`,
        completed: false,
        liked: undefined,
        feedback: '',
      })));
    }
  }, [currentPlan]);

  const handleGetDirections = () => {
    if (!currentPlan || stops.length === 0) return;

    // Create multi-stop Google Maps URL
    const destination = stops[stops.length - 1].name;
    const waypoints = stops.slice(0, -1).map(stop => stop.name).join('|');
    
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
    
    Linking.openURL(mapsUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not open Google Maps',
      });
    });
  };

  const handleStopComplete = (stopId: string) => {
    const stop = stops.find(s => s.id === stopId);
    if (stop && !stop.completed) {
      setFeedbackModal({ visible: true, stop });
    }
  };

  const handleFeedbackSubmit = (liked: boolean, feedback?: string) => {
    if (!feedbackModal.stop) return;

    setStops(prev =>
      prev.map(stop =>
        stop.id === feedbackModal.stop!.id
          ? { ...stop, completed: true, liked, feedback }
          : stop
      )
    );

    setFeedbackModal({ visible: false, stop: null });

    Toast.show({
      type: 'success',
      text1: 'Feedback Recorded',
      text2: liked ? 'Great! Glad you enjoyed it' : 'Thanks for the feedback',
    });

    // If disliked, show chat for nearby suggestions
    if (!liked) {
      setChatVisible(true);
      setChatMessages(prev => [
        ...prev,
        { 
          type: 'bot', 
          message: `Sorry ${feedbackModal.stop.name} wasn't great! I can suggest nearby alternatives. What type of place would you prefer?` 
        }
      ]);
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    chatMutation.mutate(chatInput);
  };

  const completedStops = stops.filter(stop => stop.completed).length;
  const progress = stops.length > 0 ? (completedStops / stops.length) * 100 : 0;

  const getThemeColors = () => {
    switch (currentPlan?.going_with) {
      case 'partner':
        return { primary: '#ff6b9d', secondary: 'rgba(255, 107, 157, 0.1)' };
      case 'family':
        return { primary: '#ffa726', secondary: 'rgba(255, 167, 38, 0.1)' };
      case 'business':
        return { primary: '#9e9e9e', secondary: 'rgba(158, 158, 158, 0.1)' };
      default:
        return { primary: '#ff6b35', secondary: 'rgba(255, 107, 53, 0.1)' };
    }
  };

  const themeColors = getThemeColors();

  const FeedbackModal = () => (
    <Modal
      isVisible={feedbackModal.visible}
      onBackdropPress={() => setFeedbackModal({ visible: false, stop: null })}
      style={styles.modal}
    >
      <View style={styles.feedbackContent}>
        <Text style={styles.feedbackTitle}>How was your experience?</Text>
        <Text style={styles.feedbackSubtitle}>{feedbackModal.stop?.name}</Text>

        <View style={styles.feedbackButtons}>
          <TouchableOpacity
            style={[styles.feedbackButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleFeedbackSubmit(true)}
          >
            <Ionicons name="thumbs-up" size={24} color="#ffffff" />
            <Text style={styles.feedbackButtonText}>Liked</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.feedbackButton, { backgroundColor: '#ff4444' }]}
            onPress={() => handleFeedbackSubmit(false)}
          >
            <Ionicons name="thumbs-down" size={24} color="#ffffff" />
            <Text style={styles.feedbackButtonText}>Not Liked</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const TravelBuddyChat = () => (
    <Modal
      isVisible={chatVisible}
      onBackdropPress={() => setChatVisible(false)}
      style={styles.chatModal}
    >
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>🤖 Travel Buddy</Text>
          <TouchableOpacity onPress={() => setChatVisible(false)}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.chatMessages}>
          {chatMessages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.chatMessage,
                msg.type === 'user' ? styles.userMessage : styles.botMessage
              ]}
            >
              <Text style={styles.chatMessageText}>{msg.message}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInput}>
          <TextInput
            style={styles.chatTextInput}
            placeholder="Ask for nearby suggestions..."
            placeholderTextColor="#8e8e93"
            value={chatInput}
            onChangeText={setChatInput}
            multiline
          />
          <TouchableOpacity
            style={styles.chatSendButton}
            onPress={handleSendChatMessage}
            disabled={chatMutation.isPending}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!currentPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff4444" />
          <Text style={styles.errorTitle}>Plan Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The day plan you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.dayTitle}>Day 1</Text>
          <Text style={styles.planTitle}>{currentPlan.title}</Text>
        </View>

        <TouchableOpacity onPress={handleGetDirections}>
          <Ionicons name="navigate" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: themeColors.primary }
          ]} />
        </View>
        <Text style={styles.progressText}>
          {completedStops} of {stops.length} stops completed
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
          onPress={handleGetDirections}
        >
          <Ionicons name="map" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Get Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => setChatVisible(true)}
        >
          <Ionicons name="chatbubble" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Travel Buddy</Text>
        </TouchableOpacity>
      </View>

      {/* Stops List */}
      <ScrollView style={styles.stopsContainer} showsVerticalScrollIndicator={false}>
        {stops.map((stop, index) => (
          <View key={stop.id} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopType}>
                  <Ionicons 
                    name={stop.type === 'Food' ? 'restaurant' : 'location'} 
                    size={12} 
                    color="#8e8e93" 
                  />
                  {' '}{stop.type}
                </Text>
                {stop.time_window && (
                  <Text style={styles.stopTime}>
                    <Ionicons name="time" size={12} color="#8e8e93" />
                    {' '}{stop.time_window}
                  </Text>
                )}
                {stop.quick_info && (
                  <Text style={styles.stopQuickInfo}>💡 {stop.quick_info}</Text>
                )}
              </View>

              <View style={styles.stopActions}>
                {stop.completed ? (
                  <View style={[
                    styles.completedBadge,
                    { backgroundColor: stop.liked ? '#4CAF50' : '#ff9800' }
                  ]}>
                    <Ionicons 
                      name={stop.liked ? 'checkmark-circle' : 'alert-circle'} 
                      size={20} 
                      color="#ffffff" 
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.completeButton, { borderColor: themeColors.primary }]}
                    onPress={() => handleStopComplete(stop.id)}
                  >
                    <Text style={[styles.completeButtonText, { color: themeColors.primary }]}>
                      Complete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {stop.feedback && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Your feedback:</Text>
                <Text style={styles.feedbackText}>{stop.feedback}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <FeedbackModal />
      <TravelBuddyChat />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  dayTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  planTitle: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#8e8e93',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stopsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stopCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stopType: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 2,
  },
  stopTime: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 2,
  },
  stopQuickInfo: {
    color: '#ff6b35',
    fontSize: 12,
    fontStyle: 'italic',
  },
  stopActions: {
    alignItems: 'flex-end',
  },
  completeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    borderRadius: 16,
    padding: 8,
  },
  feedbackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  feedbackLabel: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 4,
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: screenWidth - 40,
  },
  feedbackTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 24,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  feedbackButton: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  feedbackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Chat modal styles
  chatModal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  chatContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chatMessage: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff6b35',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#3a3a3a',
  },
  chatMessageText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  chatInput: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    gap: 12,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
  },
  chatSendButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StartMyDayScreen;