import { AuthExperience } from "@/components/interface/auth-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AuthPage() {
  return <AuthExperience />;
}
