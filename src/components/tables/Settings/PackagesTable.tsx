import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";

interface Package {
  id: number;
  name: string;
  amount: number;
  currency: string;
  status: "Active" | "Inactive";
}

interface Props {
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onToggleStatus: (pkg: Package) => void;
}

const PackagesTable: React.FC<Props> = ({ packages, onEdit, onToggleStatus }) => (
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
              Amount
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Currency
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
          {packages.map((pkg, idx) => (
            <TableRow key={pkg.id}>
              <TableCell className="px-5 py-4 sm:px-6 text-start">{idx + 1}</TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{pkg.name}</TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {pkg.amount.toLocaleString()}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{pkg.currency}</TableCell>
              <TableCell className="px-4 py-3 text-start">
                <Badge size="sm" color={pkg.status === "Active" ? "success" : "error"}>{pkg.status}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 space-x-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => onEdit(pkg)}
                >
                  Edit
                </button>
                <button
                  className={`px-3 py-1 rounded ${pkg.status === "Active" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white`}
                  onClick={() => onToggleStatus(pkg)}
                >
                  {pkg.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default PackagesTable; 