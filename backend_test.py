#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Toria Travel App
Tests all backend endpoints including AI integration with Gemini 2.5 Flash
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Backend URL from frontend environment
BASE_URL = "https://toria-discover-plan.preview.emergentagent.com/api"

class ToriaBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_user_id = None
        self.test_reel_id = None
        self.test_plan_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log_test(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_health_check(self):
        """Test root API endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_fields = ["message", "status", "features"]
                has_fields = all(field in data for field in expected_fields)
                success = has_fields and data["status"] == "active"
                details = f"Status: {response.status_code}, Response: {data}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Health Check API", success, details)
            return success
            
        except Exception as e:
            self.log_test("Health Check API", False, f"Exception: {str(e)}")
            return False
    
    def test_user_management(self):
        """Test user creation and retrieval"""
        try:
            # Test user creation
            user_data = {
                "display_name": "Arjun Sharma",
                "email": "arjun.sharma@example.com",
                "preferences": {"travel_style": "adventure", "budget": "moderate"}
            }
            
            response = self.session.post(f"{self.base_url}/users", json=user_data)
            create_success = response.status_code == 200
            
            if create_success:
                user = response.json()
                self.test_user_id = user["id"]
                details = f"Created user: {user['display_name']} with ID: {user['id']}"
            else:
                details = f"Create failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("User Creation", create_success, details)
            
            if not create_success:
                return False
                
            # Test user retrieval
            response = self.session.get(f"{self.base_url}/users/{self.test_user_id}")
            retrieve_success = response.status_code == 200
            
            if retrieve_success:
                user = response.json()
                details = f"Retrieved user: {user['display_name']}, Email: {user.get('email', 'N/A')}"
            else:
                details = f"Retrieve failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("User Retrieval", retrieve_success, details)
            return create_success and retrieve_success
            
        except Exception as e:
            self.log_test("User Management", False, f"Exception: {str(e)}")
            return False
    
    def test_instagram_reels(self):
        """Test Instagram reels endpoints"""
        try:
            # Test getting reels
            response = self.session.get(f"{self.base_url}/reels")
            get_success = response.status_code == 200
            
            if get_success:
                reels = response.json()
                details = f"Retrieved {len(reels)} reels"
                if reels:
                    self.test_reel_id = reels[0]["id"]
                    details += f", First reel: {reels[0]['title']} in {reels[0]['location']}"
            else:
                details = f"Get reels failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get Instagram Reels", get_success, details)
            
            # Test creating a new reel
            reel_data = {
                "instagram_url": "https://www.instagram.com/reel/test123/",
                "embed_code": "<blockquote>Test embed code</blockquote>",
                "title": "Amazing Rajasthani Thali",
                "description": "Traditional Rajasthani food experience",
                "location": "Jaipur",
                "type": "Food",
                "creator_handle": "@foodie_rajasthan",
                "tags": ["rajasthani", "thali", "traditional", "jaipur"],
                "metadata": {"price": "₹₹", "hygiene": "Excellent", "timing": "Lunch"}
            }
            
            response = self.session.post(f"{self.base_url}/reels", json=reel_data)
            create_success = response.status_code == 200
            
            if create_success:
                reel = response.json()
                details = f"Created reel: {reel['title']} with ID: {reel['id']}"
                if not self.test_reel_id:  # Use this if no existing reels
                    self.test_reel_id = reel["id"]
            else:
                details = f"Create reel failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Create Instagram Reel", create_success, details)
            
            # Test upvoting a reel
            if self.test_reel_id:
                response = self.session.post(f"{self.base_url}/reels/{self.test_reel_id}/upvote")
                upvote_success = response.status_code == 200
                
                if upvote_success:
                    details = f"Successfully upvoted reel {self.test_reel_id}"
                else:
                    details = f"Upvote failed - Status: {response.status_code}, Error: {response.text}"
                    
                self.log_test("Upvote Reel", upvote_success, details)
            else:
                self.log_test("Upvote Reel", False, "No test reel ID available")
                upvote_success = False
            
            # Test saving a reel
            if self.test_reel_id and self.test_user_id:
                response = self.session.post(f"{self.base_url}/reels/{self.test_reel_id}/save", 
                                           params={"user_id": self.test_user_id})
                save_success = response.status_code == 200
                
                if save_success:
                    details = f"Successfully saved reel {self.test_reel_id} for user {self.test_user_id}"
                else:
                    details = f"Save reel failed - Status: {response.status_code}, Error: {response.text}"
                    
                self.log_test("Save Reel", save_success, details)
            else:
                self.log_test("Save Reel", False, "Missing test reel ID or user ID")
                save_success = False
            
            return get_success and create_success and upvote_success and save_success
            
        except Exception as e:
            self.log_test("Instagram Reels", False, f"Exception: {str(e)}")
            return False
    
    def test_ai_travel_planning(self):
        """Test AI travel planning endpoints with Gemini 2.5 Flash"""
        try:
            # Test plan_my_trip endpoint
            trip_request = {
                "places": ["Goa", "Mumbai"],
                "going_with": "friends",
                "focus": "both",
                "duration": "3 days",
                "date_time": "Weekend",
                "diet": "vegetarian",
                "budget": "moderate",
                "vibe": ["beach", "nightlife", "food"]
            }
            
            print("Testing AI Travel Planning (this may take a few seconds)...")
            response = self.session.post(f"{self.base_url}/plan_my_trip", json=trip_request)
            plan_success = response.status_code == 200
            
            if plan_success:
                plan_data = response.json()
                has_structure = "toria_recommended" in plan_data and "build_your_day" in plan_data
                details = f"AI generated travel plan with structure: {has_structure}"
                if has_structure:
                    toria_rec = plan_data["toria_recommended"]
                    build_day = plan_data["build_your_day"]
                    details += f", Toria recommendations: {len(toria_rec.get('suggestions', []))}, Build your day options available: {bool(build_day.get('guidance'))}"
                plan_success = has_structure
            else:
                details = f"Plan trip failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("AI Travel Planning (plan_my_trip)", plan_success, details)
            
            # Test top_places endpoint
            places_request = {
                "places": ["Delhi", "Agra"],
                "going_with": "family",
                "focus": "attractions",
                "filters": {"budget": "moderate", "time": "weekend"}
            }
            
            response = self.session.post(f"{self.base_url}/top_places", json=places_request)
            places_success = response.status_code == 200
            
            if places_success:
                places_data = response.json()
                has_structure = "food_places" in places_data and "attraction_places" in places_data
                details = f"AI generated top places with structure: {has_structure}"
                if has_structure:
                    food_count = len(places_data.get("food_places", []))
                    attraction_count = len(places_data.get("attraction_places", []))
                    details += f", Food places: {food_count}, Attraction places: {attraction_count}"
                places_success = has_structure
            else:
                details = f"Top places failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("AI Travel Planning (top_places)", places_success, details)
            
            return plan_success and places_success
            
        except Exception as e:
            self.log_test("AI Travel Planning", False, f"Exception: {str(e)}")
            return False
    
    def test_day_plans_management(self):
        """Test day plans CRUD operations"""
        try:
            if not self.test_user_id:
                self.log_test("Day Plans Management", False, "No test user ID available")
                return False
                
            # Test creating a day plan
            plan_data = {
                "user_id": self.test_user_id,
                "title": "Exploring Historic Delhi",
                "city": "Delhi",
                "going_with": "family",
                "focus": "attractions",
                "duration": "Full day",
                "status": "upcoming",
                "stops": [
                    {"name": "Red Fort", "type": "Historical", "time": "10:00 AM", "duration": "2 hours"},
                    {"name": "Chandni Chowk", "type": "Market", "time": "1:00 PM", "duration": "2 hours"},
                    {"name": "India Gate", "type": "Monument", "time": "5:00 PM", "duration": "1 hour"}
                ],
                "generated_by_ai": False
            }
            
            response = self.session.post(f"{self.base_url}/day-plans", json=plan_data)
            create_success = response.status_code == 200
            
            if create_success:
                plan = response.json()
                self.test_plan_id = plan["id"]
                details = f"Created day plan: {plan['title']} with {len(plan['stops'])} stops"
            else:
                details = f"Create plan failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Create Day Plan", create_success, details)
            
            # Test getting user's day plans
            response = self.session.get(f"{self.base_url}/day-plans/{self.test_user_id}")
            get_success = response.status_code == 200
            
            if get_success:
                plans = response.json()
                details = f"Retrieved {len(plans)} day plans for user"
            else:
                details = f"Get plans failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get User Day Plans", get_success, details)
            
            # Test getting plans by status
            response = self.session.get(f"{self.base_url}/day-plans/{self.test_user_id}/upcoming")
            status_success = response.status_code == 200
            
            if status_success:
                plans = response.json()
                details = f"Retrieved {len(plans)} upcoming plans"
            else:
                details = f"Get plans by status failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get Day Plans by Status", status_success, details)
            
            # Test updating plan status
            if self.test_plan_id:
                response = self.session.put(f"{self.base_url}/day-plans/{self.test_plan_id}/status", 
                                          params={"status": "current"})
                update_success = response.status_code == 200
                
                if update_success:
                    details = f"Successfully updated plan status to 'current'"
                else:
                    details = f"Update status failed - Status: {response.status_code}, Error: {response.text}"
                    
                self.log_test("Update Day Plan Status", update_success, details)
            else:
                self.log_test("Update Day Plan Status", False, "No test plan ID available")
                update_success = False
            
            return create_success and get_success and status_success and update_success
            
        except Exception as e:
            self.log_test("Day Plans Management", False, f"Exception: {str(e)}")
            return False
    
    def test_travel_buddy_chatbot(self):
        """Test travel buddy chatbot endpoints"""
        try:
            if not self.test_user_id:
                self.log_test("Travel Buddy Chatbot", False, "No test user ID available")
                return False
                
            # Test chatbot from day plans
            response = self.session.post(f"{self.base_url}/chatbot_from_dayplans", 
                                       params={"user_id": self.test_user_id})
            dayplans_success = response.status_code == 200
            
            if dayplans_success:
                chat_data = response.json()
                has_structure = "message" in chat_data and "context" in chat_data
                details = f"Chatbot responded with structure: {has_structure}"
                if has_structure and chat_data.get("context", {}).get("needs_selection"):
                    details += f", Available itineraries: {len(chat_data.get('itineraries', []))}"
            else:
                details = f"Dayplans chatbot failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Travel Buddy Chatbot (Day Plans)", dayplans_success, details)
            
            # Test chatbot with specific itinerary if we have one
            if dayplans_success and self.test_plan_id:
                response = self.session.post(f"{self.base_url}/chatbot_from_dayplans", 
                                           params={
                                               "user_id": self.test_user_id,
                                               "itinerary_id": self.test_plan_id,
                                               "message": "Tell me about the best time to visit Red Fort"
                                           })
                specific_success = response.status_code == 200
                
                if specific_success:
                    chat_data = response.json()
                    details = f"Chatbot provided specific itinerary guidance"
                else:
                    details = f"Specific chatbot failed - Status: {response.status_code}, Error: {response.text}"
                    
                self.log_test("Travel Buddy Chatbot (Specific Itinerary)", specific_success, details)
            else:
                specific_success = True  # Skip if no plan ID
            
            # Test start my day chatbot
            response = self.session.post(f"{self.base_url}/chatbot_from_startmyday", 
                                       params={
                                           "user_id": self.test_user_id,
                                           "message": "How can you help me today?"
                                       })
            startday_success = response.status_code == 200
            
            if startday_success:
                chat_data = response.json()
                has_structure = "message" in chat_data and "context" in chat_data
                details = f"Start my day chatbot responded with structure: {has_structure}"
                if not has_structure or chat_data.get("context", {}).get("error") == "no_active_plan":
                    details += " (No active plan found - expected behavior)"
            else:
                details = f"Start my day chatbot failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Travel Buddy Chatbot (Start My Day)", startday_success, details)
            
            return dayplans_success and specific_success and startday_success
            
        except Exception as e:
            self.log_test("Travel Buddy Chatbot", False, f"Exception: {str(e)}")
            return False
    
    def test_saved_reels(self):
        """Test saved reels functionality"""
        try:
            if not self.test_user_id:
                self.log_test("Saved Reels", False, "No test user ID available")
                return False
                
            # Test getting saved reels
            response = self.session.get(f"{self.base_url}/saved-reels/{self.test_user_id}")
            success = response.status_code == 200
            
            if success:
                saved_reels = response.json()
                details = f"Retrieved {len(saved_reels)} saved reels for user"
                if saved_reels:
                    details += f", First saved reel: {saved_reels[0].get('title', 'N/A')}"
            else:
                details = f"Get saved reels failed - Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get Saved Reels", success, details)
            return success
            
        except Exception as e:
            self.log_test("Saved Reels", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("TORIA BACKEND API COMPREHENSIVE TESTING")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print()
        
        results = {}
        
        # Test in logical order
        results["health_check"] = self.test_health_check()
        results["user_management"] = self.test_user_management()
        results["instagram_reels"] = self.test_instagram_reels()
        results["ai_travel_planning"] = self.test_ai_travel_planning()
        results["day_plans_management"] = self.test_day_plans_management()
        results["travel_buddy_chatbot"] = self.test_travel_buddy_chatbot()
        results["saved_reels"] = self.test_saved_reels()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print()
        print(f"Overall Result: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Backend is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return results

if __name__ == "__main__":
    tester = ToriaBackendTester()
    results = tester.run_all_tests()