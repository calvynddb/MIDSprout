import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LEAF_CUT =
  "rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-md rounded-bl-md";
