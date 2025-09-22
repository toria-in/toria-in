"""
Push Notification Microservice for Toria
Handles trip reminders, recommendations, and real-time updates
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
import schedule
import time
from threading import Thread

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.toria_db

class NotificationService:
    """Handles push notifications for travel events"""
    
    def __init__(self):
        self.notification_queue = []
    
    async def send_notification(self, user_id: str, title: str, body: str, data: Dict = None):
        """Send push notification to user"""
        notification = {
            "user_id": user_id,
            "title": title,
            "body": body,
            "data": data or {},
            "sent_at": datetime.utcnow(),
            "type": "push",
            "status": "sent"
        }
        
        try:
            # Store notification in database
            await db.notifications.insert_one(notification)
            
            # TODO: Integrate with FCM or push notification service
            # For now, we'll log the notification
            print(f"📱 Notification sent to {user_id}: {title} - {body}")
            
            return {"success": True, "notification_id": str(notification["_id"])}
            
        except Exception as e:
            print(f"Failed to send notification: {e}")
            return {"success": False, "error": str(e)}
    
    async def schedule_trip_notifications(self):
        """Check for upcoming trips and schedule notifications"""
        
        # Get trips starting in the next 48 hours
        tomorrow = datetime.utcnow() + timedelta(days=1)
        day_after = datetime.utcnow() + timedelta(days=2)
        
        try:
            upcoming_trips = await db.day_plans.find({
                "date": {
                    "$gte": tomorrow.isoformat(),
                    "$lte": day_after.isoformat()
                },
                "status": "upcoming"
            }).to_list(length=100)
            
            for trip in upcoming_trips:
                user_id = trip.get("user_id")
                trip_date = datetime.fromisoformat(trip.get("date", ""))
                city = trip.get("city", "your destination")
                
                # Calculate time until trip
                time_until_trip = trip_date - datetime.utcnow()
                hours_until = int(time_until_trip.total_seconds() / 3600)
                
                # 24 hours before trip - Tips & Recommendations
                if 20 <= hours_until <= 28:
                    await self.send_trip_preparation_notification(user_id, trip, city)
                
                # 12 hours before trip - Last-minute suggestions
                elif 10 <= hours_until <= 14:
                    await self.send_trip_reminder_notification(user_id, trip, city)
        
        except Exception as e:
            print(f"Error scheduling trip notifications: {e}")
    
    async def send_trip_preparation_notification(self, user_id: str, trip: Dict, city: str):
        """Send preparation notification 24 hours before trip"""
        
        title = f"🎒 Trip to {city} Tomorrow!"
        body = f"Get ready for your {trip.get('focus', 'adventure')} trip. Check the weather and pack accordingly!"
        
        data = {
            "type": "trip_preparation",
            "trip_id": trip.get("id"),
            "city": city,
            "actions": [
                "Check weather forecast",
                "Plan your route",
                "Charge your devices"
            ]
        }
        
        await self.send_notification(user_id, title, body, data)
    
    async def send_trip_reminder_notification(self, user_id: str, trip: Dict, city: str):
        """Send reminder notification 12 hours before trip"""
        
        title = f"⏰ {city} Trip Starting Soon!"
        body = f"Your trip starts in a few hours. Traffic is looking good - you're all set!"
        
        data = {
            "type": "trip_reminder",
            "trip_id": trip.get("id"),
            "city": city,
            "actions": [
                "Start My Day",
                "Check directions",
                "View itinerary"
            ]
        }
        
        await self.send_notification(user_id, title, body, data)
    
    async def send_location_suggestions(self, user_id: str, current_location: str, suggestions: List[Dict]):
        """Send nearby alternatives when user finishes early"""
        
        title = f"🌟 Finished Early? Great Options Nearby!"
        body = f"Found {len(suggestions)} amazing places near {current_location}"
        
        data = {
            "type": "location_suggestions",
            "current_location": current_location,
            "suggestions": suggestions
        }
        
        return await self.send_notification(user_id, title, body, data)
    
    async def send_feedback_reminder(self, user_id: str, completed_stop: str):
        """Send feedback request after completing a stop"""
        
        title = f"💭 How was {completed_stop}?"
        body = "Share your experience to help other travelers!"
        
        data = {
            "type": "feedback_request",
            "stop_name": completed_stop,
            "actions": ["Rate experience", "Add photos", "Write review"]
        }
        
        return await self.send_notification(user_id, title, body, data)
    
    async def get_user_notifications(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get user's notification history"""
        
        try:
            notifications = await db.notifications.find({
                "user_id": user_id
            }).sort("sent_at", -1).limit(limit).to_list(length=limit)
            
            return notifications
            
        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return []

# Notification scheduler
class NotificationScheduler:
    """Background scheduler for automated notifications"""
    
    def __init__(self):
        self.service = NotificationService()
        self.running = False
    
    def start_scheduler(self):
        """Start the background notification scheduler"""
        
        # Schedule checks every 30 minutes
        schedule.every(30).minutes.do(self._run_async_job)
        
        self.running = True
        
        def run_scheduler():
            while self.running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        # Run scheduler in background thread
        scheduler_thread = Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        
        print("📅 Notification scheduler started")
    
    def stop_scheduler(self):
        """Stop the notification scheduler"""
        self.running = False
        print("📅 Notification scheduler stopped")
    
    def _run_async_job(self):
        """Run async notification job"""
        asyncio.create_task(self.service.schedule_trip_notifications())

# Global instances
notification_service = NotificationService()
notification_scheduler = NotificationScheduler()

# Helper functions for external use
async def send_notification(user_id: str, title: str, body: str, data: Dict = None):
    """Send notification - external interface"""
    return await notification_service.send_notification(user_id, title, body, data)

async def send_location_suggestions(user_id: str, location: str, suggestions: List[Dict]):
    """Send location-based suggestions"""
    return await notification_service.send_location_suggestions(user_id, location, suggestions)

async def send_feedback_reminder(user_id: str, stop_name: str):
    """Send feedback reminder"""
    return await notification_service.send_feedback_reminder(user_id, stop_name)

async def get_user_notifications(user_id: str, limit: int = 20):
    """Get user notifications"""
    return await notification_service.get_user_notifications(user_id, limit)

def start_notification_scheduler():
    """Start automated notification scheduling"""
    notification_scheduler.start_scheduler()

def stop_notification_scheduler():
    """Stop automated notification scheduling"""
    notification_scheduler.stop_scheduler()