import { 
  useGetCohortAnalysis,
  getGetCohortAnalysisQueryKey
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function CohortPage() {
  const { data: cohortData, isLoading } = useGetCohortAnalysis({
    query: { queryKey: getGetCohortAnalysisQueryKey() }
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Когортный анализ</h1>
        <p className="text-muted-foreground mt-1">Отслеживайте удержание и вовлечённость пользователей с течением времени.</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-6">Конверсия и активность пользователей</h3>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !cohortData || cohortData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Данные когортного анализа пока недоступны.
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cohortData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--card-foreground))'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                    <Bar yAxisId="left" dataKey="registeredUsers" name="Зарегистрировано" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
                    <Bar yAxisId="left" dataKey="activeUsers" name="Активных" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !cohortData || cohortData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Когортные данные не найдены.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Месяц</TableHead>
                    <TableHead className="text-right">Зарегистрировано</TableHead>
                    <TableHead className="text-right">Активных</TableHead>
                    <TableHead className="text-right">Записей</TableHead>
                    <TableHead className="text-right">Конверсия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohortData.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">
                        {row.month}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.registeredUsers}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.activeUsers}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.feedbacksSubmitted}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={row.conversionRate > 50 ? 'text-green-600 dark:text-green-400' : row.conversionRate > 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                          {row.conversionRate.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
