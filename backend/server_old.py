from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Toria Travel API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize LLM for travel planning
emergent_llm_key = os.environ.get('EMERGENT_LLM_KEY')

# MongoDB Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firebase_uid: Optional[str] = None
    email: Optional[str] = None
    display_name: str
    profile_picture: Optional[str] = None  # base64 image
    created_at: datetime = Field(default_factory=datetime.utcnow)
    preferences: Dict = Field(default_factory=dict)

class InstagramReel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    instagram_url: str
    embed_code: str
    title: str
    description: Optional[str] = None
    location: str
    type: str  # "Food" or "Place"
    creator_handle: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict = Field(default_factory=dict)
    upvotes: int = 0
    saves: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DayPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    city: str
    going_with: str  # friends/family/partner/business/solo
    focus: str  # food/attractions/both
    date: Optional[datetime] = None
    duration: Optional[str] = None
    status: str = "upcoming"  # current/upcoming/past
    stops: List[Dict] = Field(default_factory=list)
    generated_by_ai: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SavedReel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    reel_id: str
    saved_at: datetime = Field(default_factory=datetime.utcnow)

class TravelPlanRequest(BaseModel):
    places: List[str]
    going_with: str
    focus: str
    date_time: Optional[str] = None
    duration: Optional[str] = None
    diet: Optional[str] = None
    budget: Optional[str] = None
    vibe: Optional[List[str]] = None

class TopPlacesRequest(BaseModel):
    places: List[str]
    going_with: str
    focus: str
    filters: Optional[Dict] = None

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user: User):
    user_dict = user.dict()
    await db.users.insert_one(user_dict)
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# Instagram Reels endpoints
@api_router.get("/reels", response_model=List[InstagramReel])
async def get_reels(location: str = None, type: str = None, limit: int = 20):
    filters = {}
    if location:
        filters["location"] = {"$regex": location, "$options": "i"}
    if type:
        filters["type"] = type
    
    reels = await db.reels.find(filters).limit(limit).to_list(None)
    return [InstagramReel(**reel) for reel in reels]

@api_router.post("/reels", response_model=InstagramReel)
async def create_reel(reel: InstagramReel):
    reel_dict = reel.dict()
    await db.reels.insert_one(reel_dict)
    return reel

