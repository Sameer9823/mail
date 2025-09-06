import { logger } from "../utils/logger.js"

class EmailTemplates {
  constructor() {
    this.templates = {
      acknowledgment: this.getAcknowledmentTemplate(),
      resolution: this.getResolutionTemplate(),
      followUp: this.getFollowUpTemplate(),
      escalation: this.getEscalationTemplate(),
      survey: this.getSurveyTemplate(),
    }
  }

  generateEmail(templateType, data) {
    try {
      const template = this.templates[templateType]
      if (!template) {
        throw new Error(`Template '${templateType}' not found`)
      }

      const subject = this.replaceVariables(template.subject, data)
      const html = this.replaceVariables(template.html, data)
      const text = this.replaceVariables(template.text, data)

      return { subject, html, text }
    } catch (error) {
      logger.error("❌ Failed to generate email template:", error.message)
      throw error
    }
  }

  replaceVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }

  getAcknowledmentTemplate() {
    return {
      subject: "We received your message - Ticket #{{ticketId}}",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Contacting Us</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear {{customerName}},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              We have successfully received your message regarding "<strong>{{subject}}</strong>" and have assigned it ticket number <strong>#{{ticketId}}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">What happens next?</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>Our AI system has analyzed your message and categorized it as: <strong>{{category}}</strong></li>
                <li>Priority level: <strong>{{priority}}</strong></li>
                <li>Expected response time: <strong>{{expectedResponseTime}}</strong></li>
                <li>A specialist will review your case and respond shortly</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you have any additional information or urgent concerns, please reply to this email with your ticket number.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{trackingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Ticket</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Best regards,<br>
              AI Communication Assistant Team<br>
              <a href="mailto:{{supportEmail}}" style="color: #667eea;">{{supportEmail}}</a>
            </p>
          </div>
        </div>
      `,
      text: `
Dear {{customerName}},

We have received your message regarding "{{subject}}" and assigned it ticket #{{ticketId}}.

Details:
- Category: {{category}}
- Priority: {{priority}}
- Expected response time: {{expectedResponseTime}}

A specialist will review your case and respond shortly. If you have additional information, please reply with your ticket number.

Track your ticket: {{trackingUrl}}

Best regards,
AI Communication Assistant Team
{{supportEmail}}
      `,
    }
  }

  getResolutionTemplate() {
    return {
      subject: "Your issue has been resolved - Ticket #{{ticketId}}",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Issue Resolved</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear {{customerName}},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Great news! We have successfully resolved your support ticket <strong>#{{ticketId}}</strong> regarding "{{subject}}".
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <h3 style="color: #333; margin-top: 0;">Resolution Summary</h3>
              <p style="color: #666; line-height: 1.6;">{{resolutionSummary}}</p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you have any questions about this resolution or need further assistance, please don't hesitate to contact us.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{feedbackUrl}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Rate Our Service</a>
              <a href="{{supportUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Support</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Thank you for choosing our service!<br>
              AI Communication Assistant Team
            </p>
          </div>
        </div>
      `,
      text: `
Dear {{customerName}},

Your support ticket #{{ticketId}} regarding "{{subject}}" has been resolved.

Resolution Summary:
{{resolutionSummary}}

If you need further assistance, please contact us.

Rate our service: {{feedbackUrl}}
Contact support: {{supportUrl}}

Thank you for choosing our service!
AI Communication Assistant Team
      `,
    }
  }

  getFollowUpTemplate() {
    return {
      subject: "Following up on your ticket #{{ticketId}}",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Following Up</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear {{customerName}},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              We wanted to follow up on your recent support ticket <strong>#{{ticketId}}</strong> to ensure everything is working well for you.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
              <h3 style="color: #333; margin-top: 0;">How are things going?</h3>
              <p style="color: #666; line-height: 1.6;">
                It's been {{daysSinceResolution}} days since we resolved your issue. We'd love to hear if our solution is still working for you.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{feedbackUrl}}" style="background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Share Feedback</a>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Your feedback helps us improve our service.<br>
              AI Communication Assistant Team
            </p>
          </div>
        </div>
      `,
      text: `
Dear {{customerName}},

Following up on ticket #{{ticketId}} - it's been {{daysSinceResolution}} days since resolution.

How are things going? We'd love to hear if our solution is still working for you.

Share feedback: {{feedbackUrl}}

Your feedback helps us improve our service.
AI Communication Assistant Team
      `,
    }
  }

  getEscalationTemplate() {
    return {
      subject: "Your ticket has been escalated - #{{ticketId}}",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚡ Priority Escalation</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear {{customerName}},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Your support ticket <strong>#{{ticketId}}</strong> has been escalated to our senior support team for priority handling.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
              <h3 style="color: #333; margin-top: 0;">What this means:</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>A senior specialist is now assigned to your case</li>
                <li>You'll receive priority attention and faster response times</li>
                <li>We'll provide regular updates on progress</li>
                <li>Direct contact: {{escalationContact}}</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              We apologize for any inconvenience and appreciate your patience as we work to resolve this matter quickly.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{directContactUrl}}" style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Senior Support</a>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Priority Support Team<br>
              AI Communication Assistant
            </p>
          </div>
        </div>
      `,
      text: `
Dear {{customerName}},

Your ticket #{{ticketId}} has been escalated to our senior support team.

What this means:
- Senior specialist assigned
- Priority attention and faster responses
- Regular progress updates
- Direct contact: {{escalationContact}}

We apologize for any inconvenience and will resolve this quickly.

Contact senior support: {{directContactUrl}}

Priority Support Team
AI Communication Assistant
      `,
    }
  }

  getSurveyTemplate() {
    return {
      subject: "How did we do? - Feedback for ticket #{{ticketId}}",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #9C27B0 0%, #673AB7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📝 Your Feedback Matters</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear {{customerName}},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              We hope your recent experience with ticket <strong>#{{ticketId}}</strong> met your expectations. Your feedback helps us improve our service.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #333; margin-top: 0;">Rate your experience</h3>
              <div style="margin: 20px 0;">
                <a href="{{surveyUrl}}&rating=5" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 50%; margin: 0 5px; display: inline-block;">😊</a>
                <a href="{{surveyUrl}}&rating=4" style="background: #8BC34A; color: white; padding: 10px 15px; text-decoration: none; border-radius: 50%; margin: 0 5px; display: inline-block;">🙂</a>
                <a href="{{surveyUrl}}&rating=3" style="background: #FF9800; color: white; padding: 10px 15px; text-decoration: none; border-radius: 50%; margin: 0 5px; display: inline-block;">😐</a>
                <a href="{{surveyUrl}}&rating=2" style="background: #FF5722; color: white; padding: 10px 15px; text-decoration: none; border-radius: 50%; margin: 0 5px; display: inline-block;">🙁</a>
                <a href="{{surveyUrl}}&rating=1" style="background: #f44336; color: white; padding: 10px 15px; text-decoration: none; border-radius: 50%; margin: 0 5px; display: inline-block;">😞</a>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{detailedSurveyUrl}}" style="background: #9C27B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Take Detailed Survey</a>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Thank you for helping us improve!<br>
              AI Communication Assistant Team
            </p>
          </div>
        </div>
      `,
      text: `
Dear {{customerName}},

How was your experience with ticket #{{ticketId}}?

Rate your experience: {{surveyUrl}}
Take detailed survey: {{detailedSurveyUrl}}

Your feedback helps us improve our service.

Thank you!
AI Communication Assistant Team
      `,
    }
  }
}

export default new EmailTemplates()
