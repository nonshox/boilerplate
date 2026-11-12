import type { MetadataRoute } from "next";

/** It's an app, not a marketing site — keep clones out of search indexes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
