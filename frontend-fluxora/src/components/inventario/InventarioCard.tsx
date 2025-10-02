import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Link from "next/dist/client/link";

interface InventarioCardProps {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  buttonText: string;
  buttonVariant: "primary" | "success" | "warning";
  href: string;
}

export default function InventarioCard({
  title,
  description,
  icon,
  iconColor,
  buttonText,
  buttonVariant,
  href,
}: InventarioCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div className={`p-2 ${iconColor} rounded-lg`}>
          <MaterialIcon name={icon} className="w-6 h-6" />
        </div>
        <h2 className="ml-3 text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600 mb-4 flex-1 line-clamp-2 overflow-hidden">{description}</p>
      <Link href={href}>
        <Button variant={buttonVariant} className="w-full cursor-pointer">
          {buttonText}
        </Button>
      </Link>
    </div>
  );
}
