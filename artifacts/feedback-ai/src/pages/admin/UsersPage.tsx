import { useState } from "react";
import { 
  useListUsers, 
  useUpdateUser,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export default function UsersPage() {
  const { data: users, isLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() }
  });
  const updateMutation = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id: userId,
        data: { isActive: !currentActive }
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "Статус пользователя обновлён" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Ошибка обновления", 
        description: "Не удалось обновить статус пользователя." 
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Пользователи</h1>
        <p className="text-muted-foreground mt-1">Управление доступом к платформе и просмотр активности пользователей.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Пользователи не найдены.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Записей</TableHead>
                  <TableHead className="text-right">Последняя активность</TableHead>
                  <TableHead className="text-center">Доступ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="font-normal">
                        {user.role === 'admin' ? 'Администратор' : 'Менеджер'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-2"></div>
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2"></div>
                          Отключён
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.feedbackCount || 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {user.lastSeenAt ? format(new Date(user.lastSeenAt), "d MMM yyyy", { locale: ru }) : "Никогда"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={user.isActive} 
                        onCheckedChange={() => handleToggleActive(user.id, user.isActive)}
                        disabled={updateMutation.isPending || user.role === 'admin'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
