import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  Star,
  Clock,
  User,
  Zap,
  Shield,
  Database,
  Smartphone,
  Globe,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestCaseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'positive' | 'negative' | 'edge' | 'security' | 'performance' | 'ui' | 'api';
  platform: 'web' | 'mobile' | 'api' | 'all';
  priority: 'high' | 'medium' | 'low';
  objective: string;
  prerequisites: string;
  testSteps: string;
  expectedResult: string;
  tags: string[];
  isStarred: boolean;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

const defaultTemplates: TestCaseTemplate[] = [
  {
    id: "login-positive",
    name: "User Login - Positive Flow",
    description: "Standard positive login test with valid credentials",
    category: "Authentication",
    type: "positive",
    platform: "web",
    priority: "high",
    objective: "Verify that users can successfully log in with valid credentials",
    prerequisites: "- Valid user account exists\n- Application is accessible\n- Network connectivity is available",
    testSteps: "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click 'Login' button\n5. Verify successful login",
    expectedResult: "User is successfully logged in and redirected to dashboard",
    tags: ["authentication", "login", "positive"],
    isStarred: true,
    createdAt: new Date(),
    useCount: 0
  },
  {
    id: "login-negative",
    name: "User Login - Invalid Credentials",
    description: "Negative test case for login with invalid credentials",
    category: "Authentication",
    type: "negative",
    platform: "web",
    priority: "high",
    objective: "Verify that login fails with invalid credentials and appropriate error message is displayed",
    prerequisites: "- Application is accessible\n- Network connectivity is available",
    testSteps: "1. Navigate to login page\n2. Enter invalid username\n3. Enter invalid password\n4. Click 'Login' button\n5. Verify error message",
    expectedResult: "Login fails and appropriate error message is displayed",
    tags: ["authentication", "login", "negative", "security"],
    isStarred: false,
    createdAt: new Date(),
    useCount: 0
  },
  {
    id: "api-get-request",
    name: "API GET Request Validation",
    description: "Standard API GET request test template",
    category: "API Testing",
    type: "positive",
    platform: "api",
    priority: "medium",
    objective: "Verify that API GET request returns correct data and status code",
    prerequisites: "- API endpoint is accessible\n- Valid authentication token (if required)\n- Test data exists in database",
    testSteps: "1. Send GET request to endpoint\n2. Verify response status code\n3. Validate response headers\n4. Verify response body structure\n5. Validate specific data fields",
    expectedResult: "API returns 200 status code with correct data structure and values",
    tags: ["api", "get", "validation"],
    isStarred: false,
    createdAt: new Date(),
    useCount: 0
  },
  {
    id: "mobile-navigation",
    name: "Mobile App Navigation",
    description: "Mobile application navigation flow test",
    category: "Navigation",
    type: "positive",
    platform: "mobile",
    priority: "medium",
    objective: "Verify that mobile app navigation works correctly across different screens",
    prerequisites: "- Mobile app is installed\n- Device has sufficient storage\n- Network connectivity is available",
    testSteps: "1. Launch mobile application\n2. Navigate through main menu items\n3. Test back button functionality\n4. Verify breadcrumbs\n5. Test deep linking",
    expectedResult: "All navigation elements work correctly and user can move between screens smoothly",
    tags: ["mobile", "navigation", "ui"],
    isStarred: false,
    createdAt: new Date(),
    useCount: 0
  }
];

const templateCategories = [
  "Authentication",
  "Navigation",
  "Forms",
  "API Testing",
  "Security",
  "Performance",
  "UI/UX",
  "Data Validation",
  "Integration",
  "Mobile",
  "Custom"
];

const typeIcons = {
  positive: <Zap className="h-4 w-4 text-green-500" />,
  negative: <Shield className="h-4 w-4 text-red-500" />,
  edge: <Settings className="h-4 w-4 text-purple-500" />,
  security: <Shield className="h-4 w-4 text-orange-500" />,
  performance: <Clock className="h-4 w-4 text-blue-500" />,
  ui: <Smartphone className="h-4 w-4 text-indigo-500" />,
  api: <Database className="h-4 w-4 text-gray-500" />
};

