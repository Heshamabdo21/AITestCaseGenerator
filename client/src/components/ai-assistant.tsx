import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Send, 
  Copy, 
  Code, 
  Lightbulb, 
  Minimize2, 
  Maximize2, 
  X,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
  suggestions?: string[];
}

interface CodeBlock {
  language: string;
  code: string;
  explanation?: string;
}

interface AiAssistantProps {
  className?: string;
  context?: string;
  onSuggestionApply?: (code: string) => void;
}

export function AiAssistant({ className, context, onSuggestionApply }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assistantMood, setAssistantMood] = useState<'idle' | 'thinking' | 'excited' | 'helpful'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setAssistantMood('thinking');

    try {
      const response = await fetch('/api/ai-assistant/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: context || '',
          previousMessages: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        codeBlocks: data.codeBlocks || [],
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAssistantMood('helpful');
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "AI Assistant Error",
        description: "Failed to get response from AI assistant. Please check your OpenAI API key configuration.",
        variant: "destructive",
      });
      setAssistantMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Code has been copied to clipboard",
    });
  };

  const applyCode = (code: string) => {
    onSuggestionApply?.(code);
    toast({
      title: "Code Applied",
      description: "Code suggestion has been applied",
    });
  };

  const getAssistantCharacter = () => {
    const characters = {
      idle: { emoji: "🤖", color: "text-blue-500" },
      thinking: { emoji: "🤔", color: "text-yellow-500" },
      excited: { emoji: "✨", color: "text-purple-500" },
      helpful: { emoji: "💡", color: "text-green-500" }
    };
    return characters[assistantMood];
  };

  const character = getAssistantCharacter();

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn("fixed bottom-4 right-4 z-50", className)}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        isMinimized ? "w-80" : "w-96",
        className
      )}
    >
      <Card className="shadow-2xl border-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{
                  rotate: assistantMood === 'thinking' ? 360 : 0,
                  scale: assistantMood === 'excited' ? 1.1 : 1
                }}
                transition={{ duration: 2, repeat: assistantMood === 'thinking' ? Infinity : 0 }}
                className={cn("text-2xl", character.color)}
              >
                {character.emoji}
              </motion.div>
              <div>
                <CardTitle className="text-lg">Code Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {assistantMood === 'thinking' ? 'Thinking...' : 'Ready to help with code suggestions'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-4">
                {/* Messages Area */}
                <ScrollArea className="h-64 w-full border rounded-md p-2">
                  <div className="space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Hi! I'm your code assistant.</p>
                        <p className="text-xs">Ask me for code suggestions, improvements, or explanations!</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.type === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg p-3 text-sm",
                            message.type === 'user'
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Code Blocks */}
                          {message.codeBlocks && message.codeBlocks.map((block, index) => (
                            <div key={index} className="mt-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  <Code className="h-3 w-3 mr-1" />
                                  {block.language}
                                </Badge>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyCode(block.code)}
                                    className="h-6 px-2"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  {onSuggestionApply && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => applyCode(block.code)}
                                      className="h-6 px-2"
                                    >
                                      <Lightbulb className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
                                <code>{block.code}</code>
                              </pre>
                              {block.explanation && (
                                <p className="text-xs text-muted-foreground">{block.explanation}</p>
                              )}
                            </div>
                          ))}

                          {/* Quick Suggestions */}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-medium">Quick suggestions:</p>
                              <div className="flex flex-wrap gap-1">
                                {message.suggestions.map((suggestion, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-accent"
                                    onClick={() => setInput(suggestion)}
                                  >
                                    {suggestion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Bot className="h-4 w-4" />
                            </motion.div>
                            <span>Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <Separator />

                {/* Input Area */}
                <div className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask for code suggestions..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => setInput("How can I improve this test case?")}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Improve test case
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => setInput("Generate test data for this scenario")}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Generate test data
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => setInput("Add error handling to this code")}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Add error handling
                  </Badge>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}