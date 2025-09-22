"""
Travel Buddy Chatbot using LangChain + LangGraph
Provides conversational AI for travel planning and assistance
"""

import os
from typing import Dict, List, Any, Optional, TypedDict, Annotated
from datetime import datetime
import json

from langchain_google_genai import GoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv

load_dotenv()

# LLM Setup
llm = GoogleGenerativeAI(
    model="gemini-2.0-flash-exp", 
    google_api_key=os.getenv('EMERGENT_LLM_KEY'),
    temperature=0.7
)

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.toria_db

class ChatState(TypedDict):
    """State for the chatbot conversation"""
    messages: Annotated[List, add_messages]
    user_id: str
    context_type: str  # 'profile_dayplans' or 'start_my_day'
    itinerary_id: Optional[str]
    current_itinerary: Optional[Dict]
    user_preferences: Optional[Dict]
    suggested_actions: List[Dict]

class ToriaChatbot:
    """Main chatbot class with LangGraph state management"""
    
    def __init__(self):
        self.memory = MemorySaver()
        self.graph = self._create_graph()
        
    def _create_graph(self) -> StateGraph:
        """Create the conversation graph with different flows"""
        
        # Define the graph
        workflow = StateGraph(ChatState)
        
        # Add nodes
        workflow.add_node("route_context", self._route_context)
        workflow.add_node("profile_dayplans_chat", self._profile_dayplans_chat)
        workflow.add_node("start_my_day_chat", self._start_my_day_chat)
        workflow.add_node("general_travel_chat", self._general_travel_chat)
        workflow.add_node("provide_suggestions", self._provide_suggestions)
        
        # Define edges
        workflow.add_edge(START, "route_context")
        workflow.add_conditional_edges(
            "route_context",
            self._route_decision,
            {
                "profile_dayplans": "profile_dayplans_chat",
                "start_my_day": "start_my_day_chat",
                "general": "general_travel_chat"
            }
        )
        workflow.add_edge("profile_dayplans_chat", "provide_suggestions")
        workflow.add_edge("start_my_day_chat", "provide_suggestions")
        workflow.add_edge("general_travel_chat", "provide_suggestions")
        workflow.add_edge("provide_suggestions", END)
        
        return workflow.compile(checkpointer=self.memory)
    
    def _route_decision(self, state: ChatState) -> str:
        """Route the conversation based on context"""
        context_type = state.get("context_type", "general")
        
        if context_type == "profile_dayplans":
            return "profile_dayplans"
        elif context_type == "start_my_day":
            return "start_my_day"
        else:
            return "general"
    
    async def _route_context(self, state: ChatState) -> Dict:
        """Determine conversation context and load relevant data"""
        user_id = state["user_id"]
        context_type = state["context_type"]
        
        # Load user preferences
        try:
            user_doc = await db.users.find_one({"user_id": user_id})
            user_preferences = user_doc.get("preferences", {}) if user_doc else {}
        except Exception:
            user_preferences = {}
        
        # Load itinerary if specified
        current_itinerary = None
        if state.get("itinerary_id"):
            try:
                itinerary_doc = await db.day_plans.find_one({
                    "id": state["itinerary_id"],
                    "user_id": user_id
                })
                current_itinerary = itinerary_doc if itinerary_doc else None
            except Exception:
                current_itinerary = None
        
        return {
            "user_preferences": user_preferences,
            "current_itinerary": current_itinerary
        }
    
    async def _profile_dayplans_chat(self, state: ChatState) -> Dict:
        """Handle chat from Profile → My Day Plans context"""
        
        system_prompt = """You are Toria, a friendly and knowledgeable travel assistant. 
        The user is chatting from their Profile → My Day Plans section.
        
        You can help with:
        - Questions about their existing day plans
        - Suggestions for improving itineraries
        - Travel tips for specific destinations
        - Recommendations for places, food, and activities
        - Planning new trips
        
        Always be helpful, enthusiastic, and provide actionable advice.
        Keep responses concise but informative.
        
        User's current context: {context}
        User preferences: {preferences}
        """
        
        context_info = {
            "itinerary": state.get("current_itinerary"),
            "total_plans": "multiple plans available"
        }
        
        preferences_info = state.get("user_preferences", {})
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt.format(
                context=json.dumps(context_info, indent=2),
                preferences=json.dumps(preferences_info, indent=2)
            )),
            MessagesPlaceholder(variable_name="messages")
        ])
        
        chain = prompt | llm
        
        # Get the last human message
        last_message = state["messages"][-1] if state["messages"] else HumanMessage(content="Hello!")
        
        # Generate response
        response = await chain.ainvoke({
            "messages": state["messages"]
        })
        
        return {
            "messages": [AIMessage(content=response)]
        }
    
    async def _start_my_day_chat(self, state: ChatState) -> Dict:
        """Handle chat from Start My Day execution context"""
        
        system_prompt = """You are Toria, helping the user during their active day trip.
        You're in "Start My Day" mode - the user is actively executing their itinerary.
        
        You can help with:
        - Real-time suggestions for their current location
        - Nearby alternatives if they finish early or need changes
        - Quick tips about the places they're visiting
        - Handle "Check Done" feedback and suggest next steps
        - Traffic/timing advice
        - Emergency assistance or directions
        
        Be proactive, location-aware, and time-sensitive in your responses.
        
        Current itinerary: {itinerary}
        User preferences: {preferences}
        """
        
        itinerary_info = state.get("current_itinerary", {})
        preferences_info = state.get("user_preferences", {})
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt.format(
                itinerary=json.dumps(itinerary_info, indent=2),
                preferences=json.dumps(preferences_info, indent=2)
            )),
            MessagesPlaceholder(variable_name="messages")
        ])
        
        chain = prompt | llm
        
        response = await chain.ainvoke({
            "messages": state["messages"]
        })
        
        return {
            "messages": [AIMessage(content=response)]
        }
    
    async def _general_travel_chat(self, state: ChatState) -> Dict:
        """Handle general travel conversation"""
        
        system_prompt = """You are Toria, a knowledgeable and friendly travel assistant.
        Help users with general travel questions, planning, and recommendations.
        
        You can help with:
        - Travel planning and itinerary suggestions
        - Destination recommendations
        - Food and activity suggestions
        - Travel tips and advice
        - Cultural information
        - Safety and practical travel information
        
        Be enthusiastic, helpful, and provide specific actionable advice.
        Focus on Indian destinations and experiences.
        
        User preferences: {preferences}
        """
        
        preferences_info = state.get("user_preferences", {})
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt.format(
                preferences=json.dumps(preferences_info, indent=2)
            )),
            MessagesPlaceholder(variable_name="messages")
        ])
        
        chain = prompt | llm
        
        response = await chain.ainvoke({
            "messages": state["messages"]
        })
        
        return {
            "messages": [AIMessage(content=response)]
        }
    
    async def _provide_suggestions(self, state: ChatState) -> Dict:
        """Generate contextual suggestions and actions"""
        
        context_type = state["context_type"]
        current_itinerary = state.get("current_itinerary")
        
        suggested_actions = []
        
        if context_type == "start_my_day" and current_itinerary:
            # Suggest location-based actions
            suggested_actions = [
                {
                    "type": "nearby_suggestions",
                    "payload": {"location": "current_location"},
                    "label": "Find nearby alternatives"
                },
                {
                    "type": "check_done",
                    "payload": {"stop_id": "current_stop"},
                    "label": "Mark location as visited"
                },
                {
                    "type": "get_directions",
                    "payload": {"destination": "next_stop"},
                    "label": "Get directions to next stop"
                }
            ]
        elif context_type == "profile_dayplans":
            # Suggest planning actions
            suggested_actions = [
                {
                    "type": "create_new_plan",
                    "payload": {},
                    "label": "Create new day plan"
                },
                {
                    "type": "modify_existing",
                    "payload": {"itinerary_id": state.get("itinerary_id")},
                    "label": "Modify this plan"
                }
            ]
        
        return {
            "suggested_actions": suggested_actions
        }
    
    async def chat(self, 
                   user_id: str, 
                   message: str, 
                   context_type: str = "general",
                   itinerary_id: Optional[str] = None) -> Dict[str, Any]:
        """Main chat interface"""
        
        # Create thread configuration
        config = {"configurable": {"thread_id": f"{user_id}_{context_type}"}}
        
        # Initial state
        initial_state = {
            "messages": [HumanMessage(content=message)],
            "user_id": user_id,
            "context_type": context_type,
            "itinerary_id": itinerary_id,
            "current_itinerary": None,
            "user_preferences": None,
            "suggested_actions": []
        }
        
        try:
            # Run the conversation
            result = await self.graph.ainvoke(initial_state, config)
            
            # Extract the AI response
            ai_messages = [msg for msg in result["messages"] if isinstance(msg, AIMessage)]
            response_text = ai_messages[-1].content if ai_messages else "I'm here to help! What would you like to know?"
            
            return {
                "message": response_text,
                "actions": result.get("suggested_actions", []),
                "context": {
                    "itinerary_id": itinerary_id,
                    "context_type": context_type,
                    "user_id": user_id
                }
            }
            
        except Exception as e:
            print(f"Chatbot error: {e}")
            return {
                "message": "I'm having trouble right now. Please try again in a moment!",
                "actions": [],
                "context": {
                    "itinerary_id": itinerary_id,
                    "context_type": context_type,
                    "user_id": user_id,
                    "error": str(e)
                }
            }

# Global chatbot instance
toria_chatbot = ToriaChatbot()

# Convenience functions for different entry points
async def chat_from_profile_dayplans(user_id: str, message: str, itinerary_id: Optional[str] = None):
    """Entry point from Profile → My Day Plans"""
    return await toria_chatbot.chat(
        user_id=user_id,
        message=message,
        context_type="profile_dayplans",
        itinerary_id=itinerary_id
    )

async def chat_from_start_my_day(user_id: str, message: str, itinerary_id: str):
    """Entry point from Start My Day execution"""
    return await toria_chatbot.chat(
        user_id=user_id,
        message=message,
        context_type="start_my_day",
        itinerary_id=itinerary_id
    )

async def general_travel_chat(user_id: str, message: str):
    """General travel assistance"""
    return await toria_chatbot.chat(
        user_id=user_id,
        message=message,
        context_type="general"
    )