const platformIcons = {
  web: <Globe className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  api: <Database className="h-4 w-4" />,
  all: <Settings className="h-4 w-4" />
};

export function TestCaseTemplates() {
  const [templates, setTemplates] = useState<TestCaseTemplate[]>(defaultTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestCaseTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<TestCaseTemplate>>({
    name: "",
    description: "",
    category: "Custom",
    type: "positive",
    platform: "web",
    priority: "medium",
    objective: "",
    prerequisites: "",
    testSteps: "",
    expectedResult: "",
    tags: [],
    isStarred: false
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !template.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }

      if (categoryFilter !== "all" && template.category !== categoryFilter) {
        return false;
      }

      if (typeFilter !== "all" && template.type !== typeFilter) {
        return false;
      }

      if (platformFilter !== "all" && template.platform !== platformFilter && template.platform !== "all") {
        return false;
      }

      if (showStarredOnly && !template.isStarred) {
        return false;
      }

      return true;
    });
  }, [templates, searchTerm, categoryFilter, typeFilter, platformFilter, showStarredOnly]);

  const handleCreateTemplate = () => {
    const template: TestCaseTemplate = {
      ...newTemplate,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      useCount: 0,
      tags: typeof newTemplate.tags === 'string' 
        ? (newTemplate.tags as string).split(',').map(tag => tag.trim()).filter(Boolean)
        : newTemplate.tags || []
    } as TestCaseTemplate;

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: "",
      description: "",
      category: "Custom",
      type: "positive",
      platform: "web",
      priority: "medium",
      objective: "",
      prerequisites: "",
      testSteps: "",
      expectedResult: "",
      tags: [],
      isStarred: false
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Template Created",
      description: `Template "${template.name}" has been created successfully`,
    });
  };

  const handleEditTemplate = () => {
    if (!editingTemplate) return;

    setTemplates(prev => prev.map(template => 
      template.id === editingTemplate.id 
        ? { 
            ...editingTemplate,
            tags: typeof editingTemplate.tags === 'string'
              ? (editingTemplate.tags as any).split(',').map((tag: string) => tag.trim()).filter(Boolean)
              : editingTemplate.tags
          }
        : template
    ));
    setEditingTemplate(null);
    setIsEditDialogOpen(false);

    toast({
      title: "Template Updated",
      description: "Template has been updated successfully",
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "Template has been deleted successfully",
    });
  };

  const handleToggleStar = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isStarred: !template.isStarred }
        : template
    ));
  };

  const handleUseTemplate = (template: TestCaseTemplate) => {
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, useCount: t.useCount + 1, lastUsed: new Date() }
        : t
    ));

    // In a real application, this would create a new test case based on the template
    toast({
      title: "Template Applied",
      description: `Template "${template.name}" has been applied to create a new test case`,
    });
  };

  const handleDuplicateTemplate = (template: TestCaseTemplate) => {
    const duplicatedTemplate: TestCaseTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      useCount: 0,
      lastUsed: undefined,
      isStarred: false
    };

    setTemplates(prev => [...prev, duplicatedTemplate]);
    toast({
      title: "Template Duplicated",
      description: `Template "${duplicatedTemplate.name}" has been created`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Test Case Templates</span>
            <Badge variant="outline" className="ml-2">
              {filteredTemplates.length} of {templates.length}
            </Badge>
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the template"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select 
                      value={newTemplate.type} 
                      onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="edge">Edge Case</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="ui">UI/UX</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select 
                      value={newTemplate.platform} 
                      onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="all">All Platforms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select 
                      value={newTemplate.priority} 
                      onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-objective">Objective</Label>
                  <Textarea
                    id="template-objective"
                    value={newTemplate.objective}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="What is the main goal of this test?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="template-prerequisites">Prerequisites</Label>
                  <Textarea
                    id="template-prerequisites"
                    value={newTemplate.prerequisites}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, prerequisites: e.target.value }))}
                    placeholder="List any setup requirements or preconditions"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="template-steps">Test Steps</Label>
                  <Textarea
                    id="template-steps"
                    value={newTemplate.testSteps}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, testSteps: e.target.value }))}
                    placeholder="Step-by-step instructions for executing the test"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="template-result">Expected Result</Label>
                  <Textarea
                    id="template-result"
                    value={newTemplate.expectedResult}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, expectedResult: e.target.value }))}
                    placeholder="What should happen when the test is executed correctly?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="template-tags">Tags (comma separated)</Label>
                  <Input
                    id="template-tags"
                    value={Array.isArray(newTemplate.tags) ? newTemplate.tags.join(', ') : newTemplate.tags}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., authentication, login, security"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {templateCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="edge">Edge Case</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="ui">UI/UX</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showStarredOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowStarredOnly(!showStarredOnly)}
              >
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleToggleStar(template.id)}
                      >
                        <Star className={`h-4 w-4 ${template.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge className={getPriorityColor(template.priority)}>
                        {template.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {typeIcons[template.type]}
                      <span className="text-xs capitalize">{template.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {platformIcons[template.platform]}
                      <span className="text-xs capitalize">{template.platform}</span>
                    </div>
                  </div>
                  {template.useCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Used {template.useCount}x
                    </Badge>
                  )}
                </div>

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 mr-1"
                  >
                    Use Template
                  </Button>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        setEditingTemplate({...template});
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the template "{template.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Template className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Templates Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || categoryFilter !== "all" || typeFilter !== "all" || platformFilter !== "all" || showStarredOnly
                ? "Try adjusting your filters to find templates."
                : "Create your first template to get started."
              }
            </p>
            {!searchTerm && categoryFilter === "all" && typeFilter === "all" && platformFilter === "all" && !showStarredOnly && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </div>
        )}

        {/* Edit Template Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-template-name">Template Name</Label>
                    <Input
                      id="edit-template-name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-template-category">Category</Label>
                    <Select 
                      value={editingTemplate.category} 
                      onValueChange={(value) => setEditingTemplate(prev => prev ? ({ ...prev, category: value }) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-template-description">Description</Label>
                  <Textarea
                    id="edit-template-description"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select 
                      value={editingTemplate.type} 
                      onValueChange={(value: any) => setEditingTemplate(prev => prev ? ({ ...prev, type: value }) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="edge">Edge Case</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="ui">UI/UX</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select 
                      value={editingTemplate.platform} 
                      onValueChange={(value: any) => setEditingTemplate(prev => prev ? ({ ...prev, platform: value }) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="all">All Platforms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select 
                      value={editingTemplate.priority} 
                      onValueChange={(value: any) => setEditingTemplate(prev => prev ? ({ ...prev, priority: value }) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-template-objective">Objective</Label>
                  <Textarea
                    id="edit-template-objective"
                    value={editingTemplate.objective}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, objective: e.target.value }) : null)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-template-prerequisites">Prerequisites</Label>
                  <Textarea
                    id="edit-template-prerequisites"
                    value={editingTemplate.prerequisites}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, prerequisites: e.target.value }) : null)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-template-steps">Test Steps</Label>
                  <Textarea
                    id="edit-template-steps"
                    value={editingTemplate.testSteps}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, testSteps: e.target.value }) : null)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-template-result">Expected Result</Label>
                  <Textarea
                    id="edit-template-result"
                    value={editingTemplate.expectedResult}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, expectedResult: e.target.value }) : null)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-template-tags">Tags (comma separated)</Label>
                  <Input
                    id="edit-template-tags"
                    value={Array.isArray(editingTemplate.tags) ? editingTemplate.tags.join(', ') : editingTemplate.tags}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, tags: e.target.value as any }) : null)}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditTemplate}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}