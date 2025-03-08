
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CheckoutError {
  message: string;
}

export async function fetchStripePriceId(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-api-settings", {
      method: "GET",
    });

    if (error) {
      console.error("Error fetching API settings:", error);
      throw new Error("Unable to initialize checkout");
    }

    const settings = data.settings || [];
    const priceIdSetting = settings.find((s: any) => s.key_name === "STRIPE_PRICE_ID");
    
    if (priceIdSetting && priceIdSetting.has_value) {
      return priceIdSetting.key_value;
    } else {
      // Fallback to hardcoded price ID
      return "price_1OtQhgFCNu0wSsHhBRs2ZWZy";
    }
  } catch (error) {
    console.error("Error initializing checkout:", error);
    // Fallback to hardcoded price ID
    return "price_1OtQhgFCNu0wSsHhBRs2ZWZy";
  }
}

export function validateEmail(email: string, setEmailError: (error: string) => void): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = re.test(email);
  if (!isValid) {
    setEmailError("Please enter a valid email address");
  } else {
    setEmailError("");
  }
  return isValid;
}

export async function initiateStripeCheckout(
  email: string, 
  stripePriceId: string,
  setIsLoading: (isLoading: boolean) => void,
  setPaymentError: (error: string) => void
): Promise<void> {
  try {
    console.log("Initiating Stripe checkout for email:", email);
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: {
        price_id: stripePriceId === "configured" ? "use_db_value" : stripePriceId,
        email: email,
        success_url: `${window.location.origin}/checkout/success`,
        cancel_url: window.location.origin,
      },
    });

    if (error) {
      console.error("Error invoking create-checkout-session:", error);
      throw new Error(error.message);
    }

    if (!data?.url) {
      console.error("No checkout URL returned:", data);
      throw new Error("Failed to create checkout session");
    }

    // Store the email in session storage for verification
    sessionStorage.setItem("customer_email", email);
    
    // Redirect to Stripe Checkout
    console.log("Redirecting to Stripe checkout URL:", data.url);
    window.location.href = data.url;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    setPaymentError("There was an error starting the checkout process. Please try again.");
    setIsLoading(false);
    toast({
      title: "Checkout error",
      description: "There was an error starting the checkout process. Please try again.",
      variant: "destructive",
    });
  }
}

export async function initiatePayPalCheckout(
  email: string,
  price: number,
  setIsLoading: (isLoading: boolean) => void,
  setPaymentError: (error: string) => void
): Promise<void> {
  try {
    console.log("Initiating PayPal checkout for email:", email);
    // Create a PayPal order
    const { data, error } = await supabase.functions.invoke("paypal-create-order", {
      body: {
        amount: price,
        email: email,
        returnUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: window.location.origin,
      },
    });

    if (error) {
      console.error("Error invoking paypal-create-order:", error);
      throw new Error(error.message || "Failed to create PayPal order");
    }

    if (!data) {
      console.error("No data returned from paypal-create-order");
      throw new Error("No response from payment service");
    }
    
    if (data.error) {
      console.error("Error returned from paypal-create-order:", data.error);
      throw new Error(data.error);
    }

    if (!data.id) {
      console.error("No order ID returned:", data);
      throw new Error("Failed to create PayPal order - no order ID returned");
    }

    // Store the order ID and email in session storage for verification
    sessionStorage.setItem("paypal_order_id", data.id);
    sessionStorage.setItem("customer_email", email);
    
    // Find the approve URL
    const approveUrl = data.links?.find((link: any) => link.rel === "approve")?.href;
    
    if (!approveUrl) {
      console.error("No approve URL found in PayPal response:", data);
      throw new Error("Missing PayPal approval URL");
    }
    
    // Redirect to PayPal
    console.log("Redirecting to PayPal approval URL:", approveUrl);
    window.location.href = approveUrl;
  } catch (error: any) {
    console.error("Error creating PayPal order:", error);
    setPaymentError(`There was an error starting the PayPal checkout process: ${error.message}`);
    toast({
      title: "Checkout error",
      description: `Failed to connect to PayPal: ${error.message}`,
      variant: "destructive",
    });
    setIsLoading(false);
  }
}
