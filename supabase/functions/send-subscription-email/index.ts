
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { EmailTemplateData, getRenewalReminderEmailTemplate, getPaymentFailureEmailTemplate } from "../_shared/email-templates.ts";

// Initialize Resend with API key from environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Define the email notification types
type EmailType = "renewal_reminder" | "payment_failure";

// Define the request body interface
interface SendEmailRequest {
  userId: string;
  emailType: EmailType;
  data: EmailTemplateData;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { userId, emailType, data }: SendEmailRequest = await req.json();
    
    if (!userId || !emailType) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Sending ${emailType} email to user ${userId}`);
    
    // Get user email from the database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error("Error retrieving user data:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Set the user name in the template data
    const templateData: EmailTemplateData = {
      ...data,
      userName: userData.full_name || userData.email.split('@')[0]
    };
    
    // Determine which email template to use
    let emailTemplate;
    if (emailType === "renewal_reminder") {
      emailTemplate = getRenewalReminderEmailTemplate(templateData);
    } else if (emailType === "payment_failure") {
      emailTemplate = getPaymentFailureEmailTemplate(templateData);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Subscriptions <subscriptions@resend.dev>",
      to: [userData.email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
    
    console.log("Email sent successfully:", emailResponse);
    
    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
