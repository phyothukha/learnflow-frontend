"use client";

import { BookOpen, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchCourses } from "@/store/server/courses/queries";

export default function DashboardPage() {
  const { data } = useFetchCourses({ page: 0, limit: 1 });

  const stats = [
    {
      title: "Total Courses",
      value: data?.["@odata.count"] ?? "—",
      icon: BookOpen,
    },
    { title: "Active Enrollments", value: "—", icon: Users },
    { title: "Completed", value: "—", icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
