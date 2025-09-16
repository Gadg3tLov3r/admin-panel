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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Plus,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Settlement, SettlementsResponse } from "@/types/settlement";
import api from "@/lib/auth";

// Helper function to get today's date at 00:00 UTC
const getTodayUTC = () => {
  const today = new Date();
  const utcToday = new Date(
    today.getTime() + today.getTimezoneOffset() * 60000
  );
  utcToday.setUTCHours(0, 0, 0, 0);
  return utcToday;
};

export default function MerchantSettlementsPage() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Merchant methods data for dropdown
  const [merchants, setMerchants] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Currencies data for dropdown
  const [currencies, setCurrencies] = useState<
    Array<{ id: number; name: string; sign: string; country: string }>
  >([]);

  // Create settlement dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    merchant_id: "",
    fiat_amount: "",
    currency_name: "",
    note: "",
  });

  // Fetch settlements data
  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      };

      const response = await api.get<SettlementsResponse>("/settlements", {
        params,
      });
      const data = response.data;
      setSettlements(data.settlements);
      setTotalPages(data.total_pages);
      setTotal(data.total);

      setPermissionError(null); // Clear any previous permission errors
    } catch (error: any) {
      console.error("Error fetching settlements:", error);

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
            `You don't have permission to view settlements (${permission})`
          );
          toast.error(
            `Access denied: You don't have permission to view settlements (${permission})`
          );
        } else {
          setPermissionError("Insufficient permissions to view settlements");
          toast.error(
            "Access denied: Insufficient permissions to view settlements"
          );
        }
      } else {
        setPermissionError(null);
        toast.error("Failed to load settlements. Please try again.");
      }

      // Set empty state on error
      setSettlements([]);
      setTotalPages(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [currentPage, perPage]);

  // Fetch merchant methods data
  const fetchMerchants = useCallback(async () => {
    try {
      const response = await api.get("/merchant-methods");
      const data = response.data.data || [];
      setMerchants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching merchant methods:", error);
      setMerchants([]);
    }
  }, []);

  // Fetch currencies data
  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await api.get("/currencies");
      const data = response.data.currencies || [];
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      setCurrencies([]);
    }
  }, []);

  // Load merchant methods and currencies on component mount
  useEffect(() => {
    fetchMerchants();
    fetchCurrencies();
  }, [fetchMerchants, fetchCurrencies]);

  const handleRefresh = () => {
    const confirmed = window.confirm(
      "Are you sure you want to refresh the settlements data? This will reload all current data."
    );
    if (!confirmed) return;

    fetchSettlements();
    toast.success("Settlements refreshed");
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleViewDetails = (settlement: Settlement) => {
    window.open(`/settlements/${settlement.id}`, "_blank");
  };

  const handleExport = () => {
    const confirmed = window.confirm(
      `Are you sure you want to export ${settlements.length} settlement records?`
    );
    if (!confirmed) return;

    // Create CSV data
    const headers = [
      "Settlement ID",
      "Merchant",
      "Currency",
      "Fiat Amount",
      "USDT Amount",
      "Status",
      "Created At",
    ];

    const csvData = settlements.map((settlement) => [
      settlement.id,
      settlement.merchant_name,
      settlement.currency_name,
      settlement.fiat_amount,
      settlement.usdt_amount,
      settlement.status,
      new Date(settlement.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlements-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Settlements exported successfully");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
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

  // Create settlement function
  const handleCreateSettlement = async () => {
    if (
      !createForm.merchant_id ||
      !createForm.fiat_amount ||
      !createForm.currency_name
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreateLoading(true);
    try {
      await api.post("/merchant-settlements", {
        merchant_method_id: parseInt(createForm.merchant_id),
        fiat_amount: parseFloat(createForm.fiat_amount),
        currency_name: createForm.currency_name,
        note: createForm.note || undefined,
      });

      toast.success("Settlement created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({
        merchant_id: "",
        fiat_amount: "",
        currency_name: "",
        note: "",
      });

      // Refresh the settlements list
      await fetchSettlements();
    } catch (error: any) {
      console.error("Error creating settlement:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: Insufficient permissions to create settlements"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create settlement"
        );
      }
    } finally {
      setCreateLoading(false);
    }
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
      title="Merchant Settlements"
      subtitle="Manage and monitor merchant settlement transactions"
    >
      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Merchant Settlement Transactions</CardTitle>
              <CardDescription>
                Showing {settlements.length} of {total} merchant settlements
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Settlement
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Settlement</DialogTitle>
                    <DialogDescription>
                      Create a new merchant settlement transaction.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="merchant_id" className="text-right">
                        Merchant Method *
                      </Label>
                      <div className="col-span-3">
                        <Select
                          value={createForm.merchant_id}
                          onValueChange={(value) =>
                            setCreateForm({
                              ...createForm,
                              merchant_id: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select merchant method" />
                          </SelectTrigger>
                          <SelectContent>
                            {merchants.length === 0 ? (
                              <SelectItem value="no-data" disabled>
                                No merchant methods available
                              </SelectItem>
                            ) : (
                              merchants.map((merchant) => (
                                <SelectItem
                                  key={merchant.id}
                                  value={merchant.id.toString()}
                                >
                                  {merchant.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fiat_amount" className="text-right">
                        Amount *
                      </Label>
                      <Input
                        id="fiat_amount"
                        type="number"
                        step="0.01"
                        value={createForm.fiat_amount}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            fiat_amount: e.target.value,
                          })
                        }
                        className="col-span-3"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="currency_name" className="text-right">
                        Currency
                      </Label>
                      <Select
                        value={createForm.currency_name}
                        onValueChange={(value) =>
                          setCreateForm({ ...createForm, currency_name: value })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.name}>
                              {currency.name} ({currency.sign})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="note" className="text-right">
                        Note
                      </Label>
                      <textarea
                        id="note"
                        value={createForm.note}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCreateForm({ ...createForm, note: e.target.value })
                        }
                        className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Optional note for this settlement"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateSettlement}
                      disabled={createLoading}
                    >
                      {createLoading ? "Creating..." : "Create Settlement"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExport}
                disabled={settlements.length === 0}
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
          ) : settlements.length === 0 ? (
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
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No merchant settlements found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    There are no merchant settlements to display at the moment.
                  </p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement ID</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Fiat Amount</TableHead>
                  <TableHead>USDT Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(settlement.id.toString())
                        }
                        className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full text-left"
                      >
                        <div className="font-medium text-sm">
                          {settlement.id}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{settlement.merchant_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(
                          settlement.fiat_amount,
                          settlement.currency_name
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        USDT{" "}
                        {parseFloat(settlement.usdt_amount).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(settlement.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(settlement)}
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
