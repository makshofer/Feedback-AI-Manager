import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  useListFeedbacks, 
  useDeleteFeedback,
  getListFeedbacksQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, ArrowLeft, Plus } from "lucide-react";

export default function HistoryPage() {
  const { data: feedbacks, isLoading } = useListFeedbacks({});
  const deleteMutation = useDeleteFeedback();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListFeedbacksQueryKey() });
      toast({ title: "Запись удалена" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Ошибка удаления", 
        description: "Не удалось удалить запись." 
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Назад
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-serif">История обратной связи</h1>
          <p className="text-muted-foreground mt-1">Просматривайте и редактируйте ранее добавленные записи.</p>
        </div>
        <Link href="/dashboard">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Новая запись
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Загрузка истории...</div>
          ) : !feedbacks || feedbacks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Нет истории записей</h3>
              <p className="text-muted-foreground mb-6">Вы ещё не добавили ни одной записи.</p>
              <Link href="/dashboard">
                <Button variant="outline">Добавить первую запись</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead className="max-w-[300px]">Резюме</TableHead>
                  <TableHead>Оценка</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(item.createdAt), "d MMM yyyy", { locale: ru })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.projectName || "Без проекта"}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {item.summary || item.content}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5">
                        {item.scores?.overall || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'processed' ? 'default' : 'secondary'} className="font-normal">
                        {item.status === 'processed' ? 'Обработано' : 'Черновик'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/dashboard/feedback/${item.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
