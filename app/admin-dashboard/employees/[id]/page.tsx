'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeDTO, DocumentType } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';

const ViewEmployee = () => {
  const params = useParams();
  const { state } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!params.id || typeof params.id !== 'string') {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Invalid employee ID' });
        setLoading(false);
        return;
      }
      try {
        const response = await adminService.getEmployeeById(params.id);
        if (response.flag && response.response) {

          setEmployee(response.response);
        } else {
          throw new Error(response.message || 'Failed to fetch employee');
        }
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to fetch employee' });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="text-center py-12 text-gray-500">Employee not found</div>
      </ProtectedRoute>
    );
  }

  const getValue = (value: any) => (value != null ? String(value) : '—');

  const getDocumentLink = (type: DocumentType) => {
    const doc = employee.documents.find(d => d.docType === type);
    return doc ? (
      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
        View Document
      </a>
    ) : (
      <span className="text-gray-400">Not uploaded</span>
    );
  };
  const formatEnum = (value: string | undefined) =>
    value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  const formatDuration = (value: string | undefined) => value || '—';
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-gray-600 mt-1">{employee.designation} • {employee.clientName || 'Client'}</p>          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin-dashboard/employees/${employee.employeeId}/edit`}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Edit Employee
            </Link>
            <Link
              href="/admin-dashboard/employees/list"
              className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {employee.employeePhotoUrl && (
              <div className="md:col-span-2 flex justify-center mb-4">
                <img
                  src={employee.employeePhotoUrl}
                  alt="Employee"
                  className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow-md"
                />
              </div>
            )}
            <InfoItem label="First Name" value={`${getValue(employee.firstName)}`} />
            <InfoItem label="Last Name" value={`${getValue(employee.lastName)}`} />
            <InfoItem label="Personal Email" value={getValue(employee.personalEmail)} />
            <InfoItem label="Company Email" value={getValue(employee.companyEmail)} />
            <InfoItem label="Contact Number" value={getValue(employee.contactNumber)} />
            <InfoItem label="Alternate Number" value={getValue(employee.alternateContactNumber)} />
            <InfoItem label="Gender" value={getValue(employee.gender)} />
            <InfoItem label="Marital Status" value={getValue(employee.maritalStatus)} />
            <InfoItem label="Children" value={getValue(employee.numberOfChildren)} />
            <InfoItem label="Date of Birth" value={getValue(employee.dateOfBirth)} />
            <InfoItem label="Nationality" value={getValue(employee.nationality)} />
            <InfoItem label="Emergency Contact" value={`${getValue(employee.emergencyContactName)} (${getValue(employee.emergencyContactNumber)})`} />
            <InfoItem label="Skills & Certifications" value={getValue(employee.skillsAndCertification)} />
            <InfoItem label="Remarks" value={getValue(employee.remarks)} className="md:col-span-2" />
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
            Professional Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoItem label="Designation" value={getValue(employee.designation)} />
            <InfoItem label="Date of Joining" value={getValue(employee.dateOfJoining)} />
            <InfoItem label="Company" value={getValue(employee.clientName)} />
            <InfoItem label="Client Status" value={getValue(employee.clientStatus || 'N/A')} />
            <InfoItem label="Client Name" value={getValue(employee.clientName)} />
            <InfoItem label="Employment Type" value={getValue(employee.employmentType)} />
            <InfoItem label="Rate Card" value={getValue(employee.rateCard)} />
            <InfoItem label="Available Leaves" value={getValue(employee.availableLeaves)} />
            <InfoItem label="Reporting Manager" value={getValue(employee.reportingManagerName)} />

          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
            Bank & Identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoItem label="Account Holder" value={getValue(employee.accountHolderName)} />
            <InfoItem label="Bank Name" value={getValue(employee.bankName)} />
            <InfoItem label="Account Number" value={getValue(employee.accountNumber)} />
            <InfoItem label="IFSC Code" value={getValue(employee.ifscCode)} />
            <InfoItem label="Branch" value={getValue(employee.branchName)} />
            <InfoItem label="PAN Number" value={getValue(employee.panNumber)} />
            <InfoItem label="Aadhar Number" value={getValue(employee.aadharNumber)} />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
            Address Details
          </h2>
          {employee.addresses.length > 0 ? (
            <div className="space-y-6">
              {employee.addresses.map((addr, i) => (
                <div key={addr.addressId || i} className="bg-gray-50 p-5 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">
                    {addr.addressType ? `${addr.addressType} Address` : `Address ${i + 1}`}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <InfoItem label="House No" value={getValue(addr.houseNo)} compact />
                    <InfoItem label="Street" value={getValue(addr.streetName)} compact />
                    <InfoItem label="City" value={getValue(addr.city)} compact />
                    <InfoItem label="State" value={getValue(addr.state)} compact />
                    <InfoItem label="Pincode" value={getValue(addr.pincode)} compact />
                    <InfoItem label="Country" value={getValue(addr.country)} compact />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No address information</p>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <span className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></span>
            Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocItem label="Offer Letter" link={getDocumentLink('OFFER_LETTER')} />
            <DocItem label="Contract" link={getDocumentLink('CONTRACT')} />
            <DocItem label="Tax Declaration" link={getDocumentLink('TAX_DECLARATION_FORM')} />
            <DocItem label="Work Permit" link={getDocumentLink('WORK_PERMIT')} />
            <DocItem label="PAN Card" link={getDocumentLink('PAN_CARD')} />
            <DocItem label="Aadhar Card" link={getDocumentLink('AADHAR_CARD')} />
            <DocItem label="Bank Passbook" link={getDocumentLink('BANK_PASSBOOK')} />
            <DocItem label="10th Certificate" link={getDocumentLink('TENTH_CERTIFICATE')} />
            <DocItem label="Intermediate" link={getDocumentLink('INTERMEDIATE_CERTIFICATE')} />
            <DocItem label="Degree" link={getDocumentLink('DEGREE_CERTIFICATE')} />
            <DocItem label="Post Graduation" link={getDocumentLink('POST_GRADUATION_CERTIFICATE')} />
          </div>

          {employee.documents.some(d => d.docType === 'OTHER') && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-800 mb-3">Other Documents</h4>
              <div className="space-y-2">
                {employee.documents
                  .filter(d => d.docType === 'OTHER')
                  .map((doc, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <span className="font-medium">Document {i + 1}</span>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Salary Details */}
        {employee.employeeSalaryDTO && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <span className="w-2 h-2 bg-teal-600 rounded-full mr-3"></span>
              Salary & Compensation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoItem label="Basic Pay" value={getValue(employee.employeeSalaryDTO.basicPay)} />
              <InfoItem label="Pay Type" value={getValue(employee.employeeSalaryDTO.payType)} />
              <InfoItem label="Standard Hours" value={getValue(employee.employeeSalaryDTO.standardHours)} />
              <InfoItem label="Pay Class" value={getValue(employee.employeeSalaryDTO.payClass)} />
            </div>

            {employee.employeeSalaryDTO?.allowances && employee.employeeSalaryDTO.allowances.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Allowances</h4>
                <div className="space-y-2">
                  {employee.employeeSalaryDTO.allowances.map((a, i) => (
                    <div key={i} className="bg-green-50 p-3 rounded-lg text-sm">
                      <strong>{a.allowanceType}:</strong> ₹{a.amount} (from {a.effectiveDate})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {employee.employeeSalaryDTO?.deductions && employee.employeeSalaryDTO.deductions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Deductions</h4>
                <div className="space-y-2">
                  {employee.employeeSalaryDTO.deductions.map((d, i) => (
                    <div key={i} className="bg-red-50 p-3 rounded-lg text-sm">
                      <strong>{d.deductionType}:</strong> ₹{d.amount} (from {d.effectiveDate})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Employment Details */}
        {employee.employeeEmploymentDetailsDTO && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Employment Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Notice Period */}
              <InfoItem
                label="Notice Period"
                value={formatDuration(employee.employeeEmploymentDetailsDTO.noticePeriodDurationLabel)}
              />

              {/* Probation Section */}
              {employee.employeeEmploymentDetailsDTO.probationApplicable ? (
                <>
                  <InfoItem
                    label="Probation Duration"
                    value={formatDuration(employee.employeeEmploymentDetailsDTO.probationDurationLabel)}
                  />
                  <InfoItem
                    label="Probation Notice"
                    value={formatDuration(employee.employeeEmploymentDetailsDTO.probationNoticePeriodLabel)}
                  />
                </>
              ) : (
                <InfoItem label="Probation" value="Not Applicable" />
              )}

              {/* Bond Section */}
              {employee.employeeEmploymentDetailsDTO.bondApplicable ? (
                <InfoItem
                  label="Bond Duration"
                  value={formatDuration(employee.employeeEmploymentDetailsDTO.bondDurationLabel)}
                />
              ) : (
                <InfoItem label="Bond" value="Not Applicable" />
              )}

              {/* Working Model */}
              <InfoItem
                label="Working Model"
                value={formatEnum(employee.employeeEmploymentDetailsDTO.workingModel)}
              />

              {/* Shift Timing */}
              <InfoItem
                label="Shift Timing"
                value={formatDuration(employee.employeeEmploymentDetailsDTO.shiftTimingLabel)}
              />

              {/* Department */}
              <InfoItem
                label="Department"
                value={formatEnum(employee.employeeEmploymentDetailsDTO.department)}
              />

              {/* Location */}
              <InfoItem
                label="Location"
                value={getValue(employee.employeeEmploymentDetailsDTO.location)}
              />

              {/* Date of Confirmation */}
              <InfoItem
                label="Date of Confirmation"
                value={getValue(employee.employeeEmploymentDetailsDTO.dateOfConfirmation)}
              />
            </div>
          </div>
        )}

        {/* Insurance */}
        {employee.employeeInsuranceDetailsDTO && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <span className="w-2 h-2 bg-pink-600 rounded-full mr-3"></span>
              Insurance & Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoItem label="Policy Number" value={getValue(employee.employeeInsuranceDetailsDTO.policyNumber)} />
              <InfoItem label="Provider" value={getValue(employee.employeeInsuranceDetailsDTO.providerName)} />
              <InfoItem label="Coverage Period" value={`${getValue(employee.employeeInsuranceDetailsDTO.coverageStart)} to ${getValue(employee.employeeInsuranceDetailsDTO.coverageEnd)}`} />
              <InfoItem label="Nominee" value={`${getValue(employee.employeeInsuranceDetailsDTO.nomineeName)} (${getValue(employee.employeeInsuranceDetailsDTO.nomineeRelation)})`} />
              <InfoItem label="Group Insurance" value={getValue(employee.employeeInsuranceDetailsDTO.groupInsurance)} />
            </div>
          </div>
        )}

        {/* Equipment */}
        {employee.employeeEquipmentDTO && employee.employeeEquipmentDTO.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <span className="w-2 h-2 bg-cyan-600 rounded-full mr-3"></span>
              Assigned Equipment
            </h2>
            <div className="space-y-4">
              {employee.employeeEquipmentDTO.map((eq, i) => (
                <div key={eq.equipmentId || i} className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <InfoItem label="Type" value={getValue(eq.equipmentType)} compact />
                    <InfoItem label="Serial No" value={getValue(eq.serialNumber)} compact />
                    <InfoItem label="Issued On" value={getValue(eq.issuedDate)} compact />
                    <InfoItem label="Returned On" value={getValue(eq.returnedDate) || '—'} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statutory */}
        {employee.employeeStatutoryDetailsDTO && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
              Statutory Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoItem label="Passport" value={getValue(employee.employeeStatutoryDetailsDTO.passportNumber)} />
              <InfoItem label="Tax Regime" value={getValue(employee.employeeStatutoryDetailsDTO.taxRegime)} />
              <InfoItem label="PF UAN" value={getValue(employee.employeeStatutoryDetailsDTO.pfUanNumber)} />
              <InfoItem label="ESI Number" value={getValue(employee.employeeStatutoryDetailsDTO.esiNumber)} />
              <InfoItem label="SSN" value={getValue(employee.employeeStatutoryDetailsDTO.ssnNumber)} />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

// Reusable Components
const InfoItem = ({ label, value, compact = false, className = '' }: { label: string; value: any; compact?: boolean; className?: string }) => (
  <div className={`${compact ? 'text-sm' : ''} ${className}`}>
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className="mt-1 font-medium text-gray-900">{value}</p>
  </div>
);

const DocItem = ({ label, link }: { label: string; link: React.ReactNode }) => (
  <div>
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className="mt-1">{link}</p>
  </div>
);

export default ViewEmployee;