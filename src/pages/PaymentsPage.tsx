import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Payment, PaymentsResponse } from "@/types/payment";
import api from "@/lib/auth";
import { DatePicker } from "@/components/DatePicker";
import { Combobox } from "@/components/ui/combobox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Helper function to get today's date at 00:00 UTC
const getTodayUTC = () => {
  const today = new Date();
  const utcToday = new Date(
    today.getTime() + today.getTimezoneOffset() * 60000
  );
  utcToday.setUTCHours(0, 0, 0, 0);
  return utcToday;
};

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  // Current filter values (what user sees in UI)
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodIdFilter, setPaymentMethodIdFilter] = useState("");
  const [currencyIdFilter, setCurrencyIdFilter] = useState("2");
  const [merchantIdFilter, setMerchantIdFilter] = useState("");
  const [providerIdFilter, setProviderIdFilter] = useState("");
  const [merchantPaymentIdFilter, setMerchantPaymentIdFilter] = useState("");
  const [cmpssPaymentIdFilter, setCmpssPaymentIdFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(() =>
    getTodayUTC()
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );

  // Applied filter values (what actually filters the data)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("");
  const [appliedPaymentMethodIdFilter, setAppliedPaymentMethodIdFilter] =
    useState("");
  const [appliedCurrencyIdFilter, setAppliedCurrencyIdFilter] = useState("2");
  const [appliedMerchantIdFilter, setAppliedMerchantIdFilter] = useState("");
  const [appliedProviderIdFilter, setAppliedProviderIdFilter] = useState("");
  const [appliedMerchantPaymentIdFilter, setAppliedMerchantPaymentIdFilter] =
    useState("");
  const [appliedCmpssPaymentIdFilter, setAppliedCmpssPaymentIdFilter] =
    useState("");
  const [appliedStartDateFilter, setAppliedStartDateFilter] = useState<
    Date | undefined
  >(() => getTodayUTC());
  const [appliedEndDateFilter, setAppliedEndDateFilter] = useState<
    Date | undefined
  >(undefined);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<
    Array<{ id: number; name: string; sign: string; country: string }>
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ id: number; name: string; payment_method_id: number }>
  >([]);
  const [merchants, setMerchants] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [providers, setProviders] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [stats, setStats] = useState({
    total_amount: "0",
    total_provider_fee: "0",
    total_merchant_fee: "0",
    total_success: [0, "0"] as [number, string],
    total_failed: [0, "0"] as [number, string],
    total_pending: [0, "0"] as [number, string],
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch currencies data
  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await api.get("/currencies");
      setCurrencies(response.data.currencies || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  }, []);

  // Fetch payment methods data
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await api.get("/methods");
      // Extract payment methods from merchant_methods and get unique payment methods
      const merchantMethods = response.data.merchant_methods || [];
      const uniqueMethods = merchantMethods.reduce(
        (acc: any[], method: any) => {
          const existingMethod = acc.find(
            (m) => m.payment_method_id === method.payment_method_id
          );
          if (!existingMethod) {
            acc.push({
              id: method.payment_method_id,
              name: method.payment_method.name,
              payment_method_id: method.payment_method_id,
            });
          }
          return acc;
        },
        []
      );
      setPaymentMethods(uniqueMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  }, []);

  // Fetch merchants data
  const fetchMerchants = useCallback(async () => {
    try {
      const response = await api.get("/merchants");
      setMerchants(response.data.merchants || response.data || []);
    } catch (error) {
      console.error("Error fetching merchants:", error);
    }
  }, []);

  // Fetch providers data
  const fetchProviders = useCallback(async () => {
    try {
      const response = await api.get("/providers");
      setProviders(response.data.providers || response.data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  }, []);

  // Fetch payments data
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        ...(appliedStatusFilter && { order_status: appliedStatusFilter }),
        ...(appliedPaymentMethodIdFilter && {
          payment_method_id: parseInt(appliedPaymentMethodIdFilter),
        }),
        ...(appliedCurrencyIdFilter && {
          currency_id: parseInt(appliedCurrencyIdFilter),
        }),
        ...(appliedMerchantIdFilter && {
          merchant_id: parseInt(appliedMerchantIdFilter),
        }),
        ...(appliedProviderIdFilter && {
          provider_id: parseInt(appliedProviderIdFilter),
        }),
        ...(appliedMerchantPaymentIdFilter && {
          merchant_payment_id: appliedMerchantPaymentIdFilter,
        }),
        ...(appliedCmpssPaymentIdFilter && {
          cmpss_payment_id: appliedCmpssPaymentIdFilter,
        }),
        ...(appliedStartDateFilter && {
          start_date:
            appliedStartDateFilter.getUTCFullYear() +
            "-" +
            String(appliedStartDateFilter.getUTCMonth() + 1).padStart(2, "0") +
            "-" +
            String(appliedStartDateFilter.getUTCDate()).padStart(2, "0") +
            "T" +
            String(appliedStartDateFilter.getUTCHours()).padStart(2, "0") +
            ":" +
            String(appliedStartDateFilter.getUTCMinutes()).padStart(2, "0"),
        }),
        ...(appliedEndDateFilter && {
          end_date:
            appliedEndDateFilter.getUTCFullYear() +
            "-" +
            String(appliedEndDateFilter.getUTCMonth() + 1).padStart(2, "0") +
            "-" +
            String(appliedEndDateFilter.getUTCDate()).padStart(2, "0") +
            "T" +
            String(appliedEndDateFilter.getUTCHours()).padStart(2, "0") +
            ":" +
            String(appliedEndDateFilter.getUTCMinutes()).padStart(2, "0"),
        }),
      };

      const response = await api.get<PaymentsResponse>("/payments", { params });
      const data = response.data;
      setPayments(data.payments);
      setTotalPages(data.total_pages);
      setTotal(data.total);

      // Extract stats from the API response
      setStats({
        total_amount: data.total_amount || "0",
        total_provider_fee: data.total_provider_fee || "0",
        total_merchant_fee: data.total_merchant_fee || "0",
        total_success: data.total_success || [0, "0"],
        total_failed: data.total_failed || [0, "0"],
        total_pending: data.total_pending || [0, "0"],
      });

      setPermissionError(null); // Clear any previous permission errors
    } catch (error: any) {
      console.error("Error fetching payments:", error);

      // Handle permission errors specifically
      if (error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail;
        if (errorDetail && errorDetail.includes("Missing admin permission")) {
          // Extract the permission name from the error
          const permissionMatch = errorDetail.match(
            /Missing admin permission: (.+)/
          );
          const permission = permissionMatch ? permissionMatch[1] : "unknown";

          setPermissionError(
            `You don't have permission to view payments (${permission})`
          );
          toast.error(
            `Access denied: You don't have permission to view payments (${permission})`
          );
        } else {
          setPermissionError("Insufficient permissions to view payments");
          toast.error(
            "Access denied: Insufficient permissions to view payments"
          );
        }
      } else {
        setPermissionError(null);
        toast.error("Failed to load payments. Please try again.");
      }

      // Set empty state on error
      setPayments([]);
      setTotalPages(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [
    currentPage,
    perPage,
    appliedStatusFilter,
    appliedPaymentMethodIdFilter,
    appliedCurrencyIdFilter,
    appliedMerchantIdFilter,
    appliedProviderIdFilter,
    appliedMerchantPaymentIdFilter,
    appliedCmpssPaymentIdFilter,
    appliedStartDateFilter,
    appliedEndDateFilter,
  ]);

  useEffect(() => {
    fetchCurrencies();
    fetchPaymentMethods();
    fetchMerchants();
    fetchProviders();
  }, [fetchCurrencies, fetchPaymentMethods, fetchMerchants, fetchProviders]);

  // Handle filters - only update current values, don't apply yet
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePaymentMethodIdFilter = (value: string) => {
    setPaymentMethodIdFilter(value === "all" ? "" : value);
  };

  const handleCurrencyIdFilter = (value: string) => {
    setCurrencyIdFilter(value);
  };

  const handleMerchantIdFilter = (value: string) => {
    setMerchantIdFilter(value === "all" ? "" : value);
  };

  const handleProviderIdFilter = (value: string) => {
    setProviderIdFilter(value === "all" ? "" : value);
  };

  const handleMerchantPaymentIdFilter = (value: string) => {
    setMerchantPaymentIdFilter(value);
  };

  const handleCmpssPaymentIdFilter = (value: string) => {
    setCmpssPaymentIdFilter(value);
  };

  const handleStartDateFilter = (value: Date | undefined) => {
    if (value) {
      // Set to start of day
      const startOfDay = new Date(value);
      startOfDay.setHours(0, 0, 0, 0);
      setStartDateFilter(startOfDay);
    } else {
      setStartDateFilter(undefined);
    }
  };

  const handleEndDateFilter = (value: Date | undefined) => {
    if (value) {
      // Set to end of day
      const endOfDay = new Date(value);
      endOfDay.setHours(23, 59, 59, 999);
      setEndDateFilter(endOfDay);
    } else {
      setEndDateFilter(undefined);
    }
  };

  // Apply current filter values to the applied filters
  const applyFilters = () => {
    console.log("Applying filters:", {
      currentPage,
      statusFilter,
      paymentMethodIdFilter,
      currencyIdFilter,
      merchantIdFilter,
      providerIdFilter,
      merchantPaymentIdFilter,
      cmpssPaymentIdFilter,
      startDateFilter,
      endDateFilter,
    });

    // Apply all filters
    setAppliedStatusFilter(statusFilter);
    setAppliedPaymentMethodIdFilter(paymentMethodIdFilter);
    setAppliedCurrencyIdFilter(currencyIdFilter);
    setAppliedMerchantIdFilter(merchantIdFilter);
    setAppliedProviderIdFilter(providerIdFilter);
    setAppliedMerchantPaymentIdFilter(merchantPaymentIdFilter);
    setAppliedCmpssPaymentIdFilter(cmpssPaymentIdFilter);
    setAppliedStartDateFilter(startDateFilter);
    setAppliedEndDateFilter(endDateFilter);

    // Reset page to 1 when applying filters
    setCurrentPage(1);
  };

  const clearFilters = () => {
    // Clear current filter values
    setStatusFilter("");
    setPaymentMethodIdFilter("");
    setCurrencyIdFilter("2"); // Reset to default currency
    setMerchantIdFilter("");
    setProviderIdFilter("");
    setMerchantPaymentIdFilter("");
    setCmpssPaymentIdFilter("");
    // Reset to today's start date and clear end date
    const utcToday = getTodayUTC();
    setStartDateFilter(utcToday);
    setEndDateFilter(undefined);

    // Clear applied filter values
    setAppliedStatusFilter("");
    setAppliedPaymentMethodIdFilter("");
    setAppliedCurrencyIdFilter("2");
    setAppliedMerchantIdFilter("");
    setAppliedProviderIdFilter("");
    setAppliedMerchantPaymentIdFilter("");
    setAppliedCmpssPaymentIdFilter("");
    setAppliedStartDateFilter(utcToday);
    setAppliedEndDateFilter(undefined);

    setCurrentPage(1);
    setPermissionError(null); // Clear permission errors when filters are cleared
  };

  const handleRefresh = () => {
    const confirmed = window.confirm(
      "Are you sure you want to refresh the payments data? This will reload all current data."
    );
    if (!confirmed) return;

    fetchPayments();
    toast.success("Payments refreshed");
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleViewDetails = (payment: Payment) => {
    window.open(`/payments/${payment.id}`, "_blank");
  };

  const handleExport = () => {
    const confirmed = window.confirm(
      `Are you sure you want to export ${payments.length} payment records?`
    );
    if (!confirmed) return;

    // Create CSV data
    const headers = [
      "Payment ID",
      "Merchant Payment ID",
      "Amount",
      "Status",
      "Payment Method",
      "Provider",
      "Merchant",
      "Created At",
    ];

    const csvData = payments.map((payment) => [
      payment.cmpss_payment_id,
      payment.merchant_payment_id,
      payment.order_amount,
      payment.order_status,
      payment.payment_method_name,
      payment.provider_name,
      payment.merchant_name,
      new Date(payment.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Payments exported successfully");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  return (
    <AuthenticatedLayout
      title="Payments"
      subtitle="Manage and monitor payment transactions"
    >
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        {/* Total Amount */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    stats.total_amount,
                    payments[0]?.currency_code || "USD"
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">₨</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Successful */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Successful
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    stats.total_success[1],
                    payments[0]?.currency_code || "USD"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_success[0]} payments
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Provider Fees */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Provider Fees
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    stats.total_provider_fee,
                    payments[0]?.currency_code || "USD"
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">🏦</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Merchant Fees */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Merchant Fees
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    stats.total_merchant_fee,
                    payments[0]?.currency_code || "USD"
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">💸</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    stats.total_failed[1],
                    payments[0]?.currency_code || "USD"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_failed[0]} payments
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">✗</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(
                    stats.total_pending[1],
                    payments[0]?.currency_code || "USD"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_pending[0]} payments
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center gap-2 flex-1">
                  {/* Active Filters in Header */}
                  {(appliedStatusFilter ||
                    appliedPaymentMethodIdFilter ||
                    appliedCurrencyIdFilter ||
                    appliedMerchantIdFilter ||
                    appliedProviderIdFilter ||
                    appliedMerchantPaymentIdFilter ||
                    appliedCmpssPaymentIdFilter ||
                    appliedStartDateFilter ||
                    appliedEndDateFilter) && (
                    <div className="flex items-center gap-2 flex-wrap ml-4">
                      {appliedStatusFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {appliedStatusFilter}
                        </Badge>
                      )}
                      {appliedPaymentMethodIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Method:{" "}
                          {paymentMethods.find(
                            (m) =>
                              m.payment_method_id.toString() ===
                              appliedPaymentMethodIdFilter
                          )?.name || appliedPaymentMethodIdFilter}
                        </Badge>
                      )}
                      {appliedCurrencyIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Currency:{" "}
                          {currencies.find(
                            (c) => c.id.toString() === appliedCurrencyIdFilter
                          )?.name || appliedCurrencyIdFilter}
                        </Badge>
                      )}
                      {appliedMerchantIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Merchant:{" "}
                          {merchants.find(
                            (m) => m.id.toString() === appliedMerchantIdFilter
                          )?.name || appliedMerchantIdFilter}
                        </Badge>
                      )}
                      {appliedProviderIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Provider:{" "}
                          {providers.find(
                            (p) => p.id.toString() === appliedProviderIdFilter
                          )?.name || appliedProviderIdFilter}
                        </Badge>
                      )}
                      {appliedMerchantPaymentIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Merchant ID: {appliedMerchantPaymentIdFilter}
                        </Badge>
                      )}
                      {appliedCmpssPaymentIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          CMPSS ID: {appliedCmpssPaymentIdFilter}
                        </Badge>
                      )}
                      {appliedStartDateFilter && (
                        <Badge variant="secondary" className="text-xs">
                          From: {appliedStartDateFilter.toLocaleDateString()}
                        </Badge>
                      )}
                      {appliedEndDateFilter && (
                        <Badge variant="secondary" className="text-xs">
                          To: {appliedEndDateFilter.toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {isFiltersOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {/* Payment IDs and Date Range Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      CMPSS Payment ID
                    </label>
                    <Input
                      placeholder="Enter CMPSS payment ID..."
                      className="w-full"
                      value={cmpssPaymentIdFilter}
                      onChange={(e) =>
                        handleCmpssPaymentIdFilter(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Merchant Payment ID
                    </label>
                    <Input
                      placeholder="Enter merchant payment ID..."
                      className="w-full"
                      value={merchantPaymentIdFilter}
                      onChange={(e) =>
                        handleMerchantPaymentIdFilter(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Start Date
                    </label>
                    <DatePicker
                      selected={startDateFilter}
                      onSelect={handleStartDateFilter}
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      End Date
                    </label>
                    <DatePicker
                      selected={endDateFilter}
                      onSelect={handleEndDateFilter}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <Select
                      value={statusFilter || "all"}
                      onValueChange={handleStatusFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Payment Method
                    </label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Methods" },
                        ...paymentMethods.map((method) => ({
                          value: method.payment_method_id.toString(),
                          label: method.name,
                        })),
                      ]}
                      value={paymentMethodIdFilter || "all"}
                      onValueChange={handlePaymentMethodIdFilter}
                      placeholder="Select payment method"
                      searchPlaceholder="Search payment methods..."
                      emptyText="No payment methods found."
                      all={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Currency
                    </label>
                    <Select
                      value={currencyIdFilter || "2"}
                      onValueChange={handleCurrencyIdFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id.toString()}
                          >
                            {currency.name} ({currency.sign})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Merchant
                    </label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Merchants" },
                        ...merchants.map((merchant) => ({
                          value: merchant.id.toString(),
                          label: merchant.name,
                        })),
                      ]}
                      value={merchantIdFilter || "all"}
                      onValueChange={handleMerchantIdFilter}
                      placeholder="Select merchant"
                      searchPlaceholder="Search merchants..."
                      emptyText="No merchants found."
                      all={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Provider
                    </label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Providers" },
                        ...providers.map((provider) => ({
                          value: provider.id.toString(),
                          label: provider.name,
                        })),
                      ]}
                      value={providerIdFilter || "all"}
                      onValueChange={handleProviderIdFilter}
                      placeholder="Select provider"
                      searchPlaceholder="Search providers..."
                      emptyText="No providers found."
                      all={false}
                    />
                  </div>
                </div>

                {/* Apply Filter Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={applyFilters} className="w-full sm:w-auto">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                Showing {payments.length} of {total} payments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="per-page" className="text-sm">
                  Per page:
                </Label>
                <Select
                  value={perPage.toString()}
                  onValueChange={(value) => setPerPage(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExport}
                disabled={payments.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              {permissionError ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🚫</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    Access Denied
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {permissionError}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Please contact your administrator if you believe this is an
                    error.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No payments found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {appliedStatusFilter ||
                    appliedPaymentMethodIdFilter ||
                    appliedCurrencyIdFilter ||
                    appliedMerchantIdFilter ||
                    appliedMerchantPaymentIdFilter ||
                    appliedCmpssPaymentIdFilter ||
                    appliedStartDateFilter ||
                    appliedEndDateFilter
                      ? "Try adjusting your filters to see more results."
                      : "There are no payments to display at the moment."}
                  </p>
                  {(appliedStatusFilter ||
                    appliedPaymentMethodIdFilter ||
                    appliedCurrencyIdFilter ||
                    appliedMerchantIdFilter ||
                    appliedMerchantPaymentIdFilter ||
                    appliedCmpssPaymentIdFilter ||
                    appliedStartDateFilter ||
                    appliedEndDateFilter) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Merchant Fee</TableHead>
                  <TableHead>Provider Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <button
                          onClick={() =>
                            handleCopyToClipboard(payment.cmpss_payment_id)
                          }
                          className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full text-left"
                        >
                          <div className="font-medium text-sm">
                            {payment.cmpss_payment_id}
                          </div>
                        </button>
                        <button
                          onClick={() =>
                            handleCopyToClipboard(payment.merchant_payment_id)
                          }
                          className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full text-left"
                        >
                          <div className="text-xs text-muted-foreground">
                            {payment.merchant_payment_id}
                          </div>
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{payment.merchant_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(
                          payment.order_amount,
                          payment.currency_code
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-purple-600">
                        {formatCurrency(
                          payment.merchant_fee || "0",
                          payment.currency_code
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(
                          payment.provider_commission || "0",
                          payment.currency_code
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.order_status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {payment.provider_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Retries: {payment.retry_verify_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.payment_method_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(payment.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * perPage + 1} to{" "}
            {Math.min(currentPage * perPage, total)} of {total} results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {/* Show first page */}
              {currentPage > 3 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className="w-8 h-8"
                  >
                    1
                  </Button>
                  {currentPage > 4 && (
                    <span className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {/* Show last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
