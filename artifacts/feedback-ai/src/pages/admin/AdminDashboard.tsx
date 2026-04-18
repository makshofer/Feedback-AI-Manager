import { useQuery } from "@tanstack/react-query";
import { 
  useGetAdminStats, 
  useGetActivityFeed,
  getGetAdminStatsQueryKey,
  getGetActivityFeedQueryKey
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, Activity, TrendingUp, Star, Clock, Zap, Target } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const { data: activity, isLoading: activityLoading } = useGetActivityFeed({
    query: { queryKey: getGetActivityFeedQueryKey() }
  });

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Обзор платформы</h1>
        <p className="text-muted-foreground mt-1">Ключевые метрики и последняя активность всех пользователей.</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-1"></div>
                <div className="h-3 w-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeUsers} активных в этом месяце
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.feedbacksThisMonth} в этом месяце
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний CSAT (общий)</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(stats.avgOverallScore)}`}>
                  {stats.avgOverallScore?.toFixed(1) || "-"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Из 10
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Уровень активности</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Активные / Все пользователи
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-bold font-serif mb-4">Детализация CSAT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
             <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Качество</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${getScoreColor(stats.avgQualityScore)}`}>
                  {stats.avgQualityScore?.toFixed(1) || "-"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Своевременность</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${getScoreColor(stats.avgTimelinessScore)}`}>
                  {stats.avgTimelinessScore?.toFixed(1) || "-"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Коммуникация</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${getScoreColor(stats.avgCommunicationScore)}`}>
                  {stats.avgCommunicationScore?.toFixed(1) || "-"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Экспертиза</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${getScoreColor(stats.avgExpertiseScore)}`}>
                  {stats.avgExpertiseScore?.toFixed(1) || "-"}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>Последние действия менеджеров</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      {item.type === 'feedback_created' ? <FileText className="h-5 w-5 text-primary" /> : 
                       item.type === 'user_registered' ? <Users className="h-5 w-5 text-primary" /> : 
                       <Activity className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold">{item.userName}</span>{" "}
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "d MMM, HH:mm", { locale: ru })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Нет последней активности.
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Состояние системы</CardTitle>
              <CardDescription>Текущий статус платформы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API-эндпоинты</span>
                <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mr-2"></div>
                  Работает
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Движок анализа ИИ</span>
                <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mr-2"></div>
                  Работает
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Сервис транскрипции</span>
                <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mr-2"></div>
                  Работает
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">База данных</span>
                <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mr-2"></div>
                  Работает
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
