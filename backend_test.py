#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Toria API
Tests all endpoints including health, reels, AI planning, chatbot, notifications, and analytics
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from environment
BACKEND_URL = "https://toria-discover-plan.preview.emergentagent.com/api"
BASE_URL = "https://toria-discover-plan.preview.emergentagent.com"
BACKEND_ROOT = "http://localhost:8001"

class ToriaBackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.test_user_id = "test-user-12345"
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, category: str, test_name: str, status: str, details: str = ""):
        """Log test results"""
        result = {
            "category": category,
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} [{category}] {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    async def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n🏥 Testing Health Endpoints...")
        
        # Test root health check
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "healthy" and "features" in data:
                        self.log_test("Health", "Root Health Check", "PASS", 
                                    f"Status: {data['status']}, Features: {len(data['features'])}")
                    else:
                        self.log_test("Health", "Root Health Check", "FAIL", 
                                    f"Invalid response structure: {data}")
                else:
                    self.log_test("Health", "Root Health Check", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Health", "Root Health Check", "FAIL", str(e))
        
        # Test detailed health check
        try:
            async with self.session.get(f"{BACKEND_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "healthy" and "services" in data:
                        self.log_test("Health", "Detailed Health Check", "PASS", 
                                    f"DB: {data.get('database', 'unknown')}, Services: {len(data.get('services', {}))}")
                    else:
                        self.log_test("Health", "Detailed Health Check", "FAIL", 
                                    f"Invalid response: {data}")
                else:
                    self.log_test("Health", "Detailed Health Check", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Health", "Detailed Health Check", "FAIL", str(e))
    
    async def test_reel_discovery(self):
        """Test Instagram reel discovery endpoints"""
        print("\n📱 Testing Reel Discovery...")
        
        # Test get reels with location filter
        try:
            async with self.session.get(f"{BACKEND_URL}/reels?location=Delhi&limit=5") as response:
                if response.status == 200:
                    reels = await response.json()
                    if isinstance(reels, list) and len(reels) > 0:
                        reel = reels[0]
                        required_fields = ["id", "instagram_url", "title", "location", "type", "upvotes", "saves"]
                        if all(field in reel for field in required_fields):
                            self.log_test("Reels", "Get Reels with Location Filter", "PASS", 
                                        f"Retrieved {len(reels)} reels for Delhi")
                        else:
                            missing = [f for f in required_fields if f not in reel]
                            self.log_test("Reels", "Get Reels with Location Filter", "FAIL", 
                                        f"Missing fields: {missing}")
                    else:
                        self.log_test("Reels", "Get Reels with Location Filter", "FAIL", 
                                    "No reels returned or invalid format")
                else:
                    self.log_test("Reels", "Get Reels with Location Filter", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Reels", "Get Reels with Location Filter", "FAIL", str(e))
        
        # Test upvote reel
        try:
            async with self.session.post(f"{BACKEND_URL}/reels/reel_1/upvote") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("reel_id") == "reel_1":
                        self.log_test("Reels", "Upvote Reel", "PASS", "Reel upvoted successfully")
                    else:
                        self.log_test("Reels", "Upvote Reel", "FAIL", f"Invalid response: {data}")
                else:
                    self.log_test("Reels", "Upvote Reel", "FAIL", f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Reels", "Upvote Reel", "FAIL", str(e))
        
        # Test save reel
        try:
            payload = {"user_id": self.test_user_id}
            async with self.session.post(f"{BACKEND_URL}/reels/reel_1/save", 
                                       params=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.log_test("Reels", "Save Reel", "PASS", "Reel saved successfully")
                    else:
                        self.log_test("Reels", "Save Reel", "FAIL", f"Save failed: {data}")
                else:
                    self.log_test("Reels", "Save Reel", "FAIL", f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Reels", "Save Reel", "FAIL", str(e))
    
    async def test_ai_travel_planning(self):
        """Test AI-powered travel planning endpoints"""
        print("\n🤖 Testing AI Travel Planning...")
        
        # Test plan-my-trip endpoint
        try:
            trip_request = {
                "places": ["Delhi", "Agra"],
                "going_with": "friends",
                "focus": "food",
                "duration": 2,
                "duration_unit": "days",
                "date": "2024-12-25",
                "time": "09:00",
                "preferences": {"budget": "medium"},
                "user_id": self.test_user_id
            }
            
            async with self.session.post(f"{BACKEND_URL}/plan-my-trip", 
                                       json=trip_request) as response:
                if response.status == 200:
                    plan = await response.json()
                    required_fields = ["itinerary_id", "title", "city", "stops", "ai_recommendations"]
                    if all(field in plan for field in required_fields):
                        stops_count = len(plan.get("stops", []))
                        self.log_test("AI Planning", "Plan My Trip", "PASS", 
                                    f"Generated itinerary with {stops_count} stops")
                    else:
                        missing = [f for f in required_fields if f not in plan]
                        self.log_test("AI Planning", "Plan My Trip", "FAIL", 
                                    f"Missing fields: {missing}")
                else:
                    self.log_test("AI Planning", "Plan My Trip", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("AI Planning", "Plan My Trip", "FAIL", str(e))
        
        # Test top-places endpoint
        try:
            places_request = {
                "places": ["Mumbai"],
                "focus": "both"
            }
            
            async with self.session.post(f"{BACKEND_URL}/top-places", 
                                       json=places_request) as response:
                if response.status == 200:
                    data = await response.json()
                    if "places" in data and isinstance(data["places"], list):
                        places_count = len(data["places"])
                        self.log_test("AI Planning", "Top Places", "PASS", 
                                    f"Retrieved {places_count} top places for Mumbai")
                    else:
                        self.log_test("AI Planning", "Top Places", "FAIL", 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("AI Planning", "Top Places", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("AI Planning", "Top Places", "FAIL", str(e))
    
    async def test_day_plans_management(self):
        """Test day plans CRUD operations"""
        print("\n📅 Testing Day Plans Management...")
        
        # Test get user day plans
        try:
            async with self.session.get(f"{BACKEND_URL}/day-plans/{self.test_user_id}") as response:
                if response.status == 200:
                    plans = await response.json()
                    if isinstance(plans, list):
                        self.log_test("Day Plans", "Get User Day Plans", "PASS", 
                                    f"Retrieved {len(plans)} day plans")
                    else:
                        self.log_test("Day Plans", "Get User Day Plans", "FAIL", 
                                    f"Invalid response format: {type(plans)}")
                else:
                    self.log_test("Day Plans", "Get User Day Plans", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Day Plans", "Get User Day Plans", "FAIL", str(e))
        
        # Test get saved reels
        try:
            async with self.session.get(f"{BACKEND_URL}/saved-reels/{self.test_user_id}") as response:
                if response.status == 200:
                    saved_reels = await response.json()
                    if isinstance(saved_reels, list):
                        self.log_test("Day Plans", "Get Saved Reels", "PASS", 
                                    f"Retrieved {len(saved_reels)} saved reels")
                    else:
                        self.log_test("Day Plans", "Get Saved Reels", "FAIL", 
                                    f"Invalid response format: {type(saved_reels)}")
                else:
                    self.log_test("Day Plans", "Get Saved Reels", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Day Plans", "Get Saved Reels", "FAIL", str(e))
    
    async def test_travel_buddy_chatbot(self):
        """Test travel buddy chatbot endpoints"""
        print("\n🤖 Testing Travel Buddy Chatbot...")
        
        # Test profile-dayplans chatbot
        try:
            chat_request = {
                "message": "Help me plan a trip to Goa",
                "user_id": self.test_user_id,
                "context_type": "profile_dayplans"
            }
            
            async with self.session.post(f"{BACKEND_URL}/chatbot/profile-dayplans", 
                                       json=chat_request) as response:
                if response.status == 200:
                    chat_response = await response.json()
                    required_fields = ["message", "actions", "context"]
                    if all(field in chat_response for field in required_fields):
                        actions_count = len(chat_response.get("actions", []))
                        self.log_test("Chatbot", "Profile Day Plans Context", "PASS", 
                                    f"Response with {actions_count} suggested actions")
                    else:
                        missing = [f for f in required_fields if f not in chat_response]
                        self.log_test("Chatbot", "Profile Day Plans Context", "FAIL", 
                                    f"Missing fields: {missing}")
                else:
                    self.log_test("Chatbot", "Profile Day Plans Context", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Chatbot", "Profile Day Plans Context", "FAIL", str(e))
        
        # Test start-my-day chatbot
        try:
            chat_request = {
                "message": "I'm at the first location, what's next?",
                "user_id": self.test_user_id,
                "context_type": "start_my_day",
                "itinerary_id": "test-itinerary-123"
            }
            
            async with self.session.post(f"{BACKEND_URL}/chatbot/start-my-day", 
                                       json=chat_request) as response:
                if response.status == 200:
                    chat_response = await response.json()
                    required_fields = ["message", "actions", "context"]
                    if all(field in chat_response for field in required_fields):
                        self.log_test("Chatbot", "Start My Day Context", "PASS", 
                                    "Active day execution chatbot working")
                    else:
                        missing = [f for f in required_fields if f not in chat_response]
                        self.log_test("Chatbot", "Start My Day Context", "FAIL", 
                                    f"Missing fields: {missing}")
                else:
                    self.log_test("Chatbot", "Start My Day Context", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Chatbot", "Start My Day Context", "FAIL", str(e))
        
        # Test general travel chatbot
        try:
            chat_request = {
                "message": "What are the best places to visit in Kerala?",
                "user_id": self.test_user_id,
                "context_type": "general"
            }
            
            async with self.session.post(f"{BACKEND_URL}/chatbot/general", 
                                       json=chat_request) as response:
                if response.status == 200:
                    chat_response = await response.json()
                    required_fields = ["message", "actions", "context"]
                    if all(field in chat_response for field in required_fields):
                        self.log_test("Chatbot", "General Travel Context", "PASS", 
                                    "General travel assistance working")
                    else:
                        missing = [f for f in required_fields if f not in chat_response]
                        self.log_test("Chatbot", "General Travel Context", "FAIL", 
                                    f"Missing fields: {missing}")
                else:
                    self.log_test("Chatbot", "General Travel Context", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Chatbot", "General Travel Context", "FAIL", str(e))
    
    async def test_push_notifications(self):
        """Test push notification system"""
        print("\n📱 Testing Push Notifications...")
        
        # Test send notification
        try:
            notification_request = {
                "user_id": self.test_user_id,
                "title": "Test Notification",
                "body": "This is a test notification from Toria API",
                "data": {"type": "test", "priority": "normal"}
            }
            
            async with self.session.post(f"{BACKEND_URL}/notifications/send", 
                                       json=notification_request) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.log_test("Notifications", "Send Notification", "PASS", 
                                    "Notification sent successfully")
                    else:
                        self.log_test("Notifications", "Send Notification", "FAIL", 
                                    f"Send failed: {result}")
                else:
                    self.log_test("Notifications", "Send Notification", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Notifications", "Send Notification", "FAIL", str(e))
        
        # Test get user notifications
        try:
            async with self.session.get(f"{BACKEND_URL}/notifications/{self.test_user_id}") as response:
                if response.status == 200:
                    notifications = await response.json()
                    if isinstance(notifications, list):
                        self.log_test("Notifications", "Get User Notifications", "PASS", 
                                    f"Retrieved {len(notifications)} notifications")
                    else:
                        self.log_test("Notifications", "Get User Notifications", "FAIL", 
                                    f"Invalid response format: {type(notifications)}")
                else:
                    self.log_test("Notifications", "Get User Notifications", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Notifications", "Get User Notifications", "FAIL", str(e))
        
        # Test location suggestions notification
        try:
            suggestion_request = {
                "user_id": self.test_user_id,
                "location": "Connaught Place, Delhi",
                "suggestions": [
                    {"name": "India Gate", "type": "Place", "distance": "2km"},
                    {"name": "Karim's", "type": "Food", "distance": "1km"}
                ]
            }
            
            async with self.session.post(f"{BACKEND_URL}/notifications/location-suggestions", 
                                       json=suggestion_request) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.log_test("Notifications", "Location Suggestions", "PASS", 
                                    "Location suggestions sent")
                    else:
                        self.log_test("Notifications", "Location Suggestions", "FAIL", 
                                    f"Failed: {result}")
                else:
                    self.log_test("Notifications", "Location Suggestions", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Notifications", "Location Suggestions", "FAIL", str(e))
        
        # Test feedback reminder notification
        try:
            feedback_request = {
                "user_id": self.test_user_id,
                "stop_name": "Red Fort, Delhi"
            }
            
            async with self.session.post(f"{BACKEND_URL}/notifications/feedback-reminder", 
                                       json=feedback_request) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.log_test("Notifications", "Feedback Reminder", "PASS", 
                                    "Feedback reminder sent")
                    else:
                        self.log_test("Notifications", "Feedback Reminder", "FAIL", 
                                    f"Failed: {result}")
                else:
                    self.log_test("Notifications", "Feedback Reminder", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Notifications", "Feedback Reminder", "FAIL", str(e))
    
    async def test_user_management(self):
        """Test user management endpoints"""
        print("\n👤 Testing User Management...")
        
        # Test get user profile
        try:
            async with self.session.get(f"{BACKEND_URL}/users/{self.test_user_id}") as response:
                if response.status == 200:
                    user = await response.json()
                    required_fields = ["user_id", "preferences", "stats"]
                    if all(field in user for field in required_fields):
                        self.log_test("User Management", "Get User Profile", "PASS", 
                                    f"User profile retrieved with preferences and stats")
                    else:
                        missing = [f for f in required_fields if f not in user]
                        self.log_test("User Management", "Get User Profile", "FAIL", 
                                    f"Missing fields: {missing}")
                else:
                    self.log_test("User Management", "Get User Profile", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("User Management", "Get User Profile", "FAIL", str(e))
        
        # Test update user preferences
        try:
            preferences = {
                "language": "EN",
                "notifications": True,
                "privacy": "public",
                "theme": "light"
            }
            
            async with self.session.put(f"{BACKEND_URL}/users/{self.test_user_id}/preferences", 
                                      json=preferences) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.log_test("User Management", "Update User Preferences", "PASS", 
                                    "Preferences updated successfully")
                    else:
                        self.log_test("User Management", "Update User Preferences", "FAIL", 
                                    f"Update failed: {result}")
                else:
                    self.log_test("User Management", "Update User Preferences", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("User Management", "Update User Preferences", "FAIL", str(e))
    
    async def test_analytics_tracking(self):
        """Test analytics and event tracking"""
        print("\n📊 Testing Analytics & Tracking...")
        
        # Test track event
        try:
            event_data = {
                "user_id": self.test_user_id,
                "event_name": "reel_viewed",
                "properties": {
                    "reel_id": "reel_1",
                    "location": "Delhi",
                    "type": "Food",
                    "duration": 15
                }
            }
            
            async with self.session.post(f"{BACKEND_URL}/analytics/track", 
                                       json=event_data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("success") and result.get("event_tracked") == "reel_viewed":
                        self.log_test("Analytics", "Track Event", "PASS", 
                                    f"Event '{result['event_tracked']}' tracked successfully")
                    else:
                        self.log_test("Analytics", "Track Event", "FAIL", 
                                    f"Tracking failed: {result}")
                else:
                    self.log_test("Analytics", "Track Event", "FAIL", 
                                f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Analytics", "Track Event", "FAIL", str(e))
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🎯 TORIA BACKEND TESTING SUMMARY")
        print("="*80)
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result["category"]
            if category not in categories:
                categories[category] = {"PASS": 0, "FAIL": 0, "SKIP": 0}
            categories[category][result["status"]] += 1
        
        total_tests = len(self.test_results)
        total_pass = sum(1 for r in self.test_results if r["status"] == "PASS")
        total_fail = sum(1 for r in self.test_results if r["status"] == "FAIL")
        
        print(f"\n📈 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {total_pass}")
        print(f"   ❌ Failed: {total_fail}")
        print(f"   📊 Success Rate: {(total_pass/total_tests)*100:.1f}%")
        
        print(f"\n📋 RESULTS BY CATEGORY:")
        for category, stats in categories.items():
            total_cat = sum(stats.values())
            pass_rate = (stats["PASS"]/total_cat)*100 if total_cat > 0 else 0
            print(f"   {category}: {stats['PASS']}/{total_cat} passed ({pass_rate:.1f}%)")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if r["status"] == "FAIL"]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   [{test['category']}] {test['test']}: {test['details']}")
        
        print("\n" + "="*80)
        
        return total_pass, total_fail, total_tests

async def main():
    """Run comprehensive backend testing"""
    print("🚀 Starting Comprehensive Toria Backend Testing...")
    print(f"🌐 Testing Backend URL: {BACKEND_URL}")
    
    async with ToriaBackendTester() as tester:
        # Run all test categories
        await tester.test_health_endpoints()
        await tester.test_reel_discovery()
        await tester.test_ai_travel_planning()
        await tester.test_day_plans_management()
        await tester.test_travel_buddy_chatbot()
        await tester.test_push_notifications()
        await tester.test_user_management()
        await tester.test_analytics_tracking()
        
        # Print comprehensive summary
        passed, failed, total = tester.print_summary()
        
        # Return appropriate exit code
        if failed == 0:
            print("🎉 All tests passed! Backend is fully functional.")
            return 0
        else:
            print(f"⚠️  {failed} tests failed. Please review the issues above.")
            return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)