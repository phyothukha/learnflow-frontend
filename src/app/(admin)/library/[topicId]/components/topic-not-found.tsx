import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TopicNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <FolderOpen className="size-8" />
        <p className="text-sm">This topic could not be found.</p>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/library">Open library</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
