import { Brand } from "@/components/brand";
import { Navigation } from "@/components/navigation";
import { LogoutButton } from "@/components/forms";
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <Navigation />
        <LogoutButton />
      </header>
      <main id="main" className="app-main">
        {children}
      </main>
      <footer className="app-footer">
        <span>A little less noise. A little more you.</span>
        <span>STILL / TAKE YOUR TIME</span>
      </footer>
    </div>
  );
}