@api_router.post("/reels/{reel_id}/upvote")
async def upvote_reel(reel_id: str):
    result = await db.reels.update_one(
        {"id": reel_id},
        {"$inc": {"upvotes": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reel not found")
    return {"message": "Upvoted successfully"}

@api_router.post("/reels/{reel_id}/save")
async def save_reel(reel_id: str, user_id: str):
    # Check if already saved
    existing = await db.saved_reels.find_one({"user_id": user_id, "reel_id": reel_id})
    if existing:
        return {"message": "Already saved"}
    
    saved_reel = SavedReel(user_id=user_id, reel_id=reel_id)
    await db.saved_reels.insert_one(saved_reel.dict())
    
    # Update reel saves count
    await db.reels.update_one(
        {"id": reel_id},
        {"$inc": {"saves": 1}}
    )
    return {"message": "Saved successfully"}

# Day Plans endpoints
@api_router.post("/day-plans", response_model=DayPlan)
async def create_day_plan(plan: DayPlan):
    plan_dict = plan.dict()
    await db.day_plans.insert_one(plan_dict)
    return plan

@api_router.get("/day-plans/{user_id}", response_model=List[DayPlan])
async def get_user_day_plans(user_id: str):
    plans = await db.day_plans.find({"user_id": user_id}).to_list(None)
    return [DayPlan(**plan) for plan in plans]

@api_router.get("/day-plans/{user_id}/{status}", response_model=List[DayPlan])
async def get_user_day_plans_by_status(user_id: str, status: str):
    plans = await db.day_plans.find({"user_id": user_id, "status": status}).to_list(None)
    return [DayPlan(**plan) for plan in plans]

@api_router.put("/day-plans/{plan_id}/status")
async def update_day_plan_status(plan_id: str, status: str):
    result = await db.day_plans.update_one(
        {"id": plan_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Day plan not found")
    return {"message": "Status updated successfully"}

# AI Travel Planning endpoints
@api_router.post("/plan_my_trip")
async def plan_my_trip(request: TravelPlanRequest):
    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=f"travel-planning-{uuid.uuid4()}",
            system_message="""You are a travel planning expert specializing in creating personalized itineraries.
            You must return responses in valid JSON format only.
            
            Based on the user's inputs, generate:
            1. Toria Recommended: AI-curated suggestions
            2. Build Your Day: User selection options
            
            Format your response as JSON with this structure:
            {
                "toria_recommended": {
                    "type": "list" or "itinerary",
                    "suggestions": [...],
                    "message": "explanation"
                },
                "build_your_day": {
                    "guidance": "For ~X hours, travelers usually cover Y-Z items",
                    "food_options": [...],
                    "place_options": [...]
                }
            }"""
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Create prompt from request
        prompt = f"""
        Plan a trip with these details:
        - Places: {', '.join(request.places)}
        - Going with: {request.going_with}
        - Focus: {request.focus}
        - Duration: {request.duration or 'Not specified'}
        - Date/Time: {request.date_time or 'Flexible'}
        - Diet: {request.diet or 'No restrictions'}
        - Budget: {request.budget or 'Moderate'}
        - Vibe: {request.vibe or ['General']}
        
        Provide practical, local recommendations with specific details like names, timings, and why each place is recommended.
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse as JSON
        try:
            result = json.loads(response)
        except:
            # Fallback if not JSON
            result = {
                "toria_recommended": {
                    "type": "itinerary",
                    "suggestions": [
                        {"name": "Local Food Street", "type": "Food", "time": "6:00 PM", "reason": "Popular evening spot"},
                        {"name": "City Park", "type": "Place", "time": "7:30 PM", "reason": "Great for evening walks"}
                    ],
                    "message": response[:200] + "..."
                },
                "build_your_day": {
                    "guidance": "For ~4 hours, travelers usually cover 3-5 items",
                    "food_options": [{"name": "Popular Restaurant", "cuisine": "Local", "price": "$$"}],
                    "place_options": [{"name": "Historic Site", "type": "Culture", "duration": "1-2 hours"}]
                }
            }
        
        return result
        
    except Exception as e:
        logging.error(f"Error in plan_my_trip: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating travel plan")

@api_router.post("/top_places")
async def top_places(request: TopPlacesRequest):
    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=f"top-places-{uuid.uuid4()}",
            system_message="""You are a local travel expert. Return responses in valid JSON format only.
            
            Provide top places based on user criteria with detailed information for each place.
            
            Format your response as JSON:
            {
                "food_places": [
                    {
                        "name": "Restaurant Name",
                        "top_dishes": ["dish1", "dish2"],
                        "price_band": "$$ or $$$",
                        "hygiene": "Excellent/Good/Fair",
                        "open_hours": "timing",
                        "area": "locality"
                    }
                ],
                "attraction_places": [
                    {
                        "name": "Place Name",
                        "vibe_tags": ["tag1", "tag2"],
                        "fee_info": "Free or amount",
                        "ideal_time": "timing",
                        "area": "locality"
                    }
                ]
            }"""
        ).with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""
        Find top places for:
        - Places: {', '.join(request.places)}
        - Going with: {request.going_with}
        - Focus: {request.focus}
        - Filters: {request.filters or 'None'}
        
        Provide specific, well-known places with practical details.
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            result = json.loads(response)
        except:
            # Fallback structure
            result = {
                "food_places": [
                    {
                        "name": "Local Favorite Restaurant",
                        "top_dishes": ["Signature Dish", "Popular Item"],
                        "price_band": "$$",
                        "hygiene": "Good",
                        "open_hours": "10 AM - 10 PM",
                        "area": "City Center"
                    }
                ],
                "attraction_places": [
                    {
                        "name": "Famous Landmark",
                        "vibe_tags": ["Historical", "Cultural"],
                        "fee_info": "Free",
                        "ideal_time": "Morning",
                        "area": "Historic District"
                    }
                ]
            }
        
        return result
        
    except Exception as e:
        logging.error(f"Error in top_places: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching top places")

# Travel Buddy Chatbot endpoints
@api_router.post("/chatbot_from_dayplans")
async def chatbot_from_dayplans(user_id: str, itinerary_id: str = None, message: str = ""):
    try:
        if not itinerary_id:
            # Ask user to select itinerary
            plans = await db.day_plans.find({"user_id": user_id}).to_list(None)
            return {
                "message": "Which itinerary or day plan would you like me to help with?",
                "itineraries": [{"id": p["id"], "title": p["title"], "city": p["city"]} for p in plans],
                "context": {"needs_selection": True}
            }
        
        # Load specific itinerary
        plan = await db.day_plans.find_one({"id": itinerary_id, "user_id": user_id})
        if not plan:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        # Initialize chatbot with itinerary context
        chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=f"chatbot-dayplans-{user_id}-{itinerary_id}",
            system_message=f"""You are a helpful travel buddy chatbot. 
            You're helping with this itinerary:
            Title: {plan['title']}
            City: {plan['city']}
            Going with: {plan['going_with']}
            Focus: {plan['focus']}
            Stops: {plan['stops']}
            
            Answer questions about this itinerary, provide local insights, and help with travel concerns.
            Keep responses concise and helpful."""
        ).with_model("gemini", "gemini-2.5-flash")
        
        user_message = UserMessage(text=message or "Tell me about this itinerary")
        response = await chat.send_message(user_message)
        
        return {
            "message": response,
            "context": {
                "itinerary_id": itinerary_id,
                "title": plan["title"],
                "city": plan["city"]
            }
        }
        
    except Exception as e:
        logging.error(f"Error in chatbot_from_dayplans: {str(e)}")
        raise HTTPException(status_code=500, detail="Chatbot error")

@api_router.post("/chatbot_from_startmyday")
async def chatbot_from_startmyday(user_id: str, message: str = "", action: str = None):
    try:
        # Get current active day plan
        current_plan = await db.day_plans.find_one({"user_id": user_id, "status": "current"})
        if not current_plan:
            return {
                "message": "No active day plan found. Please start a day plan first!",
                "context": {"error": "no_active_plan"}
            }
        
        chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=f"chatbot-startmyday-{user_id}",
            system_message=f"""You are a travel buddy for an active day plan.
            Current plan: {current_plan['title']} in {current_plan['city']}
            Stops: {current_plan['stops']}
            
            Help with:
            - Marking stops as done
            - Suggesting nearby alternatives
            - Handling changes to the plan
            - Providing real-time travel assistance
            
            Return responses in JSON format with actions when needed."""
        ).with_model("gemini", "gemini-2.5-flash")
        
        user_message = UserMessage(text=message or "How can I help with your day plan?")
        response = await chat.send_message(user_message)
        
        return {
            "message": response,
            "context": {
                "itinerary_id": current_plan["id"],
                "status": "current"
            },
            "actions": []  # Will be populated based on action type
        }
        
    except Exception as e:
        logging.error(f"Error in chatbot_from_startmyday: {str(e)}")
        raise HTTPException(status_code=500, detail="Chatbot error")

# Saved reels endpoints
@api_router.get("/saved-reels/{user_id}", response_model=List[Dict])
async def get_saved_reels(user_id: str):
    saved_reels = await db.saved_reels.find({"user_id": user_id}).to_list(None)
    reel_ids = [sr["reel_id"] for sr in saved_reels]
    
    reels = await db.reels.find({"id": {"$in": reel_ids}}).to_list(None)
    # Remove MongoDB _id field to avoid serialization issues
    for reel in reels:
        reel.pop("_id", None)
    return reels

# Root endpoint
@api_router.get("/")
async def root():
    return {
        "message": "Toria Travel API v1.0.0",
        "status": "active",
        "features": [
            "Instagram reels discovery",
            "AI travel planning",
            "Day plan management",
            "Travel buddy chatbot"
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize sample data
@app.on_event("startup")
async def startup_db():
    # Add sample Instagram reels
    sample_reels = [
        {
            "id": str(uuid.uuid4()),
            "instagram_url": "https://www.instagram.com/reel/DO2dhg1gWZm/",
            "embed_code": '''<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/reel/DO2dhg1gWZm/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/reel/DO2dhg1gWZm/?utm_source=ig_embed&amp;utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"></a></div></blockquote>''',
            "title": "Amazing Street Food in Delhi",
            "description": "Must-try street food spots in Old Delhi",
            "location": "Delhi",
            "type": "Food",
            "creator_handle": "@weareindiians",
            "tags": ["street food", "delhi", "authentic"],
            "metadata": {"price": "₹", "hygiene": "Good", "timing": "Evening"},
            "upvotes": 0,
            "saves": 0,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "instagram_url": "https://www.instagram.com/reel/DK2Kx_VNphw/",
            "embed_code": '''<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/reel/DK2Kx_VNphw/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/reel/DK2Kx_VNphw/?utm_source=ig_embed&amp;utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"></a></div></blockquote>''',
            "title": "Hidden Gem Cafe in Mumbai",
            "description": "Aesthetic cafe with great vibes",
            "location": "Mumbai",
            "type": "Place",
            "creator_handle": "@20xxkidd",
            "tags": ["cafe", "mumbai", "aesthetic"],
            "metadata": {"vibe": "Trendy", "fee": "₹₹", "timing": "All day"},
            "upvotes": 0,
            "saves": 0,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "instagram_url": "https://www.instagram.com/reel/DO2ufqbklVP/",
            "embed_code": '''<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/DO2ufqbklVP/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/reel/DO2ufqbklVP/?utm_source=ig_embed&amp;utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"></a></div></blockquote>''',
            "title": "Best Breakfast Spots",
            "description": "Top breakfast places for morning vibes",
            "location": "Bangalore",
            "type": "Food",
            "creator_handle": "@corporate.vibess",
            "tags": ["breakfast", "bangalore", "morning"],
            "metadata": {"price": "₹₹", "hygiene": "Excellent", "timing": "Morning"},
            "upvotes": 0,
            "saves": 0,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Check if reels already exist
    existing_count = await db.reels.count_documents({})
    if existing_count == 0:
        await db.reels.insert_many(sample_reels)
        logger.info("Sample reels inserted")