"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/lib/api/adminService";
import { ClientDTO } from "@/lib/api/types";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/ui/BackButton";
import { Pencil, } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const ClientList = () => {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { state } = useAuth();
  const router = useRouter();

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await adminService.getAllClients();
        const clientList: ClientDTO[] = data.response || [];
        setClients(clientList);
        setFilteredClients(clientList);
      } catch (err: any) {
        setError(err.message || "Failed to fetch clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = [...clients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.companyName?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term) ||
          client.contactNumber?.includes(term)
      );
    }
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Delete handler
  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    setDeletingId(clientId);
    try {
      await adminService.deleteClientById(clientId); // Correct method
      setClients((prev) => prev.filter((c) => c.clientId !== clientId));
      setFilteredClients((prev) => prev.filter((c) => c.clientId !== clientId));
    } catch (err: any) {
      setError(err.message || "Failed to delete client");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
        <div className="p-4 sm:p-6 md:p-8 text-center text-red-600">
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
      <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
            <div className="absolute left-0">
              <BackButton to="/admin-dashboard/clients" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent px-16 sm:px-24 md:px-32">
              Client List
            </h1>
          </div>
          <div className="flex justify-end mb-4 sm:mb-6">
            <Link
              href="/admin-dashboard/clients/add"
              className="w-full sm:w-auto max-w-xs sm:max-w-none bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            >
              Add New Client
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
              <div className="flex-1 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {filteredClients.length !== clients.length && (
              <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center sm:text-left">
                Showing <strong>{filteredClients.length}</strong> of{" "}
                <strong>{clients.length}</strong> clients
              </p>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="pl-8 sm:pl-20 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">                    
                    Company
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    City
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500"
                    >
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const primaryAddress = client.addresses?.[0];

                    return (
                      <tr key={client.clientId} className="hover:bg-gray-50">

                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 ">
                            <Link
                              href={`/admin-dashboard/clients/${client.clientId}/edit`}
                              className="mr-3 -ml-1 p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Edit Client"
                            >
                              <Pencil size={16} strokeWidth={2} />
                            </Link>
                            <Link
                              href={`/admin-dashboard/clients/${client.clientId}`}
                              className="text-sm font-medium text-indigo-600 hover:underline line-clamp-1"
                            >
                              {client.companyName}
                            </Link>

                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell text-center">
                          {client.email}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell text-center">
                          {client.contactNumber}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell text-center">
                          {primaryAddress?.city || "-"}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${client.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {client.status || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ClientList;

