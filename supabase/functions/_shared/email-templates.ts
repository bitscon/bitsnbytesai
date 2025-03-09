
// Email templates for subscription notifications

export interface EmailTemplateData {
  userName?: string;
  subscriptionName?: string;
  renewalDate?: string;
  amount?: string;
  currency?: string;
  portalUrl?: string;
  failureReason?: string;
}

export function getRenewalReminderEmailTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const { userName, subscriptionName, renewalDate, amount, currency, portalUrl } = data;
  
  return {
    subject: `Your ${subscriptionName} subscription renews soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6; margin-bottom: 20px;">Subscription Renewal Reminder</h1>
        <p>Hello ${userName || 'there'},</p>
        <p>This is a friendly reminder that your <strong>${subscriptionName}</strong> subscription will renew automatically on <strong>${renewalDate}</strong>.</p>
        <p>The renewal amount will be <strong>${amount} ${currency}</strong>.</p>
        ${portalUrl ? `
        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Manage Your Subscription
          </a>
        </p>
        ` : ''}
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Thank you for your continued support!</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `
  };
}

export function getPaymentFailureEmailTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const { userName, subscriptionName, failureReason, portalUrl } = data;
  
  return {
    subject: `Action Required: Payment Failed for Your ${subscriptionName} Subscription`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444; margin-bottom: 20px;">Payment Failed</h1>
        <p>Hello ${userName || 'there'},</p>
        <p>We were unable to process your payment for the <strong>${subscriptionName}</strong> subscription.</p>
        ${failureReason ? `<p>Reason: ${failureReason}</p>` : ''}
        <p>To continue enjoying your subscription benefits, please update your payment information as soon as possible.</p>
        ${portalUrl ? `
        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Update Payment Method
          </a>
        </p>
        ` : ''}
        <p>If you have any questions or need assistance, please contact our support team.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `
  };
}
