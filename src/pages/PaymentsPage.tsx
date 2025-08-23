import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Payment, PaymentsResponse } from "@/types/payment";
import api from "@/lib/auth";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodIdFilter, setPaymentMethodIdFilter] = useState("");
  const [currencyIdFilter, setCurrencyIdFilter] = useState("2");
  const [merchantIdFilter, setMerchantIdFilter] = useState("");
  const [merchantPaymentIdFilter, setMerchantPaymentIdFilter] = useState("");
  const [cmpssPaymentIdFilter, setCmpssPaymentIdFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState(() => {
    // Set default start date to today at 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 16);
  });
  const [endDateFilter, setEndDateFilter] = useState(() => {
    // Set default end date to today at 23:59
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString().slice(0, 16);
  });
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_amount: "0",
    total_merchant_fee: "0",
    total_success: [0, "0"] as [number, string],
    total_failed: [0, "0"] as [number, string],
    total_pending: [0, "0"] as [number, string],
  });

  // Fetch payments data
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        ...(statusFilter && { order_status: statusFilter }),
        ...(paymentMethodIdFilter && {
          payment_method_id: parseInt(paymentMethodIdFilter),
        }),
        ...(currencyIdFilter && { currency_id: parseInt(currencyIdFilter) }),
        ...(merchantIdFilter && { merchant_id: parseInt(merchantIdFilter) }),
        ...(merchantPaymentIdFilter && {
          merchant_payment_id: merchantPaymentIdFilter,
        }),
        ...(cmpssPaymentIdFilter && { cmpss_payment_id: cmpssPaymentIdFilter }),
        ...(startDateFilter && { start_date: startDateFilter }),
        ...(endDateFilter && { end_date: endDateFilter }),
      };

      const response = await api.get<PaymentsResponse>("/payments", { params });
      const data = response.data;
      setPayments(data.payments);
      setTotalPages(data.total_pages);
      setTotal(data.total);

      // Extract stats from the API response
      setStats({
        total_amount: data.total_amount || "0",
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
    statusFilter,
    paymentMethodIdFilter,
    currencyIdFilter,
    merchantIdFilter,
    merchantPaymentIdFilter,
    cmpssPaymentIdFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Handle filters
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handlePaymentMethodIdFilter = (value: string) => {
    setPaymentMethodIdFilter(value);
    setCurrentPage(1);
  };

  const handleCurrencyIdFilter = (value: string) => {
    setCurrencyIdFilter(value);
    setCurrentPage(1);
  };

  const handleMerchantIdFilter = (value: string) => {
    setMerchantIdFilter(value);
    setCurrentPage(1);
  };

  const handleMerchantPaymentIdFilter = (value: string) => {
    setMerchantPaymentIdFilter(value);
    setCurrentPage(1);
  };

  const handleCmpssPaymentIdFilter = (value: string) => {
    setCmpssPaymentIdFilter(value);
    setCurrentPage(1);
  };

  const handleStartDateFilter = (value: string) => {
    setStartDateFilter(value);
    setCurrentPage(1);
  };

  const handleEndDateFilter = (value: string) => {
    setEndDateFilter(value);
    setCurrentPage(1);
  };

  // Check if filters are at default values
  const isDefaultFilter = (filterName: string, value: string) => {
    if (filterName === "currency_id" && value === "2") return true;
    if (filterName === "start_date" || filterName === "end_date") {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      if (filterName === "start_date") {
        return value === startOfDay.toISOString().slice(0, 16);
      }
      if (filterName === "end_date") {
        return value === endOfDay.toISOString().slice(0, 16);
      }
    }
    return false;
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPaymentMethodIdFilter("");
    setCurrencyIdFilter("2"); // Reset to default currency ID
    setMerchantIdFilter("");
    setMerchantPaymentIdFilter("");
    setCmpssPaymentIdFilter("");
    // Reset to today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    setStartDateFilter(startOfDay.toISOString().slice(0, 16));
    setEndDateFilter(endOfDay.toISOString().slice(0, 16));
    setCurrentPage(1);
    setPermissionError(null); // Clear permission errors when filters are cleared
  };

  const handleRefresh = () => {
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

  const handleExport = () => {
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
      completed: "bg-green-100 text-green-800",
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AuthenticatedLayout
      title="Payments"
      subtitle="Manage and monitor payment transactions"
    >
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Fees
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
          <CardDescription>
            Filter and search through payment transactions
          </CardDescription>
        </CardHeader>
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
                  onChange={(e) => handleCmpssPaymentIdFilter(e.target.value)}
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
                <Input
                  type="datetime-local"
                  className="w-full"
                  value={startDateFilter}
                  onChange={(e) => handleStartDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  End Date
                </label>
                <Input
                  type="datetime-local"
                  className="w-full"
                  value={endDateFilter}
                  onChange={(e) => handleEndDateFilter(e.target.value)}
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Payment Method ID
                </label>
                <Input
                  type="number"
                  placeholder="Enter payment method ID"
                  className="w-full"
                  value={paymentMethodIdFilter}
                  onChange={(e) => handlePaymentMethodIdFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Currency ID
                </label>
                <Input
                  type="number"
                  placeholder="Enter currency ID"
                  className="w-full"
                  value={currencyIdFilter}
                  onChange={(e) => handleCurrencyIdFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant ID
                </label>
                <Input
                  type="number"
                  placeholder="Enter merchant ID"
                  className="w-full"
                  value={merchantIdFilter}
                  onChange={(e) => handleMerchantIdFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {(statusFilter ||
              paymentMethodIdFilter ||
              currencyIdFilter ||
              merchantIdFilter ||
              merchantPaymentIdFilter ||
              cmpssPaymentIdFilter ||
              startDateFilter ||
              endDateFilter) && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm font-medium text-muted-foreground">
                  Active filters:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {statusFilter}
                    </Badge>
                  )}
                  {paymentMethodIdFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Payment Method ID: {paymentMethodIdFilter}
                    </Badge>
                  )}
                  {currencyIdFilter && (
                    <Badge
                      variant={
                        isDefaultFilter("currency_id", currencyIdFilter)
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      Currency ID: {currencyIdFilter}
                      {isDefaultFilter("currency_id", currencyIdFilter) &&
                        " (Default)"}
                    </Badge>
                  )}
                  {merchantIdFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Merchant ID: {merchantIdFilter}
                    </Badge>
                  )}
                  {merchantPaymentIdFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Merchant Payment ID: {merchantPaymentIdFilter}
                    </Badge>
                  )}
                  {cmpssPaymentIdFilter && (
                    <Badge variant="secondary" className="text-xs">
                      CMPSS Payment ID: {cmpssPaymentIdFilter}
                    </Badge>
                  )}
                  {startDateFilter && (
                    <Badge
                      variant={
                        isDefaultFilter("start_date", startDateFilter)
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      From: {new Date(startDateFilter).toLocaleString()}
                      {isDefaultFilter("start_date", startDateFilter) &&
                        " (Default)"}
                    </Badge>
                  )}
                  {endDateFilter && (
                    <Badge
                      variant={
                        isDefaultFilter("end_date", endDateFilter)
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      To: {new Date(endDateFilter).toLocaleString()}
                      {isDefaultFilter("end_date", endDateFilter) &&
                        " (Default)"}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
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
                    {statusFilter ||
                    paymentMethodIdFilter ||
                    currencyIdFilter ||
                    merchantIdFilter ||
                    merchantPaymentIdFilter ||
                    cmpssPaymentIdFilter ||
                    startDateFilter ||
                    endDateFilter
                      ? "Try adjusting your filters to see more results."
                      : "There are no payments to display at the moment."}
                  </p>
                  {(statusFilter ||
                    paymentMethodIdFilter ||
                    currencyIdFilter ||
                    merchantIdFilter ||
                    merchantPaymentIdFilter ||
                    cmpssPaymentIdFilter ||
                    startDateFilter ||
                    endDateFilter) && (
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
                      <div className="text-xs text-muted-foreground">
                        ID: {payment.merchant_id}
                      </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
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
