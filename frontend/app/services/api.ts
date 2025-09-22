import axios from 'axios';
import Constants from 'expo-constants';

// Get backend URL from environment
const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                   process.env.EXPO_PUBLIC_BACKEND_URL || 
                   'https://toria-discover-plan.preview.emergentagent.com';

// Create axios instance
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API request logging (for development)
if (__DEV__) {
  api.interceptors.request.use((config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
      return Promise.reject(error);
    }
  );
}

// Types
export interface Reel {
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

export interface User {
  id: string;
  firebase_uid?: string;
  email?: string;
  display_name: string;
  profile_picture?: string;
  preferences: Record<string, any>;
}

export interface DayPlan {
  id: string;
  user_id: string;
  title: string;
  city: string;
  going_with: string;
  focus: string;
  date?: string;
  duration?: string;
  status: string;
  stops: any[];
  generated_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface TravelPlanRequest {
  places: string[];
  going_with: string;
  focus: string;
  duration?: string;
  date_time?: string;
  diet?: string;
  budget?: string;
  vibe?: string[];
}

export interface TopPlacesRequest {
  places: string[];
  going_with: string;
  focus: string;
  filters?: Record<string, any>;
}

// API Functions

// Health check
export const healthCheck = async () => {
  const response = await api.get('/');
  return response.data;
};

// User APIs
export const createUser = async (userData: Partial<User>): Promise<User> => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const getUser = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Reels APIs
export const fetchReels = async (filters?: { location?: string; type?: string; limit?: number }): Promise<Reel[]> => {
  const params = new URLSearchParams();
  if (filters?.location) params.append('location', filters.location);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/reels?${params.toString()}`);
  return response.data;
};

export const createReel = async (reelData: Partial<Reel>): Promise<Reel> => {
  const response = await api.post('/reels', reelData);
  return response.data;
};

export const upvoteReel = async (reelId: string): Promise<{ message: string }> => {
  const response = await api.post(`/reels/${reelId}/upvote`);
  return response.data;
};

export const saveReel = async (reelId: string, userId: string): Promise<{ message: string }> => {
  const response = await api.post(`/reels/${reelId}/save?user_id=${userId}`);
  return response.data;
};

// Day Plans APIs
export const createDayPlan = async (planData: Partial<DayPlan>): Promise<DayPlan> => {
  const response = await api.post('/day-plans', planData);
  return response.data;
};

export const getUserDayPlans = async (userId: string): Promise<DayPlan[]> => {
  const response = await api.get(`/day-plans/${userId}`);
  return response.data;
};

export const getUserDayPlansByStatus = async (userId: string, status: string): Promise<DayPlan[]> => {
  const response = await api.get(`/day-plans/${userId}/${status}`);
  return response.data;
};

export const updateDayPlanStatus = async (planId: string, status: string): Promise<{ message: string }> => {
  const response = await api.put(`/day-plans/${planId}/status?status=${status}`);
  return response.data;
};

// AI Travel Planning APIs
export const planMyTrip = async (request: TravelPlanRequest): Promise<any> => {
  const response = await api.post('/plan_my_trip', request);
  return response.data;
};

export const getTopPlaces = async (request: TopPlacesRequest): Promise<any> => {
  const response = await api.post('/top_places', request);
  return response.data;
};

// Travel Buddy Chatbot APIs
export const chatbotFromDayPlans = async (
  userId: string,
  itineraryId?: string,
  message?: string
): Promise<any> => {
  const response = await api.post('/chatbot_from_dayplans', {
    user_id: userId,
    itinerary_id: itineraryId,
    message: message,
  });
  return response.data;
};

export const chatbotFromStartMyDay = async (
  userId: string,
  message?: string,
  action?: string
): Promise<any> => {
  const response = await api.post('/chatbot_from_startmyday', {
    user_id: userId,
    message: message,
    action: action,
  });
  return response.data;
};

// Saved Reels APIs
export const getSavedReels = async (userId: string): Promise<any[]> => {
  const response = await api.get(`/saved-reels/${userId}`);
  return response.data;
};

// Analytics APIs
export const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
  try {
    const response = await api.post('/analytics/track', {
      event: eventName,
      properties: properties || {},
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

// Notification APIs
export const registerForNotifications = async (userId: string, pushToken: string) => {
  const response = await api.post('/notifications/register', {
    user_id: userId,
    push_token: pushToken,
  });
  return response.data;
};

export const updateNotificationPreferences = async (userId: string, preferences: Record<string, boolean>) => {
  const response = await api.put(`/notifications/preferences/${userId}`, preferences);
  return response.data;
};

export default api;