import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import NotificationsPopover from "@/components/NotificationsPopover";
import "../globals.css";


export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <body
        className={`font-sans bg-slate-50 text-slate-900 min-h-screen`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {/* 🔥 Csak asztali nézetben mutasd a csengőt - mobilnézetben a Sidebar-ban van */}
          <div className="hidden lg:block fixed top-4 right-4 z-[100]">
            <NotificationsPopover />
          </div>

          {/* A tartalom itt jelenik meg */}
          {children}

          {/* Prémium Toaster beállítás */}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
