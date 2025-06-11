import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react";
import type { UserStory } from "@shared/schema";

interface UserStoriesTableProps {
  onStoriesSelect?: (stories: UserStory[]) => void;
}

export function UserStoriesTable({ onStoriesSelect }: UserStoriesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStories, setSelectedStories] = useState<number[]>([]);
  const [viewingStory, setViewingStory] = useState<UserStory | null>(null);
  const itemsPerPage = 10;

  // Query for stored user stories
  const { data: userStories = [], isLoading } = useQuery<UserStory[]>({
    queryKey: ['/api/user-stories/stored'],
    retry: false,
  });

  // Calculate pagination
  const totalPages = Math.ceil(userStories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStories = userStories.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStorySelect = (storyId: number) => {
    const newSelected = selectedStories.includes(storyId)
      ? selectedStories.filter(id => id !== storyId)
      : [...selectedStories, storyId];
    
    setSelectedStories(newSelected);
    
    if (onStoriesSelect) {
      const selectedStoriesData = userStories.filter((story: UserStory) => 
        newSelected.includes(story.id)
      );
      onStoriesSelect(selectedStoriesData);
    }
  };

  const handleSelectAll = () => {
    if (selectedStories.length === currentStories.length) {
      setSelectedStories([]);
      onStoriesSelect && onStoriesSelect([]);
    } else {
      const allCurrentIds = currentStories.map((story: UserStory) => story.id);
      setSelectedStories(allCurrentIds);
      onStoriesSelect && onStoriesSelect(currentStories);
    }
  };

  const getPriorityColor = (priority?: string | null) => {
    if (!priority) return "secondary";
    if (priority === "1" || priority.toLowerCase() === "high") return "destructive";
    if (priority === "2" || priority.toLowerCase() === "medium") return "default";
    return "secondary";
  };

  const getPriorityText = (priority?: string | null) => {
    if (!priority) return "Unassigned";
    if (priority === "1" || priority.toLowerCase() === "high") return "High";
    if (priority === "2" || priority.toLowerCase() === "medium") return "Medium";
    if (priority === "3" || priority.toLowerCase() === "low") return "Low";
    return priority;
  };

  const cleanAcceptanceCriteria = (criteria?: string | null) => {
    if (!criteria) return "No acceptance criteria provided";
    return criteria
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userStories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <p>No user stories found. Please fetch user stories from Azure DevOps first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Stories ({userStories.length})</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedStories.length === currentStories.length ? "Deselect All" : "Select All"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedStories.length} selected
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg font-medium text-sm">
            <div className="col-span-1">Select</div>
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Title</div>
            <div className="col-span-3">Acceptance Criteria</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">State</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Rows */}
          {currentStories.map((story: UserStory) => (
            <div key={story.id} className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedStories.includes(story.id)}
                  onChange={() => handleStorySelect(story.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="col-span-1 flex items-center">
                <Badge variant="outline" className="text-xs">
                  {story.azureId}
                </Badge>
              </div>
              <div className="col-span-3 flex items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" title={story.title || undefined}>
                    {story.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={story.description ?? undefined}>
                    {story.description || "No description available"}
                  </p>
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <div className="min-w-0 w-full">
                  <p className="text-xs text-muted-foreground line-clamp-2" title={cleanAcceptanceCriteria(story.acceptanceCriteria)}>
                    {cleanAcceptanceCriteria(story.acceptanceCriteria)}
                  </p>
                </div>
              </div>
              <div className="col-span-1 flex items-center">
                <Badge variant={getPriorityColor(story.priority)}>
                  {getPriorityText(story.priority)}
                </Badge>
              </div>
              <div className="col-span-1 flex items-center">
                <Badge variant="secondary">
                  {story.state || "Unknown"}
                </Badge>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingStory(story)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Badge variant="outline">{story.azureId}</Badge>
                        <span>{story.title}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {story.description ?? "No description provided"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Acceptance Criteria</h4>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {cleanAcceptanceCriteria(story.acceptanceCriteria ?? undefined)}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Priority</h4>
                          <Badge variant={getPriorityColor(story.priority)}>
                            {getPriorityText(story.priority)}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">State</h4>
                          <Badge variant="secondary">
                            {story.state || "Unknown"}
                          </Badge>
                        </div>
                      </div>

                      {story.assignedTo && (
                        <div>
                          <h4 className="font-medium mb-2">Assigned To</h4>
                          <p className="text-sm">{story.assignedTo}</p>
                        </div>
                      )}

                      {story.tags && Array.isArray(story.tags) && story.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {story.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {story.createdDate && (
                        <div>
                          <h4 className="font-medium mb-2">Created Date</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(story.createdDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, userStories.length)} of {userStories.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}