import { ButtonHTMLAttributes, ReactNode } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  icon?: string;
  children: ReactNode;
}

const variants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  warning: "bg-orange-600 hover:bg-orange-700 text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = variants[variant];
  const sizeClasses = sizes[size];

  const allClasses =
    `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();

  return (
    <button className={allClasses} {...props}>
      {icon && <MaterialIcon name={icon} className="w-4 h-4" />}
      {children}
    </button>
  );
}
