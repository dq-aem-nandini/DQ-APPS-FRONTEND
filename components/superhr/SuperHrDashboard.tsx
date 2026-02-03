import React from "react";

const SuperHrDashboard = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Super HR Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Manage employee holidays, leaves, and timesheets efficiently
        </p>
      </div>

      {/* Usage Instructions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          How to use the system
        </h2>

        <ol className="space-y-4 list-decimal list-inside text-gray-700">
          <li>
            <span className="font-medium">Fill Holidays (Add Holiday option)</span>
            <p className="text-sm text-gray-600 ml-5">
              Select a client and add holidays applicable to each employee
              under that client.
            </p>
          </li>

          <li>
            <span className="font-medium">View Holidays</span>
            <p className="text-sm text-gray-600 ml-5">
              Select a client and select specific employee
              under that client.
            </p>
          </li>

          <li>
            <span className="font-medium">Fill Leaves</span>
            <p className="text-sm text-gray-600 ml-5">
              After holidays are configured, add leave details for each
              client.
            </p>
          </li>

          <li>
            <span className="font-medium">Fill Timesheets</span>
            <p className="text-sm text-gray-600 ml-5">
              Once holidays and leaves are completed, employees can submit
              their timesheets.
            </p>
          </li>
        </ol>
      </div>

      {/* Placeholder Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm text-gray-500">Total Clients</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-2">
            --
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm text-gray-500">Total Employees</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-2">
            --
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm text-gray-500">Pending Timesheets</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-2">
            --
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperHrDashboard;
