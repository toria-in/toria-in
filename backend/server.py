"""
Toria Backend API - Complete Travel Planning Platform
FastAPI + MongoDB + LangChain AI Integration
"""

import os
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import asyncio

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv

# Import our modules
from chatbot import chat_from_profile_dayplans, chat_from_start_my_day, general_travel_chat
from notifications import (
    send_notification, send_location_suggestions, send_feedback_reminder,
    get_user_notifications, start_notification_scheduler
)

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Toria API",
    description="Complete travel planning and discovery platform",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.toria_db

# Start notification scheduler on startup
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    start_notification_scheduler()
    print("🚀 Toria API started successfully")
    print("📱 Notification scheduler active")
    print("🤖 Travel Buddy chatbot ready")

# Pydantic models
class ReelResponse(BaseModel):
    id: str
    instagram_url: str
    embed_code: str
    title: str
    description: Optional[str] = None
    location: str
    type: str
    creator_handle: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    upvotes: int = 0
    saves: int = 0

class DayPlan(BaseModel):
    id: str
    user_id: str
    title: str
    city: str
    going_with: str
    focus: str
    date: str
    status: str = "upcoming"
    stops: List[Dict[str, Any]] = []
    items_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TripPlanRequest(BaseModel):
    places: List[str]
    going_with: str
    focus: str
    duration: int
    duration_unit: str
    date: str
    time: str
    preferences: Dict[str, Any] = {}
    user_id: str

class ChatRequest(BaseModel):
    message: str
    user_id: str
    context_type: str = "general"
    itinerary_id: Optional[str] = None

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None

# ======================================
# HEALTH & STATUS ENDPOINTS
# ======================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Toria API is running",
        "version": "2.0.0",
        "features": ["travel_planning", "reel_discovery", "chatbot", "notifications"]
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "services": {
            "chatbot": "active",
            "notifications": "active",
            "ai_planning": "active"
        }
    }

# ======================================
# REEL DISCOVERY ENDPOINTS
# ======================================

@app.get("/api/reels", response_model=List[ReelResponse])
async def get_reels(location: str = "Delhi", limit: int = 20):
    """Get Instagram reels filtered by location"""
    try:
        # Mock data for now - replace with actual Instagram API integration
        mock_reels = [
            {
                "id": f"reel_{i}",
                "instagram_url": f"https://instagram.com/p/mock{i}",
                "embed_code": f"<iframe src='https://instagram.com/p/mock{i}/embed'></iframe>",
                "title": f"Amazing {location} Experience #{i}",
                "description": f"Discover the best of {location} with this incredible {['food', 'place'][i % 2]} experience!",
                "location": location,
                "type": ["Food", "Place"][i % 2],
                "creator_handle": f"@traveler{i}",
                "tags": [location.lower(), ["food", "place"][i % 2], "travel"],
                "metadata": {
                    "price": f"₹{(i + 1) * 100}-{(i + 1) * 200}",
                    "hygiene": "Excellent",
                    "timing": f"{9 + i}:00 AM - {6 + i}:00 PM"
                },
                "upvotes": (i + 1) * 10,
                "saves": (i + 1) * 5
            }
            for i in range(limit)
        ]
        
        return mock_reels
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reels: {str(e)}")

