'use client';

import { type ComponentType } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ClientType } from "../../types";
import { fadeUp, revealOnScroll } from "@/lib/motion";
import Badge from "./Badge";

interface WhoWeServeCardProps {
  client: ClientType;
  reversed?: boolean;
}

type IconName = keyof typeof Icons;

export default function WhoWeServeCard({
  client,
  reversed = false,
}: WhoWeServeCardProps) {
  const IconComponent = Icons[client.icon as IconName] as
    | ComponentType<LucideProps>
    | undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-10 lg:gap-16 ${
        reversed ? "sm:flex-row-reverse" : ""
      }`}
    >
      {/* Image */}
      <motion.div
        className="w-full sm:w-2/5 shrink-0 overflow-hidden rounded-card shadow-card"
        variants={fadeUp}
        {...revealOnScroll}
      >
        <img
          src={client.image}
          alt={client.title}
          className="w-full aspect-[4/3] object-cover"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex flex-col items-start gap-4 w-full sm:w-3/5"
        variants={fadeUp}
        {...revealOnScroll}
      >
        <Badge variant={client.badge}>{client.title}</Badge>
        <h3 className="text-h3 text-fg flex items-center gap-3">
          {IconComponent && (
            <IconComponent className="size-7 shrink-0 text-navy-700" aria-hidden />
          )}
          {client.title} Clients
        </h3>
        <p className="text-lead text-fg-muted">{client.description}</p>
      </motion.div>
    </div>
  );
}
