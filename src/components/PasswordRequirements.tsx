import { getPasswordRequirements } from "@/lib/passwordPolicy";

interface PasswordRequirementsProps {
  password: string;
  variant?: "light" | "dark";
}

export function PasswordRequirements({ password, variant = "light" }: PasswordRequirementsProps) {
  const requirements = getPasswordRequirements();

  const bgClass = variant === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";
  const textClass = variant === "dark" ? "text-gray-300" : "text-gray-600";
  const labelClass = variant === "dark" ? "text-gray-200" : "text-gray-700";

  return (
    <div className={`border rounded-lg p-4 ${bgClass}`}>
      <p className={`text-xs font-semibold ${labelClass} mb-2`}>Password Requirements:</p>
      <ul className={`text-xs ${textClass} space-y-1`}>
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.key} className={met ? "text-green-600" : ""}>
              ✓ {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
