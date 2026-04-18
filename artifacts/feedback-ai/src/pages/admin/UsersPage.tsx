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
      toast({ title: "User status updated" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Update failed", 
        description: "Could not update user status." 
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform access and view user activity.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Feedbacks</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                  <TableHead className="text-center">Access</TableHead>
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
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="capitalize font-normal">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-2"></div>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2"></div>
                          Disabled
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.feedbackCount || 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {user.lastSeenAt ? format(new Date(user.lastSeenAt), "MMM d, yyyy") : "Never"}
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
