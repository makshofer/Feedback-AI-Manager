import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { Users, FileText, Star, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

// ── Types ───────────────────────────────────────────────────────────────────

interface Overview {
  totalUsers: number;
  activeUsers: number;
  managersCount: number;
  totalFeedbacks: number;
  processedFeedbacks: number;
  avgOverall: number | null;
  avgQuality: number | null;
  avgTimeliness: number | null;
  avgCommunication: number | null;
  avgExpertise: number | null;
}

interface WeeklyPoint {
  week: string;
  count: number;
  avgOverall: number | null;
  avgQuality: number | null;
  avgTimeliness: number | null;
  avgCommunication: number | null;
  avgExpertise: number | null;
}

interface DistBand { low: number; mid: number; high: number }

interface ScoreDistribution {
  overall: DistBand;
  quality: DistBand;
  timeliness: DistBand;
  communication: DistBand;
  expertise: DistBand;
}

interface ProjectStat {
  projectName: string;
  feedbackCount: number;
  avgOverall: number | null;
  avgQuality: number | null;
  avgTimeliness: number | null;
  avgCommunication: number | null;
  avgExpertise: number | null;
}

interface ManagerStat {
  managerName: string;
  feedbackCount: number;
  avgOverall: number | null;
  lastFeedbackAt: string | null;
}

interface AnalyticsData {
  overview: Overview;
  weeklyTrend: WeeklyPoint[];
  scoreDistribution: ScoreDistribution;
  projectStats: ProjectStat[];
  managerStats: ManagerStat[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const CRITERIA = [
  { key: "avgQuality",       label: "Качество",        color: "#6366f1" },
  { key: "avgTimeliness",    label: "Своевременность",  color: "#f59e0b" },
  { key: "avgCommunication", label: "Коммуникация",     color: "#10b981" },
  { key: "avgExpertise",     label: "Экспертиза",       color: "#8b5cf6" },
  { key: "avgOverall",       label: "Общий",            color: "#ef4444" },
] as const;

function scoreColor(score: number | null) {
  if (score == null) return "text-muted-foreground";
  if (score >= 8) return "text-green-600 dark:text-green-400";
  if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number | null) {
  if (score == null) return "bg-muted";
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-yellow-500";
  return "bg-red-500";
}

function ScoreBar({ score }: { score: number | null }) {
  const pct = score != null ? (score / 10) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${scoreColor(score)}`}>
        {score != null ? score.toFixed(1) : "—"}
      </span>
    </div>
  );
}

function TrendIcon({ value }: { value: number | null }) {
  if (value == null) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (value >= 7.5) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (value >= 5.5) return <Minus className="h-4 w-4 text-yellow-500" />;
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

function KPICard({
  title, value, sub, icon: Icon, highlight
}: {
  title: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ElementType;
  highlight?: "green" | "yellow" | "red";
}) {
  const border = highlight === "green"
    ? "border-green-200 dark:border-green-900"
    : highlight === "yellow"
    ? "border-yellow-200 dark:border-yellow-900"
    : highlight === "red"
    ? "border-red-200 dark:border-red-900"
    : "";
  return (
    <Card className={border}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function fetchAnalytics(): Promise<AnalyticsData> {
  const token = localStorage.getItem("feedbackai_token");
  return fetch("/api/admin/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => {
    if (!r.ok) throw new Error("Failed to load analytics");
    return r.json();
  });
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--card-foreground))",
  fontSize: 12,
};

// ── Main component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Activity className="h-10 w-10 animate-pulse" />
            <p className="text-sm">Загрузка аналитики...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">Не удалось загрузить аналитику.</p>
        </div>
      </AdminLayout>
    );
  }

  const { overview, weeklyTrend, scoreDistribution, projectStats, managerStats } = data;

  // Radar data for criteria comparison
  const radarData = [
    { criterion: "Качество",        value: overview.avgQuality       ?? 0 },
    { criterion: "Своевременность", value: overview.avgTimeliness    ?? 0 },
    { criterion: "Коммуникация",    value: overview.avgCommunication ?? 0 },
    { criterion: "Экспертиза",      value: overview.avgExpertise     ?? 0 },
  ];

  // Distribution stacked bar data
  const distBarData = [
    {
      name: "Общий",
      "1–4 (Низкий)": scoreDistribution.overall.low,
      "5–7 (Средний)": scoreDistribution.overall.mid,
      "8–10 (Высокий)": scoreDistribution.overall.high,
    },
    {
      name: "Качество",
      "1–4 (Низкий)": scoreDistribution.quality.low,
      "5–7 (Средний)": scoreDistribution.quality.mid,
      "8–10 (Высокий)": scoreDistribution.quality.high,
    },
    {
      name: "Своевременность",
      "1–4 (Низкий)": scoreDistribution.timeliness.low,
      "5–7 (Средний)": scoreDistribution.timeliness.mid,
      "8–10 (Высокий)": scoreDistribution.timeliness.high,
    },
    {
      name: "Коммуникация",
      "1–4 (Низкий)": scoreDistribution.communication.low,
      "5–7 (Средний)": scoreDistribution.communication.mid,
      "8–10 (Высокий)": scoreDistribution.communication.high,
    },
    {
      name: "Экспертиза",
      "1–4 (Низкий)": scoreDistribution.expertise.low,
      "5–7 (Средний)": scoreDistribution.expertise.mid,
      "8–10 (Высокий)": scoreDistribution.expertise.high,
    },
  ];

  // Identify weak spots (criteria avg < 6)
  const weakCriteria = [
    { label: "Качество",        val: overview.avgQuality },
    { label: "Своевременность", val: overview.avgTimeliness },
    { label: "Коммуникация",    val: overview.avgCommunication },
    { label: "Экспертиза",      val: overview.avgExpertise },
  ].filter(c => c.val != null && c.val < 6);

  const overallHighlight =
    overview.avgOverall == null ? undefined
    : overview.avgOverall >= 7.5 ? "green" as const
    : overview.avgOverall >= 5.5 ? "yellow" as const
    : "red" as const;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Аналитика удовлетворённости</h1>
        <p className="text-muted-foreground mt-1">
          Комплексная оценка эффективности команды и удовлетворённости клиентов.
        </p>
      </div>

      {/* ── Problem Alerts ─────────────────────────────────────────────────── */}
      {weakCriteria.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          {weakCriteria.map(c => (
            <div key={c.label} className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span><strong>{c.label}</strong> ниже нормы: {c.val?.toFixed(1)}/10</span>
            </div>
          ))}
        </div>
      )}
      {weakCriteria.length === 0 && overview.totalFeedbacks > 0 && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm rounded-lg px-4 py-2 w-fit">
          <CheckCircle className="h-4 w-4" />
          <span>Все показатели в норме. Команда работает хорошо.</span>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <KPICard
          title="Пользователей"
          value={overview.totalUsers}
          sub={`${overview.activeUsers} активных`}
          icon={Users}
        />
        <KPICard
          title="Менеджеров"
          value={overview.managersCount}
          sub="добавляют отзывы"
          icon={Users}
        />
        <KPICard
          title="Всего записей"
          value={overview.totalFeedbacks}
          sub={`${overview.processedFeedbacks} обработано`}
          icon={FileText}
        />
        <KPICard
          title="Средний CSAT"
          value={
            <span className={scoreColor(overview.avgOverall)}>
              {overview.avgOverall != null ? `${overview.avgOverall.toFixed(1)}/10` : "—"}
            </span>
          }
          sub="общая оценка"
          icon={Star}
          highlight={overallHighlight}
        />
        <KPICard
          title="Обработка"
          value={
            overview.totalFeedbacks > 0
              ? `${Math.round((overview.processedFeedbacks / overview.totalFeedbacks) * 100)}%`
              : "—"
          }
          sub="записей с AI-анализом"
          icon={Activity}
        />
      </div>

      {/* ── Criteria Overview + Radar ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Оценки по критериям</CardTitle>
            <CardDescription>Средние значения CSAT по каждому параметру</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {[
              { label: "Качество работы",   val: overview.avgQuality },
              { label: "Своевременность",   val: overview.avgTimeliness },
              { label: "Коммуникация",      val: overview.avgCommunication },
              { label: "Экспертиза команды",val: overview.avgExpertise },
              { label: "Общий CSAT",        val: overview.avgOverall },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{label}</span>
                  <TrendIcon value={val} />
                </div>
                <ScoreBar score={val} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Профиль удовлетворённости</CardTitle>
            <CardDescription>Сравнение критериев на радарной диаграмме</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.totalFeedbacks === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                Недостаточно данных
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                  <PolarGrid stroke="hsl(var(--muted))" />
                  <PolarAngleAxis
                    dataKey="criterion"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickCount={6}
                  />
                  <Radar
                    name="Средний CSAT"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v.toFixed(1)}/10`, "CSAT"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Weekly Trend ────────────────────────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Динамика удовлетворённости по неделям</CardTitle>
          <CardDescription>Изменение средних оценок за последние 12 недель</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyTrend.every(w => w.count === 0) ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              Пока нет данных по неделям
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number | null) => [v != null ? v.toFixed(1) : "—", ""]}
                />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                {CRITERIA.map(c => (
                  <Line
                    key={c.key}
                    type="monotone"
                    dataKey={c.key}
                    name={c.label}
                    stroke={c.color}
                    strokeWidth={c.key === "avgOverall" ? 2.5 : 1.5}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Score Distribution ──────────────────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Распределение оценок</CardTitle>
          <CardDescription>Доля низких (1–4), средних (5–7) и высоких (8–10) оценок по каждому критерию</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.processedFeedbacks === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Нет обработанных записей
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  width={110}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                <Bar dataKey="1–4 (Низкий)"   stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="5–7 (Средний)"  stackId="a" fill="#f59e0b" />
                <Bar dataKey="8–10 (Высокий)" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Project & Manager stats ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Рейтинг проектов</CardTitle>
            <CardDescription>Средние CSAT по всем 5 критериям на проект</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {projectStats.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Нет данных по проектам</div>
            ) : (
              <div className="divide-y">
                {projectStats.map((p, i) => (
                  <div key={p.projectName} className="flex items-start gap-4 px-6 py-4">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : i === projectStats.length - 1 && projectStats.length > 1 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm truncate">{p.projectName}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            {p.feedbackCount} {p.feedbackCount === 1 ? "запись" : "записей"}
                          </Badge>
                          <span className={`text-base font-bold ${scoreColor(p.avgOverall)}`}>
                            {p.avgOverall?.toFixed(1) ?? "—"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                          { label: "Качество",        val: p.avgQuality },
                          { label: "Своевременность", val: p.avgTimeliness },
                          { label: "Коммуникация",    val: p.avgCommunication },
                          { label: "Экспертиза",      val: p.avgExpertise },
                        ].map(({ label, val }) => (
                          <div key={label} className="flex justify-between text-xs text-muted-foreground">
                            <span>{label}</span>
                            <span className={`font-medium ${scoreColor(val)}`}>{val?.toFixed(1) ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Managers */}
        <Card>
          <CardHeader>
            <CardTitle>Активность менеджеров</CardTitle>
            <CardDescription>Количество записей и средний CSAT по менеджерам</CardDescription>
          </CardHeader>
          <CardContent>
            {managerStats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Нет данных по менеджерам</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={managerStats}
                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="managerName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="feedbackCount" name="Кол-во записей" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-3">
                  {managerStats.map((m) => (
                    <div key={m.managerName} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium">{m.managerName}</span>
                        <span className="text-muted-foreground text-xs">({m.feedbackCount} записей)</span>
                      </div>
                      <span className={`font-bold ${scoreColor(m.avgOverall)}`}>
                        {m.avgOverall?.toFixed(1) ?? "—"}/10
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Insights Summary ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Выводы аналитика</CardTitle>
          <CardDescription>Автоматически сформированные наблюдения на основе данных</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overview.totalFeedbacks === 0 && (
              <p className="text-muted-foreground text-sm">Недостаточно данных для формирования выводов.</p>
            )}

            {overview.avgOverall != null && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <Star className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <p className="text-sm">
                  Средняя общая удовлетворённость клиентов составляет{" "}
                  <strong className={scoreColor(overview.avgOverall)}>{overview.avgOverall.toFixed(1)}/10</strong>.{" "}
                  {overview.avgOverall >= 8
                    ? "Команда работает отлично. Клиенты высоко оценивают сотрудничество."
                    : overview.avgOverall >= 6
                    ? "Удовлетворённость на среднем уровне. Есть потенциал для улучшения."
                    : "Уровень удовлетворённости критически низкий. Необходимо срочно принять меры."}
                </p>
              </div>
            )}

            {(() => {
              const criteria = [
                { label: "Качество",        val: overview.avgQuality },
                { label: "Своевременность", val: overview.avgTimeliness },
                { label: "Коммуникация",    val: overview.avgCommunication },
                { label: "Экспертиза",      val: overview.avgExpertise },
              ];
              const sorted = criteria.filter(c => c.val != null).sort((a, b) => (a.val! - b.val!));
              const weakest = sorted[0];
              const strongest = sorted[sorted.length - 1];

              return (
                <>
                  {weakest?.val != null && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                      <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                      <p className="text-sm">
                        Наиболее проблемная область — <strong>{weakest.label}</strong>{" "}
                        ({weakest.val.toFixed(1)}/10). Рекомендуется сфокусироваться на улучшении этого показателя.
                      </p>
                    </div>
                  )}
                  {strongest?.val != null && strongest.label !== weakest?.label && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                      <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                      <p className="text-sm">
                        Сильнейшая сторона команды — <strong>{strongest.label}</strong>{" "}
                        ({strongest.val.toFixed(1)}/10). Это конкурентное преимущество стоит поддерживать.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            {projectStats.length > 1 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <p className="text-sm">
                  Лучший результат среди проектов — <strong>{projectStats[0].projectName}</strong>{" "}
                  ({projectStats[0].avgOverall?.toFixed(1)}/10).{" "}
                  {projectStats[projectStats.length - 1].avgOverall != null &&
                    projectStats[projectStats.length - 1].avgOverall! < 6 && (
                    <>
                      Проект <strong>{projectStats[projectStats.length - 1].projectName}</strong>{" "}
                      требует особого внимания ({projectStats[projectStats.length - 1].avgOverall?.toFixed(1)}/10).
                    </>
                  )}
                </p>
              </div>
            )}

            {overview.processedFeedbacks < overview.totalFeedbacks && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <Activity className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                <p className="text-sm">
                  {overview.totalFeedbacks - overview.processedFeedbacks} из {overview.totalFeedbacks} записей{" "}
                  ещё не обработаны AI-анализом. Попросите менеджеров запустить анализ для получения полных данных.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
