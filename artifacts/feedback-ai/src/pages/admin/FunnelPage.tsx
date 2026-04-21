import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

type FunnelStage = {
  status: "requested" | "voice_received" | "transcribed" | "auto_scored" | "confirmed";
  label: string;
  count: number;
};

type FunnelProject = {
  id: number;
  name: string;
};

type FunnelResponse = {
  stages: FunnelStage[];
  conversionRequestedToConfirmed: number;
  projects: FunnelProject[];
};

async function fetchFunnel(projectId?: number): Promise<FunnelResponse> {
  const token = localStorage.getItem("feedbackai_token");
  const url = projectId ? `/api/funnel?projectId=${projectId}` : "/api/funnel";

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to load funnel analytics");
  }

  return response.json();
}

export default function FunnelPage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const projectId = projectFilter === "all" ? undefined : Number(projectFilter);

  const { data, isLoading, error } = useQuery<FunnelResponse>({
    queryKey: ["funnel", projectFilter],
    queryFn: () => fetchFunnel(projectId),
  });

  const maxCount = useMemo(() => {
    if (!data?.stages.length) return 1;
    return Math.max(...data.stages.map((stage) => stage.count), 1);
  }, [data]);

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Аналитика воронки</h1>
          <p className="text-muted-foreground mt-1">
            Отслеживайте путь фидбека от запроса до ручного подтверждения качества.
          </p>
        </div>

        <div className="w-full md:w-[280px] space-y-2">
          <label className="text-sm font-medium">Фильтр по проекту</label>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Все проекты" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все проекты</SelectItem>
              {data?.projects.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[45vh] text-muted-foreground gap-3">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Загрузка воронки...</span>
        </div>
      )}

      {!isLoading && (error || !data) && (
        <div className="flex items-center justify-center min-h-[45vh] text-destructive">
          Не удалось загрузить аналитику воронки.
        </div>
      )}

      {!isLoading && data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Конверсия по воронке</CardTitle>
              <CardDescription>
                Доля фидбеков, дошедших от статуса «запрошено» до «подтверждено вручную».
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm px-3 py-1">{data.conversionRequestedToConfirmed.toFixed(1)}%</Badge>
                <p className="text-sm text-muted-foreground">
                  Конверсия requested → confirmed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Этапы обработки</CardTitle>
              <CardDescription>
                Количество фидбеков на каждом шаге обработки.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.stages.map((stage, index) => {
                const width = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 2);
                return (
                  <div key={stage.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{index + 1}. {stage.label}</span>
                      <span className="text-muted-foreground">{stage.count}</span>
                    </div>
                    <div className="h-9 rounded-md bg-muted/70 overflow-hidden">
                      <div
                        className="h-full bg-primary/80 text-primary-foreground flex items-center px-3 text-xs font-semibold transition-all"
                        style={{ width: `${width}%` }}
                      >
                        {stage.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
