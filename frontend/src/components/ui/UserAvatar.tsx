"use client";

import Image from "next/image";
import { getInitials, randomGradient, cn } from "@/lib/utils";

interface Props {
  user?: { username: string; avatarUrl?: string } | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function UserAvatar({ user, size = "md", className }: Props) {
  if (!user) return null;

  const sizeClass = sizeMap[size];
  const gradient = randomGradient(user.username);

  if (user.avatarUrl && user.avatarUrl.startsWith("http")) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden ring-2 ring-white shadow-md flex-shrink-0",
          sizeClass,
          className
        )}
      >
        <Image
          src={user.avatarUrl}
          alt={user.username}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        `bg-gradient-to-br ${gradient} rounded-full ring-2 ring-white shadow-md
         flex items-center justify-center font-bold text-white flex-shrink-0`,
        sizeClass,
        className
      )}
      title={user.username}
    >
      {getInitials(user.username)}
    </div>
  );
}
