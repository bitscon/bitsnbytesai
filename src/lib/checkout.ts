
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
      console.info("No STRIPE_PRICE_ID setting found, using fallback price ID");
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
    
    if (!stripePriceId) {
      throw new Error("No price ID available. Please refresh the page and try again.");
    }
    
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
      throw new Error(error.message || "Failed to create checkout session");
    }

    if (!data?.url) {
      console.error("No checkout URL returned:", data);
      throw new Error("Payment service unavailable. Please try again later.");
    }

    // Store the email in session storage for verification
    sessionStorage.setItem("customer_email", email);
    
    // Redirect to Stripe Checkout
    console.log("Redirecting to Stripe checkout URL:", data.url);
    window.location.href = data.url;
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    let errorMessage = "There was an error starting the checkout process. Please try again.";
    
    // Provide more specific error messages based on common issues
    if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error. Please check your internet connection and try again.";
    } else if (error.message?.includes("price") || error.message?.includes("Price")) {
      errorMessage = "Product pricing information is unavailable. Please contact support.";
    } else if (error.message?.includes("Invalid email")) {
      errorMessage = "Please provide a valid email address.";
    } else if (error.message) {
      // Use the actual error message if available
      errorMessage = error.message;
    }
    
    setPaymentError(errorMessage);
    setIsLoading(false);
    toast({
      title: "Checkout Error",
      description: errorMessage,
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
    
    if (!price || price <= 0) {
      throw new Error("Invalid price for PayPal checkout");
    }
    
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
    let errorMessage = "There was an error starting the PayPal checkout process.";
    
    // Provide more specific error messages based on common issues
    if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error. Please check your internet connection and try again.";
    } else if (error.message?.includes("amount") || error.message?.includes("price")) {
      errorMessage = "There was an issue with the payment amount. Please contact support.";
    } else if (error.message?.includes("PayPal")) {
      errorMessage = "PayPal service is currently unavailable. Please try another payment method.";
    } else if (error.message) {
      // Use the actual error message if available
      errorMessage = `${errorMessage} ${error.message}`;
    }
    
    setPaymentError(errorMessage);
    toast({
      title: "PayPal Checkout Error",
      description: errorMessage,
      variant: "destructive",
    });
    setIsLoading(false);
  }
}
