import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Copy, Download, Settings } from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Payment } from "@/types/payment";
import api from "@/lib/auth";
import JsonView from "@uiw/react-json-view";

export default function PaymentDetailsPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update TPPI dialog state
  const [updateTppiDialogOpen, setUpdateTppiDialogOpen] = useState(false);
  const [tppiValue, setTppiValue] = useState("");
  const [updatingTppi, setUpdatingTppi] = useState(false);

  useEffect(() => {
    if (paymentId && !isNaN(Number(paymentId))) {
      fetchPaymentDetails();
    } else if (paymentId) {
      setError("Invalid payment ID");
      setLoading(false);
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Payment>(`/payments/${Number(paymentId)}`);
      setPayment(response.data);
    } catch (error: any) {
      console.error("Error fetching payment details:", error);
      if (error.response?.status === 404) {
        setError("Payment not found");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view this payment");
      } else {
        setError("Failed to load payment details");
      }
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownloadJson = () => {
    if (!payment) return;

    const jsonString = JSON.stringify(payment, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-${payment.cmpss_payment_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Payment details downloaded");
  };

  // Update TPPI function
  const updateTppi = async (cmpssPaymentId: string, tppi: string) => {
    try {
      const response = await api.post("/payments/update-third-party-id", {
        cmpss_payment_id: cmpssPaymentId,
        tppi: tppi,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error updating TPPI:", error);
      throw error;
    }
  };

  // Handle update TPPI
  const handleUpdateTppi = async () => {
    if (!payment || !tppiValue.trim()) {
      toast.error("Please enter a valid TPPI value");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to update the TPPI for payment ${
        payment.cmpss_payment_id
      } to "${tppiValue.trim()}"?`
    );
    if (!confirmed) return;

    setUpdatingTppi(true);
    try {
      await updateTppi(payment.cmpss_payment_id, tppiValue.trim());
      toast.success("TPPI updated successfully");
      setUpdateTppiDialogOpen(false);
      setTppiValue("");
      // Refresh the payment details
      fetchPaymentDetails();
    } catch (error: any) {
      console.error("Error updating TPPI:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied: You don't have permission to update TPPI");
      } else if (error.response?.data?.detail) {
        toast.error(`Error: ${error.response.data.detail}`);
      } else {
        toast.error("Failed to update TPPI. Please try again.");
      }
    } finally {
      setUpdatingTppi(false);
    }
  };

  // Open update TPPI dialog
  const openUpdateTppiDialog = () => {
    setTppiValue("");
    setUpdateTppiDialogOpen(true);
  };

  // Check if payment is eligible for TPPI update
  const isEligibleForTppiUpdate = (payment: Payment) => {
    return (
      payment.order_status === "failed" &&
      (payment.third_party_provider_id === "-1" ||
        payment.third_party_provider_id === null)
    );
  };

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

  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout
        title="Payment Details"
        subtitle="Loading payment information..."
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !payment) {
    return (
      <AuthenticatedLayout
        title="Payment Details"
        subtitle="Error loading payment information"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              {error || "Payment not found"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {error === "Payment not found"
                ? "The payment you're looking for doesn't exist."
                : "There was an error loading the payment details."}
            </p>
            <Button onClick={() => navigate("/payments")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Button>
          </CardContent>
        </Card>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Payment Details"
      subtitle={`CMPSS Payment ID: ${payment.cmpss_payment_id}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/payments")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payments
          </Button>
          <div className="flex items-center gap-2">
            {isEligibleForTppiUpdate(payment) && (
              <Button
                variant="outline"
                onClick={openUpdateTppiDialog}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Update TPPI
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                handleCopyToClipboard(JSON.stringify(payment, null, 2))
              }
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadJson}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </Button>
          </div>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Payment Summary
              {getStatusBadge(payment.order_status)}
            </CardTitle>
            <CardDescription>
              Basic information about this payment transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  CMPSS Payment ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {payment.cmpss_payment_id}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(payment.cmpss_payment_id)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant Payment ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {payment.merchant_payment_id}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(payment.merchant_payment_id)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Amount
                </label>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(payment.order_amount, payment.currency_code)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant Fee
                </label>
                <p className="text-lg font-semibold text-purple-600 mt-1">
                  {formatCurrency(
                    payment.merchant_fee || "0",
                    payment.currency_code
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Provider
                </label>
                <p className="text-sm mt-1">{payment.provider_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </label>
                <p className="text-sm mt-1">{payment.payment_method_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant
                </label>
                <p className="text-sm mt-1">{payment.merchant_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created At
                </label>
                <p className="text-sm mt-1">{formatDate(payment.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Third Party Provider ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {payment.third_party_provider_id || "Not set"}
                  </p>
                  {payment.third_party_provider_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopyToClipboard(payment.third_party_provider_id!)
                      }
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Updated At
                </label>
                <p className="text-sm mt-1">{formatDate(payment.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw JSON Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Payment Data</CardTitle>
            <CardDescription>
              Complete payment information in JSON format with syntax
              highlighting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <JsonView
                value={payment}
                style={{
                  backgroundColor: "#f8f9fa",
                  fontSize: "14px",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                }}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={true}
                collapsed={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update TPPI Dialog */}
      <Dialog
        open={updateTppiDialogOpen}
        onOpenChange={setUpdateTppiDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Third Party Provider ID</DialogTitle>
            <DialogDescription>
              Update the third party provider ID for payment{" "}
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {payment?.cmpss_payment_id}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tppi">Third Party Provider ID</Label>
              <Input
                id="tppi"
                placeholder="Enter TPPI value..."
                value={tppiValue}
                onChange={(e) => setTppiValue(e.target.value)}
                disabled={updatingTppi}
              />
            </div>
            {payment && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Current TPPI:</strong>{" "}
                  {payment.third_party_provider_id || "Not set"}
                </p>
                <p>
                  <strong>Status:</strong> {payment.order_status}
                </p>
                <p>
                  <strong>Amount:</strong>{" "}
                  {formatCurrency(payment.order_amount, payment.currency_code)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateTppiDialogOpen(false)}
              disabled={updatingTppi}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTppi}
              disabled={updatingTppi || !tppiValue.trim()}
            >
              {updatingTppi ? "Updating..." : "Update TPPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
