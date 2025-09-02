import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";

interface InventarioCardProps {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  buttonText: string;
  buttonVariant: "primary" | "success" | "warning";
  onClick: () => void;
}

export default function InventarioCard({
  title,
  description,
  icon,
  iconColor,
  buttonText,
  buttonVariant,
  onClick,
}: InventarioCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <div className={`p-2 ${iconColor} rounded-lg`}>
          <MaterialIcon name={icon} className="w-6 h-6" />
        </div>
        <h2 className="ml-3 text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <Button variant={buttonVariant} onClick={onClick} className="w-full">
        {buttonText}
      </Button>
    </div>
  );
}
