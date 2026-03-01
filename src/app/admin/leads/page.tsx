"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  school: string;
  undergraduate_year: number;
  message: string | null;
  status: "new" | "contacted" | "resolved";
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  new: {
    label: "New",
    variant: "default" as const,
    className: "bg-yellow-500 hover:bg-yellow-600",
  },
  contacted: {
    label: "Contacted",
    variant: "secondary" as const,
    className: "bg-blue-500 hover:bg-blue-600",
  },
  resolved: {
    label: "Resolved",
    variant: "outline" as const,
    className: "bg-green-500 hover:bg-green-600",
  },
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url =
        filter === "all" ? "/api/leads" : `/api/leads?status=${filter}`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("You must be logged in as an admin to view this page.");
        } else {
          setError("Failed to load leads.");
        }
        return;
      }

      const data = await res.json();
      setLeads(data.leads);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                status: newStatus as Lead["status"],
                updated_at: new Date().toISOString(),
              }
            : lead,
        ),
      );
    } catch (err) {
      console.error("Failed to update lead status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function exportToCSV() {
    if (leads.length === 0) return;

    const headers = [
      "Name",
      "Email",
      "School",
      "Year",
      "Message",
      "Status",
      "Date",
    ];
    const rows = leads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.school,
      lead.undergraduate_year,
      lead.message || "",
      lead.status,
      new Date(lead.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground mt-1">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Filter & Export */}
        <div className="flex items-center gap-4">
          <button
            onClick={exportToCSV}
            disabled={leads.length === 0}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Export CSV
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No leads found.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>School</TableHead>
                <TableHead className="w-[80px]">Year</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead className="w-[140px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Badge className={statusConfig[lead.status].className}>
                      {statusConfig[lead.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {lead.full_name}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-primary hover:underline"
                    >
                      {lead.email}
                    </a>
                  </TableCell>
                  <TableCell>{lead.school}</TableCell>
                  <TableCell>{lead.undergraduate_year}</TableCell>
                  <TableCell className="max-w-[200px]">
                    {lead.message ? (
                      <span className="truncate block" title={lead.message}>
                        {lead.message.length > 50
                          ? `${lead.message.substring(0, 50)}...`
                          : lead.message}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell>
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      disabled={updatingId === lead.id}
                      className="border rounded-md px-2 py-1 text-sm bg-background disabled:opacity-50"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