@app.post("/api/reels/{reel_id}/upvote")
async def upvote_reel(reel_id: str):
    """Upvote a reel"""
    try:
        # Mock implementation - replace with actual database update
        return {"success": True, "message": "Reel upvoted successfully", "reel_id": reel_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error upvoting reel: {str(e)}")

@app.post("/api/reels/{reel_id}/save")
async def save_reel(reel_id: str, user_id: str):
    """Save a reel to user's favorites"""
    try:
        saved_reel = {
            "user_id": user_id,
            "reel_id": reel_id,
            "saved_at": datetime.utcnow().isoformat()
        }
        
        await db.saved_reels.insert_one(saved_reel)
        return {"success": True, "message": "Reel saved successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving reel: {str(e)}")

# ======================================
# AI TRAVEL PLANNING ENDPOINTS
# ======================================

@app.post("/api/plan-my-trip")
async def plan_my_trip(request: TripPlanRequest):
    """Generate AI-powered travel itinerary"""
    try:
        # Mock AI response - replace with actual LangChain integration
        ai_plan = {
            "itinerary_id": f"plan_{request.user_id}_{int(datetime.utcnow().timestamp())}",
            "title": f"{', '.join(request.places)} {request.focus.title()} Adventure",
            "city": request.places[0] if request.places else "Delhi",
            "going_with": request.going_with,
            "focus": request.focus,
            "duration": f"{request.duration} {request.duration_unit}",
            "total_stops": 6,
            "stops": [
                {
                    "id": f"stop_{i}",
                    "name": f"Amazing {request.focus} Spot {i}",
                    "type": "Food" if i % 2 == 0 else "Place",
                    "time_window": f"{9 + i * 2}:00 - {11 + i * 2}:00",
                    "quick_info": f"Perfect for {request.going_with.lower()} trips. Try the signature experience!",
                    "estimated_duration": "2 hours",
                    "cost_estimate": f"₹{(i + 1) * 200}"
                }
                for i in range(6)
            ],
            "ai_recommendations": [
                f"Perfect for {request.going_with.lower()} trips",
                f"Great {request.focus} experiences",
                f"Ideal {request.duration_unit} itinerary"
            ],
            "estimated_total_cost": "₹2,000 - ₹3,500",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Save to database
        day_plan = DayPlan(
            id=ai_plan["itinerary_id"],
            user_id=request.user_id,
            title=ai_plan["title"],
            city=ai_plan["city"],
            going_with=request.going_with,
            focus=request.focus,
            date=request.date,
            stops=ai_plan["stops"],
            items_count=len(ai_plan["stops"])
        )
        
        await db.day_plans.insert_one(day_plan.dict())
        
        return ai_plan
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error planning trip: {str(e)}")

@app.post("/api/top-places")
async def get_top_places(request: Dict[str, Any]):
    """Get top places for manual day building"""
    try:
        places = request.get("places", ["Delhi"])
        focus = request.get("focus", "both")
        
        # Mock top places - replace with actual AI recommendations
        top_places = [
            {
                "id": f"place_{i}",
                "name": f"Top {focus.title()} Destination {i}",
                "type": "Food" if i % 2 == 0 else "Place",
                "location": places[0] if places else "Delhi",
                "rating": 4.5 + (i * 0.1),
                "image_url": f"https://example.com/image{i}.jpg",
                "quick_info": f"Must-visit {focus} spot with amazing reviews",
                "estimated_time": f"{1 + i} hours",
                "cost_range": f"₹{i * 100} - ₹{(i + 1) * 200}"
            }
            for i in range(12)
        ]
        
        return {"places": top_places, "total": len(top_places)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top places: {str(e)}")

# ======================================
# DAY PLANS MANAGEMENT
# ======================================

@app.get("/api/day-plans/{user_id}")
async def get_user_day_plans(user_id: str):
    """Get user's day plans"""
    try:
        plans_cursor = db.day_plans.find({"user_id": user_id}).sort("created_at", -1)
        plans = await plans_cursor.to_list(length=50)
        
        # Convert ObjectId to string for JSON serialization
        for plan in plans:
            plan["_id"] = str(plan["_id"])
        
        return plans
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching day plans: {str(e)}")

@app.get("/api/saved-reels/{user_id}")
async def get_saved_reels(user_id: str):
    """Get user's saved reels"""
    try:
        saved_cursor = db.saved_reels.find({"user_id": user_id}).sort("saved_at", -1)
        saved_reels = await saved_cursor.to_list(length=50)
        
        # Mock reel data for each saved reel
        reels_data = []
        for saved in saved_reels:
            reel_data = {
                "id": saved["reel_id"],
                "title": f"Saved Reel {saved['reel_id'][-3:]}",
                "thumbnail_url": f"https://example.com/thumb_{saved['reel_id']}.jpg",
                "location": "Delhi",
                "type": "Food" if len(saved["reel_id"]) % 2 == 0 else "Place",
                "instagram_url": f"https://instagram.com/p/{saved['reel_id']}",
                "saved_at": saved["saved_at"]
            }
            reels_data.append(reel_data)
        
        return reels_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching saved reels: {str(e)}")

# ======================================
# TRAVEL BUDDY CHATBOT ENDPOINTS
# ======================================

@app.post("/api/chatbot/profile-dayplans")
async def chatbot_from_profile(request: ChatRequest):
    """Chat from Profile → Day Plans context"""
    try:
        response = await chat_from_profile_dayplans(
            user_id=request.user_id,
            message=request.message,
            itinerary_id=request.itinerary_id
        )
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@app.post("/api/chatbot/start-my-day")
async def chatbot_from_start_day(request: ChatRequest):
    """Chat from Start My Day execution context"""
    try:
        if not request.itinerary_id:
            raise HTTPException(status_code=400, detail="Itinerary ID required for Start My Day context")
        
        response = await chat_from_start_my_day(
            user_id=request.user_id,
            message=request.message,
            itinerary_id=request.itinerary_id
        )
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@app.post("/api/chatbot/general")
async def chatbot_general(request: ChatRequest):
    """General travel assistance chat"""
    try:
        response = await general_travel_chat(
            user_id=request.user_id,
            message=request.message
        )
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# ======================================
# NOTIFICATION ENDPOINTS
# ======================================

@app.post("/api/notifications/send")
async def send_push_notification(request: NotificationRequest):
    """Send push notification to user"""
    try:
        result = await send_notification(
            user_id=request.user_id,
            title=request.title,
            body=request.body,
            data=request.data
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notification error: {str(e)}")

@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str, limit: int = 20):
    """Get user's notification history"""
    try:
        notifications = await get_user_notifications(user_id, limit)
        
        # Convert ObjectId to string
        for notification in notifications:
            notification["_id"] = str(notification["_id"])
        
        return notifications
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@app.post("/api/notifications/location-suggestions")
async def notify_location_suggestions(request: Dict[str, Any]):
    """Send location-based suggestions notification"""
    try:
        result = await send_location_suggestions(
            user_id=request["user_id"],
            location=request["location"],
            suggestions=request["suggestions"]
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending suggestions: {str(e)}")

@app.post("/api/notifications/feedback-reminder")
async def notify_feedback_reminder(request: Dict[str, Any]):
    """Send feedback reminder notification"""
    try:
        result = await send_feedback_reminder(
            user_id=request["user_id"],
            stop_name=request["stop_name"]
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending feedback reminder: {str(e)}")

# ======================================
# ANALYTICS & TRACKING
# ======================================

@app.post("/api/analytics/track")
async def track_event(request: Dict[str, Any]):
    """Track user events for analytics"""
    try:
        event = {
            "user_id": request.get("user_id"),
            "event_name": request.get("event_name"),
            "properties": request.get("properties", {}),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await db.analytics_events.insert_one(event)
        return {"success": True, "event_tracked": event["event_name"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

# ======================================
# USER MANAGEMENT
# ======================================

@app.get("/api/users/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile and preferences"""
    try:
        user = await db.users.find_one({"user_id": user_id})
        
        if not user:
            # Create default user profile
            default_user = {
                "user_id": user_id,
                "preferences": {
                    "language": "EN",
                    "notifications": True,
                    "privacy": "public"
                },
                "stats": {
                    "plans_created": 0,
                    "reels_saved": 0,
                    "trips_completed": 0
                },
                "created_at": datetime.utcnow().isoformat()
            }
            
            await db.users.insert_one(default_user)
            user = default_user
        
        user["_id"] = str(user["_id"])
        return user
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

@app.put("/api/users/{user_id}/preferences")
async def update_user_preferences(user_id: str, preferences: Dict[str, Any]):
    """Update user preferences"""
    try:
        result = await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"preferences": preferences, "updated_at": datetime.utcnow().isoformat()}},
            upsert=True
        )
        
        return {"success": True, "updated": result.modified_count > 0}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)