import { Brand, Sculpture } from "@/components/brand";
import { ArrowUpRight } from "lucide-react";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-art">
        <Brand />
        <div className="art-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> A LITTLE SPACE FOR YOU
          </span>
          <h2>
            Less noise.
            <br />
            More <span>possibility.</span>
          </h2>
          <p>
            A place to pause, find your focus,
            <br />
            and enjoy a little play.
          </p>
        </div>
        <Sculpture />
        <div className="art-footer">
          <span>MADE FOR A MOMENT OF CALM</span>
          <ArrowUpRight size={17} />
        </div>
      </aside>
      <main id="main" className="auth-main">
        <div className="mobile-brand">
          <Brand />
        </div>
        {children}
        <footer className="auth-footer">
          <span>Thoughtfully simple.</span>
          <span>© {new Date().getFullYear()} Still</span>
        </footer>
      </main>
    </div>
  );
}
