import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import Pagination from "../../common/Pagination";
import { PhoneNumberValidator } from "../../../utils/phoneValidation";

interface Customer {
  id: number;
  name: string;
  phone_number: string;
  title?: string;
  physical_location?: string;
  status: "Active" | "Inactive";
}

interface Props {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onActivate: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
}

const CustomersTable: React.FC<Props> = ({ customers, onEdit, onActivate, onDeactivate, pagination }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Serial No.
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Name
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Phone Number
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Title
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Location
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Status
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Action
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {customers.map((customer, idx) => (
            <TableRow key={customer.id}>
              <TableCell className="px-5 py-4 sm:px-6 text-start">
                {pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1 : idx + 1}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {customer.name}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {PhoneNumberValidator.formatForDisplay(customer.phone_number)}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {customer.title || "-"}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {customer.physical_location || "-"}
              </TableCell>
              <TableCell className="px-4 py-3 text-start">
                <Badge size="sm" color={customer.status === "Active" ? "success" : "error"}>{customer.status}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 space-x-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => onEdit(customer)}
                >
                  Edit
                </button>
                {customer.status === "Active" ? (
                  <button
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    onClick={() => onDeactivate(customer)}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
                    onClick={() => onActivate(customer)}
                  >
                    Activate
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {/* Pagination */}
    {pagination && (
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.onPageChange}
        onItemsPerPageChange={pagination.onItemsPerPageChange}
      />
    )}
  </div>
);

export default CustomersTable; 