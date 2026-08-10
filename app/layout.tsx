import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MOVINIGHT",
  description: "Track movies with your crew",
};

/** Root layout — html/body live in `[locale]/layout`. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
