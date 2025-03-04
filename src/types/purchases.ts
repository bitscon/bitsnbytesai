
export interface Purchase {
  id: string;
  user_id: string;
  payment_id: string;
  payment_provider: string;
  amount: number;
  status: string;
  product_id: string;
  created_at: string;
}
