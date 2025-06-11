import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const environmentSchema = z.object({
  operatingSystem: z.enum(["windows", "linux", "mac"]),
  osVersion: z.string().optional(),
  webBrowser: z.enum(["chrome", "firefox", "safari", "edge"]).optional(),
  browserVersion: z.string().optional(),
  mobileDevice: z.enum(["ios", "android"]).optional(),
  mobileVersion: z.string().optional()
});

type EnvironmentFormData = z.infer<typeof environmentSchema>;

export function EnvironmentPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EnvironmentFormData>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      operatingSystem: "windows",
      osVersion: "",
      webBrowser: "chrome",
      browserVersion: "",
      mobileDevice: "ios",
      mobileVersion: ""
    }
  });

  const { data: environmentConfig } = useQuery({
    queryKey: ["/api/environment-config"],
  });

  const saveEnvironmentMutation = useMutation({
    mutationFn: async (data: EnvironmentFormData) => {
      return apiRequest(`/api/environment-config`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Environment configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/environment-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnvironmentFormData) => {
    saveEnvironmentMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Configuration</CardTitle>
        <CardDescription>
          Configure test environments that will be included in preconditions for generated test cases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operatingSystem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating System</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select OS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="linux">Linux</SelectItem>
                        <SelectItem value="mac">macOS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="osVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OS Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Windows 11, Ubuntu 22.04" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="webBrowser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Web Browser</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select browser" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="chrome">Chrome</SelectItem>
                        <SelectItem value="firefox">Firefox</SelectItem>
                        <SelectItem value="safari">Safari</SelectItem>
                        <SelectItem value="edge">Edge</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="browserVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Browser Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 119.0.6045.105" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobileDevice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Device (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mobile platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., iOS 17.1, Android 14" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={saveEnvironmentMutation.isPending}>
              {saveEnvironmentMutation.isPending ? "Saving..." : "Save Environment Configuration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}