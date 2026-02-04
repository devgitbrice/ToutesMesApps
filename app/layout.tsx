import "./globals.css";
import QuickLinks from "./components/QuickLinks";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <QuickLinks />
        {children}
      </body>
    </html>
  );
}
