import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";

interface CardClass {
  id: number;
  name: string;
  max_guests: number;
  status: "Active" | "Inactive";
}

interface Props {
  cardClasses: CardClass[];
  onEdit: (cardClass: CardClass) => void;
  onToggleStatus: (cardClass: CardClass) => void;
}

const CardClassesTable: React.FC<Props> = ({ cardClasses, onEdit, onToggleStatus }) => (
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
              Max Guests
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
          {cardClasses.map((cc, idx) => (
            <TableRow key={cc.id}>
              <TableCell className="px-5 py-4 sm:px-6 text-start">{idx + 1}</TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{cc.name}</TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{cc.max_guests}</TableCell>
              <TableCell className="px-4 py-3 text-start">
                <Badge size="sm" color={cc.status === "Active" ? "success" : "error"}>{cc.status}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 space-x-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => onEdit(cc)}
                >
                  Edit
                </button>
                <button
                  className={`px-3 py-1 rounded ${cc.status === "Active" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white`}
                  onClick={() => onToggleStatus(cc)}
                >
                  {cc.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default CardClassesTable; 