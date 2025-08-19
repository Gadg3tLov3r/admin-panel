export interface Payment {
  id: number;
  cmpss_payment_id: string;
  merchant_payment_id: string;
  third_party_provider_id: string | null;
  third_party_status: string | null;
  order_amount: string;
  arrived_order_amount: string | null;
  merchant_fee: string;
  provider_commission: string;
  cmpss_commission: string;
  payment_url: string;
  success_url: string | null;
  failed_url: string | null;
  ipn_url: string;
  order_status: string;
  retry_callback_count: number;
  retry_verify_count: number;
  order_metadata: Record<string, any>;
  payment_method_name: string;
  currency_name: string;
  currency_code: string;
  merchant_name: string;
  merchant_id: number;
  provider_name: string;
  provider_method_name: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  provider?: string;
  merchant_id?: number;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
} 