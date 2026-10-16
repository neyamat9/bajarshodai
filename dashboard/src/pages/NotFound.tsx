import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-heading text-6xl font-bold text-primary">404</p>
      <p className="text-sm text-muted-foreground">{tr("We couldn't find that page.")}</p>
      <Button asChild variant="brand">
        <Link to="/">{tr("Back to dashboard")}</Link>
      </Button>
    </div>
  );
}
