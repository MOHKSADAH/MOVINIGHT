import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { routing } from "@/i18n/routing";
import { isRtlLocale } from "@/lib/locale";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("appName"),
    description: t("appDescription"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`dark ${chakraPetch.variable} ${ibmPlexMono.variable} ${ibmPlexSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');})()`,
          }}
        />
      </head>
      <body
        className={`${locale === "ar" ? ibmPlexSansArabic.className : chakraPetch.className} antialiased`}
      >
        <ConvexAuthNextjsServerProvider>
          <NextIntlClientProvider messages={messages}>
            <ConvexClientProvider>
              {children}
              <Toaster richColors position="top-right" />
            </ConvexClientProvider>
          </NextIntlClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
