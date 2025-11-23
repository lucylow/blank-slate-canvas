"""
Mailgun API Service
Email sending service using Mailgun API
API credentials must be set as secrets in Lovable Cloud:
- MailGun_Base_URL
- MailGun_Sandbox_domain
- MailGun_API_Key

Features:
- Send simple text emails
- Send HTML emails
- Send emails with attachments
- Support for multiple recipients

API Documentation: https://documentation.mailgun.com/
"""
import httpx
import logging
import os
from typing import Dict, List, Optional, Union
from datetime import datetime

logger = logging.getLogger(__name__)


class MailgunService:
    """
    Service for sending emails via Mailgun API.
    
    IMPORTANT: The following secrets must be set in Lovable Cloud:
    - MailGun_Base_URL: Base URL for Mailgun API (e.g., "https://api.mailgun.net/v3/")
    - MailGun_Sandbox_domain: Your Mailgun sandbox domain
    - MailGun_API_Key: Your Mailgun API key
    
    Usage:
        service = MailgunService()
        result = await service.send_simple_message(
            to="recipient@example.com",
            subject="Hello",
            text="Email body"
        )
    """
    
    TIMEOUT = 15.0  # 15 second timeout for API calls
    
    def __init__(
        self, 
        base_url: Optional[str] = None,
        domain: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        """
        Initialize Mailgun service.
        
        Args:
            base_url: Optional base URL. If not provided, will use MailGun_Base_URL 
                    from environment (Lovable Cloud secret).
            domain: Optional domain. If not provided, will use MailGun_Sandbox_domain 
                   from environment (Lovable Cloud secret).
            api_key: Optional API key. If not provided, will use MailGun_API_Key 
                    from environment (Lovable Cloud secret).
        
        Raises:
            ValueError: If required credentials are not found in environment or provided.
        """
        # IMPORTANT: Use secrets from Lovable Cloud
        # These are the environment variable names that Lovable uses for secrets
        self.base_url = base_url or os.getenv("MailGun_Base_URL")
        self.domain = domain or os.getenv("MailGun_Sandbox_domain")
        self.api_key = api_key or os.getenv("MailGun_API_Key")
        
        if not self.base_url:
            raise ValueError(
                "Mailgun base URL not found. "
                "Please set 'MailGun_Base_URL' as a secret in Lovable Cloud, "
                "or provide it as an argument. "
                "Example: 'https://api.mailgun.net/v3/'"
            )
        
        if not self.domain:
            raise ValueError(
                "Mailgun domain not found. "
                "Please set 'MailGun_Sandbox_domain' as a secret in Lovable Cloud, "
                "or provide it as an argument."
            )
        
        if not self.api_key:
            raise ValueError(
                "Mailgun API key not found. "
                "Please set 'MailGun_API_Key' as a secret in Lovable Cloud, "
                "or provide it as an argument. "
                "Get your API key from: https://app.mailgun.com/app/account/security/api_keys"
            )
        
        # Ensure base_url ends with /
        if not self.base_url.endswith("/"):
            self.base_url += "/"
        
        # Construct the full API endpoint URL
        self.api_url = f"{self.base_url}{self.domain}/messages"
        
        logger.info("Mailgun service initialized (API credentials configured)")
    
    async def send_simple_message(
        self,
        to: Union[str, List[str]],
        subject: str,
        text: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        html: Optional[str] = None,
        cc: Optional[Union[str, List[str]]] = None,
        bcc: Optional[Union[str, List[str]]] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[str]] = None,
        variables: Optional[Dict[str, str]] = None
    ) -> Dict:
        """
        Send a simple email message via Mailgun.
        
        Args:
            to: Recipient email address(es) - string or list of strings
            subject: Email subject line
            text: Plain text email body
            from_email: Sender email address (defaults to postmaster@domain)
            from_name: Sender name (defaults to "Mailgun Sandbox")
            html: Optional HTML email body
            cc: CC recipient(s) - string or list of strings
            bcc: BCC recipient(s) - string or list of strings
            reply_to: Reply-to email address
            tags: List of tags for email tracking
            variables: Dictionary of template variables
        
        Returns:
            Dictionary with response data including:
            - id: Message ID
            - message: Success message
            - timestamp: ISO timestamp
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            # Default from address
            if not from_email:
                from_email = f"postmaster@{self.domain}"
            
            if from_name:
                from_addr = f"{from_name} <{from_email}>"
            else:
                from_addr = f"Mailgun Sandbox <{from_email}>"
            
            # Prepare form data
            data = {
                "from": from_addr,
                "to": to if isinstance(to, str) else ", ".join(to),
                "subject": subject,
                "text": text
            }
            
            # Add optional fields
            if html:
                data["html"] = html
            
            if cc:
                data["cc"] = cc if isinstance(cc, str) else ", ".join(cc)
            
            if bcc:
                data["bcc"] = bcc if isinstance(bcc, str) else ", ".join(bcc)
            
            if reply_to:
                data["h:Reply-To"] = reply_to
            
            if tags:
                for tag in tags:
                    data[f"o:tag"] = tag
            
            if variables:
                for key, value in variables.items():
                    data[f"v:{key}"] = value
            
            # Send request
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    self.api_url,
                    auth=("api", self.api_key),
                    data=data
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"Email sent successfully: {result.get('id', 'unknown')}")
                return {
                    "success": True,
                    "id": result.get("id"),
                    "message": result.get("message", "Email sent successfully"),
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Mailgun API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', e.response.text)}"
            except:
                error_msg += f" - {e.response.text}"
            
            logger.error(error_msg)
            raise
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            raise
    
    async def send_message_with_attachments(
        self,
        to: Union[str, List[str]],
        subject: str,
        text: str,
        files: Optional[List[Dict[str, Union[str, bytes]]]] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        html: Optional[str] = None
    ) -> Dict:
        """
        Send an email with file attachments.
        
        Args:
            to: Recipient email address(es) - string or list of strings
            subject: Email subject line
            text: Plain text email body
            files: List of file dictionaries with 'filename' and 'content' keys
                   Example: [{"filename": "report.pdf", "content": b"..."}]
            from_email: Sender email address (defaults to postmaster@domain)
            from_name: Sender name (defaults to "Mailgun Sandbox")
            html: Optional HTML email body
        
        Returns:
            Dictionary with response data
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            # Default from address
            if not from_email:
                from_email = f"postmaster@{self.domain}"
            
            if from_name:
                from_addr = f"{from_name} <{from_email}>"
            else:
                from_addr = f"Mailgun Sandbox <{from_email}>"
            
            # Prepare form data
            data = {
                "from": from_addr,
                "to": to if isinstance(to, str) else ", ".join(to),
                "subject": subject,
                "text": text
            }
            
            if html:
                data["html"] = html
            
            # Prepare files for multipart upload
            files_data = None
            if files:
                files_data = []
                for file_info in files:
                    files_data.append(
                        ("attachment", (file_info["filename"], file_info["content"]))
                    )
            
            # Send request
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    self.api_url,
                    auth=("api", self.api_key),
                    data=data,
                    files=files_data
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"Email with attachments sent successfully: {result.get('id', 'unknown')}")
                return {
                    "success": True,
                    "id": result.get("id"),
                    "message": result.get("message", "Email sent successfully"),
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Mailgun API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', e.response.text)}"
            except:
                error_msg += f" - {e.response.text}"
            
            logger.error(error_msg)
            raise
        except Exception as e:
            logger.error(f"Error sending email with attachments: {e}")
            raise


# Global instance (lazy initialization to avoid API key errors at import time)
_mailgun_service: Optional[MailgunService] = None


def get_mailgun_service() -> Optional[MailgunService]:
    """
    Get global Mailgun service instance.
    Returns None if API credentials are not configured.
    """
    global _mailgun_service
    
    if _mailgun_service is None:
        try:
            _mailgun_service = MailgunService()
        except ValueError as e:
            logger.warning(f"Mailgun service not available: {e}")
            return None
    
    return _mailgun_service

