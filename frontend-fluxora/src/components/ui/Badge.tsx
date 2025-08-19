interface BadgeProps {
  variant: "success" | "danger" | "warning" | "info";
  children: React.ReactNode;
}

const variants = {
  success: "bg-green-100 text-green-800 border border-green-200",
  danger: "bg-red-100 text-red-800 border border-red-200",
  warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  info: "bg-blue-100 text-blue-800 border border-blue-200",
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
