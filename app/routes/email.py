"""
Email API Routes
Endpoints for sending emails via Mailgun
"""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Union
import logging

from app.services.mailgun_service import get_mailgun_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/email", tags=["Email"])


class EmailRequest(BaseModel):
    """Request model for sending emails"""
    to: Union[EmailStr, List[EmailStr]] = Field(..., description="Recipient email address(es)")
    subject: str = Field(..., description="Email subject line")
    text: str = Field(..., description="Plain text email body")
    from_email: Optional[EmailStr] = Field(None, description="Sender email address (defaults to postmaster@domain)")
    from_name: Optional[str] = Field(None, description="Sender name (defaults to 'Mailgun Sandbox')")
    html: Optional[str] = Field(None, description="Optional HTML email body")
    cc: Optional[Union[EmailStr, List[EmailStr]]] = Field(None, description="CC recipient(s)")
    bcc: Optional[Union[EmailStr, List[EmailStr]]] = Field(None, description="BCC recipient(s)")
    reply_to: Optional[EmailStr] = Field(None, description="Reply-to email address")
    tags: Optional[List[str]] = Field(None, description="Tags for email tracking")
    variables: Optional[Dict[str, str]] = Field(None, description="Template variables")


class EmailResponse(BaseModel):
    """Response model for email sending"""
    success: bool
    id: Optional[str] = None
    message: str
    timestamp: str


@router.post("/send", response_model=EmailResponse)
async def send_email(request: EmailRequest):
    """
    Send an email via Mailgun.
    
    Requires Mailgun secrets to be configured in Lovable Cloud:
    - MailGun_Base_URL
    - MailGun_Sandbox_domain
    - MailGun_API_Key
    
    Example request:
    ```json
    {
        "to": "recipient@example.com",
        "subject": "Hello",
        "text": "This is a test email"
    }
    ```
    """
    mailgun_service = get_mailgun_service()
    
    if not mailgun_service:
        raise HTTPException(
            status_code=503,
            detail="Mailgun service is not configured. Please set MailGun_Base_URL, MailGun_Sandbox_domain, and MailGun_API_Key secrets in Lovable Cloud."
        )
    
    try:
        result = await mailgun_service.send_simple_message(
            to=request.to,
            subject=request.subject,
            text=request.text,
            from_email=request.from_email,
            from_name=request.from_name,
            html=request.html,
            cc=request.cc,
            bcc=request.bcc,
            reply_to=request.reply_to,
            tags=request.tags,
            variables=request.variables
        )
        
        return EmailResponse(**result)
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )


@router.get("/health")
async def email_health():
    """
    Check if Mailgun service is configured and available.
    """
    mailgun_service = get_mailgun_service()
    
    if not mailgun_service:
        return {
            "available": False,
            "message": "Mailgun service is not configured. Please set required secrets in Lovable Cloud."
        }
    
    return {
        "available": True,
        "message": "Mailgun service is configured and ready",
        "domain": mailgun_service.domain
    }

