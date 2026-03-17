import { type ComponentType } from "react";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ClientType } from "../../types";
import Badge from "./Badge";

interface WhoWeServeCardProps {
  client: ClientType;
  reversed?: boolean;
}

type IconName = keyof typeof Icons;

const accentColors: Record<ClientType["badge"], string> = {
  residential: "#3b82f6",
  commercial: "#a855f7",
  agricultural: "#22c55e",
  industrial: "#f97316",
};

export default function WhoWeServeCard({
  client,
  reversed = false,
}: WhoWeServeCardProps) {
  const IconComponent = Icons[client.icon as IconName] as
    | ComponentType<LucideProps>
    | undefined;

  const accentColor = accentColors[client.badge];

  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-10 lg:gap-16 ${
        reversed ? "sm:flex-row-reverse" : ""
      }`}
    >
      {/* Image */}
      <div className="w-full sm:w-2/5 shrink-0 overflow-hidden rounded-2xl shadow-card">
        <img
          src={client.image}
          alt={client.title}
          className="w-full h-64 sm:h-180 object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 w-full sm:w-3/5">
        <Badge variant={client.badge}>{client.title}</Badge>
        <h3
          className="text-navy-900 font-bold text-2xl sm:text-3xl lg:text-5xl leading-snug"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {IconComponent && (
            <IconComponent
              size={36}
              className="inline-block mr-2 mb-1"
              style={{ color: accentColor }}
            />
          )}
          {client.title} Clients
        </h3>
        <p className="text-slate-600 text-base sm:text-xl leading-relaxed">
          {client.description}
        </p>
        {/* Accent underline */}
        <div
          className="w-12 h-1 rounded-full mt-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}
