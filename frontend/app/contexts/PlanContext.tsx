import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';

// Types for plans and itineraries
interface Stop {
  id: string;
  name: string;
  type: string;
  time_window: string;
  quick_info: string;
  estimated_duration: string;
  cost_estimate: string;
  is_visited?: boolean;
}

interface DayPlan {
  id: string;
  title: string;
  city: string;
  going_with: string;
  focus: string;
  date: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  stops: Stop[];
  items_count: number;
  created_at: string;
}

interface PlanContextType {
  plans: DayPlan[];
  activePlan: DayPlan | null;
  isLoading: boolean;
  fetchPlans: () => Promise<void>;
  setActivePlan: (planId: string) => void;
  createPlan: (planData: Partial<DayPlan>) => Promise<void>;
  markStopVisited: (planId: string, stopId: string, visited: boolean) => Promise<void>;
}

// Create the context
const PlanContext = createContext<PlanContextType | undefined>(undefined);

// Mock data for development
const MOCK_PLANS: DayPlan[] = [
  {
    id: 'plan_1',
    title: 'Delhi Food Adventure',
    city: 'Delhi',
    going_with: 'friends',
    focus: 'food',
    date: '2025-10-01',
    status: 'upcoming',
    stops: [
      {
        id: 'stop_1',
        name: 'Karim\'s Old Delhi',
        type: 'Food',
        time_window: '12:00 - 13:30',
        quick_info: 'Famous for Mughlai cuisine and kebabs',
        estimated_duration: '1.5 hours',
        cost_estimate: '₹800 for two',
        is_visited: false
      },
      {
        id: 'stop_2',
        name: 'Paranthe Wali Gali',
        type: 'Food',
        time_window: '14:00 - 15:00',
        quick_info: 'Historic lane with shops selling stuffed parathas',
        estimated_duration: '1 hour',
        cost_estimate: '₹300 for two',
        is_visited: false
      },
      {
        id: 'stop_3',
        name: 'Daulat Ki Chaat',
        type: 'Food',
        time_window: '15:30 - 16:30',
        quick_info: 'Seasonal milk dessert from Old Delhi',
        estimated_duration: '1 hour',
        cost_estimate: '₹200 for two',
        is_visited: false
      }
    ],
    items_count: 3,
    created_at: '2025-09-15T10:30:00Z'
  },
  {
    id: 'plan_2',
    title: 'Historical Delhi Tour',
    city: 'Delhi',
    going_with: 'family',
    focus: 'places',
    date: '2025-10-05',
    status: 'upcoming',
    stops: [
      {
        id: 'stop_1',
        name: 'Red Fort',
        type: 'Place',
        time_window: '10:00 - 12:00',
        quick_info: 'UNESCO World Heritage Site and historic monument',
        estimated_duration: '2 hours',
        cost_estimate: '₹150 per person',
        is_visited: false
      },
      {
        id: 'stop_2',
        name: 'Humayun\'s Tomb',
        type: 'Place',
        time_window: '13:00 - 15:00',
        quick_info: 'UNESCO site, architectural marvel from Mughal era',
        estimated_duration: '2 hours',
        cost_estimate: '₹150 per person',
        is_visited: false
      },
      {
        id: 'stop_3',
        name: 'Qutub Minar',
        type: 'Place',
        time_window: '16:00 - 18:00',
        quick_info: 'UNESCO site, tallest brick minaret in the world',
        estimated_duration: '2 hours',
        cost_estimate: '₹150 per person',
        is_visited: false
      }
    ],
    items_count: 3,
    created_at: '2025-09-20T14:15:00Z'
  }
];

// Provider component
export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [activePlan, setActivePlanState] = useState<DayPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all plans for the current user
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/api/day-plans/user123');
      // setPlans(response.data);

      // Using mock data for development
      setPlans(MOCK_PLANS);
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load your plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Set active plan by ID
  const setActivePlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setActivePlanState(plan);
    } else {
      console.warn(`Plan with ID ${planId} not found`);
    }
  };

  // Create a new plan
  const createPlan = async (planData: Partial<DayPlan>) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await api.post('/api/day-plans', planData);
      // const newPlan = response.data;

      // Mock creating a new plan
      const newPlan: DayPlan = {
        id: `plan_${Date.now()}`,
        title: planData.title || 'Untitled Plan',
        city: planData.city || 'Delhi',
        going_with: planData.going_with || 'solo',
        focus: planData.focus || 'both',
        date: planData.date || new Date().toISOString().split('T')[0],
        status: 'upcoming',
        stops: planData.stops || [],
        items_count: planData.stops?.length || 0,
        created_at: new Date().toISOString()
      };

      setPlans(prevPlans => [...prevPlans, newPlan]);
      Alert.alert('Success', 'New plan created successfully!');
    } catch (error) {
      console.error('Error creating plan:', error);
      Alert.alert('Error', 'Failed to create plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a stop as visited or not
  const markStopVisited = async (planId: string, stopId: string, visited: boolean) => {
    try {
      // Update local state
      setPlans(prevPlans =>
        prevPlans.map(plan => {
          if (plan.id === planId) {
            return {
              ...plan,
              stops: plan.stops.map(stop => {
                if (stop.id === stopId) {
                  return { ...stop, is_visited: visited };
                }
                return stop;
              })
            };
          }
          return plan;
        })
      );

      // Update active plan if it's the one being modified
      if (activePlan && activePlan.id === planId) {
        setActivePlanState({
          ...activePlan,
          stops: activePlan.stops.map(stop => {
            if (stop.id === stopId) {
              return { ...stop, is_visited: visited };
            }
            return stop;
          })
        });
      }

      // In a real app, this would be an API call
      // await api.patch(`/api/day-plans/${planId}/stops/${stopId}`, { is_visited: visited });
    } catch (error) {
      console.error('Error updating stop:', error);
      Alert.alert('Error', 'Failed to update stop. Please try again.');
    }
  };

  return (
    <PlanContext.Provider
      value={{
        plans,
        activePlan,
        isLoading,
        fetchPlans,
        setActivePlan,
        createPlan,
        markStopVisited
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

// Custom hook to use the plan context
export const usePlan = () => {
  const context = useContext(PlanContext);

  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }

  return context;
};

export default PlanProvider;
