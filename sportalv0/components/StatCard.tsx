import React from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  color?: string; // Tailwind color class
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, color = "text-primary" }) => (
  <div className="bg-card rounded-xl shadow p-4 flex flex-col items-center justify-center min-h-[110px]">
    <div className="text-xs font-medium text-muted-foreground mb-1 text-center">{label}</div>
    <div className={`text-2xl sm:text-3xl font-bold mb-1 ${color}`}>{value}</div>
    {subtext && (
      <div className="text-xs text-muted-foreground text-center">{subtext}</div>
    )}
  </div>
);

export default StatCard; 