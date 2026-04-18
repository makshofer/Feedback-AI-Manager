import { Link } from "wouter";
import { format } from "date-fns";
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
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListFeedbacksQueryKey() });
      toast({ title: "Feedback deleted" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Delete failed", 
        description: "Could not delete feedback." 
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to capture
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-serif">Feedback History</h1>
          <p className="text-muted-foreground mt-1">Review and edit your previously submitted feedback.</p>
        </div>
        <Link href="/dashboard">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading history...</div>
          ) : !feedbacks || feedbacks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No feedback history</h3>
              <p className="text-muted-foreground mb-6">You haven't submitted any feedback yet.</p>
              <Link href="/dashboard">
                <Button variant="outline">Submit your first feedback</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="max-w-[300px]">Summary</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.projectName || "No Project"}
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
                      <Badge variant={item.status === 'processed' ? 'default' : 'secondary'} className="capitalize font-normal">
                        {item.status}
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
                              Edit & Review
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
