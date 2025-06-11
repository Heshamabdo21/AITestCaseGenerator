import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const testDataSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  webPortalUrl: z.string().url().optional().or(z.literal("")),
  permissions: z.array(z.string()).default([]),
  additionalData: z.record(z.any()).default({}),
  uploadedFiles: z.array(z.string()).default([])
});

type TestDataFormData = z.infer<typeof testDataSchema>;

export function TestDataPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [newPermission, setNewPermission] = useState("");

  const form = useForm<TestDataFormData>({
    resolver: zodResolver(testDataSchema),
    defaultValues: {
      username: "",
      password: "",
      webPortalUrl: "",
      permissions: [],
      additionalData: {},
      uploadedFiles: []
    }
  });

  const { data: testDataConfig } = useQuery({
    queryKey: ["/api/test-data-config"],
  });

  const saveTestDataMutation = useMutation({
    mutationFn: async (data: TestDataFormData) => {
      return apiRequest(`/api/test-data-config`, {
        method: "POST",
        body: JSON.stringify({ ...data, permissions }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test data configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-data-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestDataFormData) => {
    saveTestDataMutation.mutate(data);
  };

  const addPermission = () => {
    if (newPermission.trim() && !permissions.includes(newPermission.trim())) {
      setPermissions([...permissions, newPermission.trim()]);
      setNewPermission("");
    }
  };

  const removePermission = (permission: string) => {
    setPermissions(permissions.filter(p => p !== permission));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Data Configuration</CardTitle>
        <CardDescription>
          Configure test data that will be included in preconditions for generated test cases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Username</FormLabel>
                    <FormControl>
                      <Input placeholder="test.user@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="test password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="webPortalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Web Portal URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://app.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Required Permissions</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add permission (e.g., admin, user, read-only)"
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPermission())}
                />
                <Button type="button" onClick={addPermission}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {permissions.map((permission) => (
                  <div key={permission} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                    {permission}
                    <button
                      type="button"
                      onClick={() => removePermission(permission)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={saveTestDataMutation.isPending}>
              {saveTestDataMutation.isPending ? "Saving..." : "Save Test Data Configuration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}