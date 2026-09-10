import { RefreshSession } from "@/components/refresh-session";
import { safeDestination } from "@/lib/contracts";
export default async function Session({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main id="main" className="center-page">
      <RefreshSession next={safeDestination((await searchParams).next)} />
    </main>
  );
}
