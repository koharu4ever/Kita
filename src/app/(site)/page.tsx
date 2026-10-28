import { pageMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site";
import { HomePage } from "@/features/home/components/home-page";

export const metadata = pageMetadata(
  siteConfig.title,
  siteConfig.description,
  "/",
);

export default function Home() {
  return <HomePage />;
}
