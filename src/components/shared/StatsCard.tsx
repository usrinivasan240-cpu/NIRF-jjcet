import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatsCard({ title, value, icon: Icon }: { title: string; value: any; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold">{value}</p></div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}
