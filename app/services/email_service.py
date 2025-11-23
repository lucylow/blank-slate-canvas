"""
Email Notification Service
Email race reports, post-race summaries, and alerts via SendGrid API
"""

import os
import logging
import base64
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    logger.warning("sendgrid package not installed. Email notifications disabled.")


class EmailNotificationService:
    """
    Service for sending email notifications including race reports and summaries.
    
    Features:
    - Email API with PDF attachments
    - Template engine for race reports
    - Event webhooks for delivery tracking
    - Analytics dashboard
    """
    
    def __init__(self):
        """Initialize email service with SendGrid API key"""
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL", "pitwall@example.com")
        self.from_name = os.getenv("SENDGRID_FROM_NAME", "Pit Wall AI")
        self.sg = None
        
        if SENDGRID_AVAILABLE and self.api_key:
            try:
                self.sg = SendGridAPIClient(self.api_key)
                logger.info("Email notification service initialized (SendGrid)")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid client: {e}")
                self.sg = None
        else:
            if not SENDGRID_AVAILABLE:
                logger.warning("sendgrid package not installed")
            if not self.api_key:
                logger.warning("SENDGRID_API_KEY not configured - Email notifications disabled")
    
    async def send_race_report(
        self,
        to_email: str,
        pdf_path: str,
        race_name: str,
        track_name: str,
        additional_context: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Send post-race summary PDF report via email
        
        Args:
            to_email: Recipient email address
            pdf_path: Path to PDF file
            race_name: Name of the race
            track_name: Track name
            additional_context: Additional context data (optional)
        
        Returns:
            Dict with status and status_code, or None if failed
        """
        if not self.sg:
            logger.debug("SendGrid not configured - skipping email notification")
            return None
        
        # Check if PDF file exists
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            logger.error(f"PDF file not found: {pdf_path}")
            return None
        
        try:
            # Read PDF file
            with open(pdf_path, 'rb') as f:
                pdf_data = f.read()
            
            encoded_pdf = base64.b64encode(pdf_data).decode()
            
            # Build HTML content
            html_content = self._build_race_report_html(
                race_name,
                track_name,
                additional_context
            )
            
            # Create email
            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject=f"🏁 {race_name} - Post-Race Analysis Report",
                html_content=html_content
            )
            
            # Attach PDF
            attachment = Attachment(
                FileContent(encoded_pdf),
                FileName(f"{race_name.replace(' ', '_')}_Report.pdf"),
                FileType("application/pdf")
            )
            message.attachment = attachment
            
            # Send email
            response = self.sg.send(message)
            
            logger.info(f"Race report email sent to {to_email}: {response.status_code}")
            return {
                "status": "sent",
                "status_code": response.status_code,
                "email": to_email
            }
        except Exception as e:
            logger.error(f"SendGrid error sending race report: {e}")
            return None
    
    async def send_race_summary(
        self,
        to_email: str,
        summary_data: Dict,
        track_name: str
    ) -> Optional[Dict]:
        """
        Send automated race summary email
        
        Args:
            to_email: Recipient email address
            summary_data: Summary data dictionary
            track_name: Track name
        
        Returns:
            Dict with status, or None if failed
        """
        if not self.sg:
            logger.debug("SendGrid not configured - skipping email notification")
            return None
        
        html_content = self._build_race_summary_html(summary_data, track_name)
        
        message = Mail(
            from_email=(self.from_email, self.from_name),
            to_emails=to_email,
            subject=f"🏁 Race Summary: {track_name}",
            html_content=html_content
        )
        
        try:
            response = self.sg.send(message)
            logger.info(f"Race summary email sent to {to_email}: {response.status_code}")
            return {
                "status": "sent",
                "status_code": response.status_code,
                "email": to_email
            }
        except Exception as e:
            logger.error(f"SendGrid error sending race summary: {e}")
            return None
    
    async def send_alert_email(
        self,
        to_email: str,
        alert: Dict,
        alert_type: str = "general"
    ) -> Optional[Dict]:
        """
        Send alert notification via email
        
        Args:
            to_email: Recipient email address
            alert: Alert dictionary
            alert_type: Type of alert ("tire_wear", "strategy", "coaching", "anomaly")
        
        Returns:
            Dict with status, or None if failed
        """
        if not self.sg:
            logger.debug("SendGrid not configured - skipping email notification")
            return None
        
        priority = alert.get("priority", alert.get("severity", "medium"))
        message = alert.get("message", str(alert))
        
        html_content = self._build_alert_html(alert, alert_type, priority)
        
        subject_prefix = {
            "critical": "🚨 CRITICAL",
            "high": "⚠️ HIGH PRIORITY",
            "medium": "📊 MEDIUM",
            "low": "ℹ️ LOW PRIORITY"
        }.get(priority, "📊")
        
        message_obj = Mail(
            from_email=(self.from_email, self.from_name),
            to_emails=to_email,
            subject=f"{subject_prefix} Pit Wall Alert: {alert_type.replace('_', ' ').title()}",
            html_content=html_content
        )
        
        try:
            response = self.sg.send(message_obj)
            logger.info(f"Alert email sent to {to_email}: {response.status_code}")
            return {
                "status": "sent",
                "status_code": response.status_code,
                "email": to_email
            }
        except Exception as e:
            logger.error(f"SendGrid error sending alert email: {e}")
            return None
    
    def _build_race_report_html(
        self,
        race_name: str,
        track_name: str,
        additional_context: Optional[Dict] = None
    ) -> str:
        """Build HTML content for race report email"""
        context_html = ""
        if additional_context:
            context_items = []
            for key, value in additional_context.items():
                if value is not None:
                    context_items.append(f"<li><strong>{key.replace('_', ' ').title()}:</strong> {value}</li>")
            if context_items:
                context_html = f"""
                <h3>Additional Information</h3>
                <ul>
                    {''.join(context_items)}
                </ul>
                """
        
        return f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏁 Race Analysis Report</h1>
                        <h2>{race_name}</h2>
                    </div>
                    <div class="content">
                        <h3>Track: {track_name}</h3>
                        <p>Please find attached the detailed post-race analysis report with telemetry insights, 
                        performance metrics, and strategic recommendations.</p>
                        {context_html}
                        <p>The report includes:</p>
                        <ul>
                            <li>Lap-by-lap telemetry analysis</li>
                            <li>Performance metrics and comparisons</li>
                            <li>Strategic recommendations</li>
                            <li>Tire wear analysis</li>
                            <li>Driver performance insights</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>Generated by Pit Wall AI Analytics System</p>
                        <p>{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                </div>
            </body>
        </html>
        """
    
    def _build_race_summary_html(self, summary_data: Dict, track_name: str) -> str:
        """Build HTML content for race summary email"""
        winner = summary_data.get('winner', 'N/A')
        fastest_lap = summary_data.get('fastest_lap', 'N/A')
        total_laps = summary_data.get('total_laps', 'N/A')
        insights = summary_data.get('insights', 'Analysis complete.')
        
        return f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .metric {{ background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #1a1a1a; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏁 Race Summary</h1>
                        <h2>{track_name}</h2>
                    </div>
                    <div class="content">
                        <h3>Key Metrics</h3>
                        <div class="metric">
                            <strong>Winner:</strong> {winner}
                        </div>
                        <div class="metric">
                            <strong>Fastest Lap:</strong> {fastest_lap}
                        </div>
                        <div class="metric">
                            <strong>Total Laps:</strong> {total_laps}
                        </div>
                        <h3>Top Insights</h3>
                        <p>{insights}</p>
                    </div>
                    <div class="footer">
                        <p>Generated by Pit Wall AI Analytics System</p>
                        <p>{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                </div>
            </body>
        </html>
        """
    
    def _build_alert_html(self, alert: Dict, alert_type: str, priority: str) -> str:
        """Build HTML content for alert email"""
        message = alert.get("message", str(alert))
        timestamp = alert.get("timestamp", datetime.utcnow().isoformat())
        
        priority_colors = {
            "critical": "#dc3545",
            "high": "#fd7e14",
            "medium": "#ffc107",
            "low": "#17a2b8"
        }
        
        color = priority_colors.get(priority, "#6c757d")
        
        return f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: {color}; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .alert-box {{ background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid {color}; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Pit Wall Alert</h1>
                        <h2>{alert_type.replace('_', ' ').title()} - {priority.upper()}</h2>
                    </div>
                    <div class="content">
                        <div class="alert-box">
                            <p><strong>Message:</strong></p>
                            <p>{message}</p>
                        </div>
                        <p><strong>Timestamp:</strong> {timestamp}</p>
                    </div>
                    <div class="footer">
                        <p>Generated by Pit Wall AI Analytics System</p>
                    </div>
                </div>
            </body>
        </html>
        """


# Global instance
email_notification_service = EmailNotificationService()

