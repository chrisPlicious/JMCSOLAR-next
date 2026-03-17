import { type ComponentType } from "react";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { Service } from "../../types";
import Badge from "./Badge";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  service: Service;
}

type IconName = keyof typeof Icons;

export default function ServiceCard({ service }: ServiceCardProps) {
  const IconComponent = Icons[service.icon as IconName] as
    | ComponentType<LucideProps>
    | undefined;

  const icon = IconComponent ? (
    <IconComponent size={26} />
  ) : (
    <span className="font-bold text-lg">☀</span>
  );

  if (service.highlight) {
    return (
      <div className="group relative bg-navy-900 rounded-2xl p-6 flex flex-col gap-4 shadow-card-hover overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-solar-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-14 h-14 bg-solar-500/15 rounded-2xl flex items-center justify-center shrink-0 border border-solar-500/25 text-solar-400">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-2">
            <Badge variant="solar">{service.highlight}</Badge>
          </div>
          <h3
            className="text-white font-bold text-xl mb-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {service.title}
          </h3>
          <p className="text-navy-200 text-sm leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Learn more */}
        <div className="flex items-center gap-1.5 text-solar-400 text-sm font-semibold group-hover:gap-3 transition-all duration-200 mt-auto">
          Learn more <ArrowRight size={14} />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-slate-100 flex flex-col gap-4 overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-solar-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <div className="w-14 h-14 bg-linear-to-br from-solar-400 to-solar-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3
          className="text-navy-900 font-semibold text-lg mb-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {service.title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          {service.description}
        </p>
      </div>

      {/* Learn more */}
      <div className="flex items-center gap-1.5 text-solar-600 text-sm font-semibold group-hover:gap-3 transition-all duration-200 mt-auto">
        Learn more <ArrowRight size={14} />
      </div>
    </div>
  );
}
