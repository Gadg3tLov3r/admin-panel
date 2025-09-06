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
import { ArrowLeft, Copy, Download } from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Disbursement } from "@/types/disbursement";
import api from "@/lib/auth";
import JsonView from "@uiw/react-json-view";

export default function DisbursementDetailsPage() {
  const { disbursementId } = useParams<{ disbursementId: string }>();
  const navigate = useNavigate();
  const [disbursement, setDisbursement] = useState<Disbursement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disbursementId && !isNaN(Number(disbursementId))) {
      fetchDisbursementDetails();
    } else if (disbursementId) {
      setError("Invalid disbursement ID");
      setLoading(false);
    }
  }, [disbursementId]);

  const fetchDisbursementDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Disbursement>(
        `/disbursements/${Number(disbursementId)}`
      );
      setDisbursement(response.data);
    } catch (error: any) {
      console.error("Error fetching disbursement details:", error);
      if (error.response?.status === 404) {
        setError("Disbursement not found");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view this disbursement");
      } else {
        setError("Failed to load disbursement details");
      }
      toast.error("Failed to load disbursement details");
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
    if (!disbursement) return;

    const jsonString = JSON.stringify(disbursement, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disbursement-${disbursement.cmpss_disbursement_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Disbursement details downloaded");
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
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
        title="Disbursement Details"
        subtitle="Loading disbursement information..."
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !disbursement) {
    return (
      <AuthenticatedLayout
        title="Disbursement Details"
        subtitle="Error loading disbursement information"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              {error || "Disbursement not found"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {error === "Disbursement not found"
                ? "The disbursement you're looking for doesn't exist."
                : "There was an error loading the disbursement details."}
            </p>
            <Button onClick={() => navigate("/disbursements")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Disbursements
            </Button>
          </CardContent>
        </Card>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Disbursement Details"
      subtitle={`CMPSS Disbursement ID: ${disbursement.cmpss_disbursement_id}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/disbursements")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Disbursements
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                handleCopyToClipboard(JSON.stringify(disbursement, null, 2))
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

        {/* Disbursement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Disbursement Summary
              {getStatusBadge(disbursement.order_status)}
            </CardTitle>
            <CardDescription>
              Basic information about this disbursement transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  CMPSS Disbursement ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {disbursement.cmpss_disbursement_id}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(disbursement.cmpss_disbursement_id)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant Disbursement ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {disbursement.merchant_disbursement_id}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(
                        disbursement.merchant_disbursement_id
                      )
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
                  {formatCurrency(
                    disbursement.order_amount,
                    disbursement.currency_code
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant Fee
                </label>
                <p className="text-lg font-semibold text-purple-600 mt-1">
                  {formatCurrency(
                    disbursement.merchant_fee || "0",
                    disbursement.currency_code
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Provider
                </label>
                <p className="text-sm mt-1">{disbursement.provider_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </label>
                <p className="text-sm mt-1">
                  {disbursement.payment_method_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant
                </label>
                <p className="text-sm mt-1">{disbursement.merchant_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Account Number
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {disbursement.account_details?.account_number || "N/A"}
                  </p>
                  {disbursement.account_details?.account_number && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopyToClipboard(
                          disbursement.account_details.account_number
                        )
                      }
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created At
                </label>
                <p className="text-sm mt-1">
                  {formatDate(disbursement.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Updated At
                </label>
                <p className="text-sm mt-1">
                  {formatDate(disbursement.updated_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw JSON Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Disbursement Data</CardTitle>
            <CardDescription>
              Complete disbursement information in JSON format with syntax
              highlighting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <JsonView
                value={disbursement}
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
    </AuthenticatedLayout>
  );
}
