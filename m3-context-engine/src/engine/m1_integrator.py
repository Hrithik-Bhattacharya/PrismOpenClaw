"""
M1 Integrator - REST API and file-based context delivery
Sends context to M1 Pi Engine via REST API with file fallback
"""

import json
import os
import requests
from typing import Dict, Any, Optional


class M1Integrator:
    """Sends context to M1 via REST API with file fallback"""
    
    def __init__(
        self,
        api_url: str = "http://localhost:5000",
        api_token: Optional[str] = None,
        fallback_file_path: str = "../pi-engine/context.json",
        timeout: int = 5
    ):
        """
        Initialize M1 integrator
        
        Args:
            api_url: M1 API base URL
            api_token: Authentication token for M1 API
            fallback_file_path: Path to fallback context file
            timeout: API request timeout in seconds
        """
        self.api_url = api_url.rstrip('/')
        self.api_token = api_token
        self.fallback_file_path = fallback_file_path
        self.timeout = timeout
        
        # Metrics
        self.api_success_count = 0
        self.api_failure_count = 0
        self.file_fallback_count = 0
    
    def send_context(self, context: Dict[str, Any]) -> bool:
        """
        Send context to M1 (API first, file fallback)
        
        Args:
            context: Context dictionary
            
        Returns:
            True if sent successfully (via API or file)
        """
        # Try REST API first
        if self._send_via_api(context):
            self.api_success_count += 1
            return True
        
        # Fallback to file
        self.api_failure_count += 1
        if self._send_via_file(context):
            self.file_fallback_count += 1
            return True
        
        return False
    
    def _send_via_api(self, context: Dict[str, Any]) -> bool:
        """
        Send context via REST API
        
        Args:
            context: Context dictionary
            
        Returns:
            True if successful
        """
        try:
            url = f"{self.api_url}/context"
            headers = {
                "Content-Type": "application/json"
            }
            
            # Add authorization if token provided
            if self.api_token:
                headers["Authorization"] = f"Bearer {self.api_token}"
            
            response = requests.post(
                url,
                json=context,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                print(f"✅ Context sent to M1 API: {url}")
                return True
            else:
                print(f"⚠️  M1 API returned status {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            print(f"⚠️  M1 API timeout after {self.timeout}s")
            return False
        except requests.exceptions.ConnectionError:
            print(f"⚠️  M1 API connection failed")
            return False
        except Exception as e:
            print(f"⚠️  M1 API error: {e}")
            return False
    
    def _send_via_file(self, context: Dict[str, Any]) -> bool:
        """
        Send context via file fallback
        
        Args:
            context: Context dictionary
            
        Returns:
            True if successful
        """
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.fallback_file_path), exist_ok=True)
            
            # Write context to file
            with open(self.fallback_file_path, 'w') as f:
                json.dump(context, f, indent=2)
            
            print(f"📁 Context written to file: {self.fallback_file_path}")
            return True
            
        except IOError as e:
            print(f"❌ File write error: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def get_metrics(self) -> Dict[str, int]:
        """
        Get transmission metrics
        
        Returns:
            Dictionary with success/failure counts
        """
        return {
            "api_success": self.api_success_count,
            "api_failure": self.api_failure_count,
            "file_fallback": self.file_fallback_count,
            "total_attempts": self.api_success_count + self.api_failure_count
        }
