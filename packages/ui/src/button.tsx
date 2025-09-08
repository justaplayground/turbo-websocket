interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = ({ 
  children, 
  variant = "default", 
  size = "md",
  className = "", 
  disabled = false,
  ...rest 
}: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variantClasses = {
    default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 hover:shadow-xl",
    outline: "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm hover:shadow-md",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
    success: "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:from-green-700 hover:to-green-800 focus:ring-green-500 hover:shadow-xl",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 focus:ring-red-500 hover:shadow-xl"
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return <button className={classes} disabled={disabled} {...rest}>{children}</button>;
};
