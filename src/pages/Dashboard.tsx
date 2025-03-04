
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Search, User, FileText, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Mock data for prompts
const mockPrompts = [
  {
    id: 1,
    title: "Creative Blog Post Ideas",
    category: "Content Creation",
    prompt: "Generate 10 unique blog post ideas about [topic] that would appeal to [target audience]. Include potential headline variations and key points to cover for each idea.",
  },
  {
    id: 2,
    title: "Product Description Enhancement",
    category: "E-commerce",
    prompt: "Rewrite the following product description to be more compelling and emotionally engaging while highlighting these key features: [list of features]. Target audience is [audience details].",
  },
  {
    id: 3,
    title: "Email Sequence Creator",
    category: "Marketing",
    prompt: "Create a 5-email nurture sequence for new subscribers interested in [product/service]. Each email should focus on a different benefit, include a compelling subject line, and have a clear call-to-action.",
  },
  {
    id: 4,
    title: "Social Media Campaign",
    category: "Social Media",
    prompt: "Develop a 2-week social media campaign for [platform] that promotes [product/service]. Include post concepts, hashtags, best posting times, and engagement strategies.",
  },
  {
    id: 5,
    title: "SEO Title & Meta Description",
    category: "SEO",
    prompt: "Generate 5 SEO-optimized title tags and meta descriptions for a webpage about [topic]. Include these keywords: [keywords]. Each title should be under 60 characters and meta descriptions under 155 characters.",
  },
];

// Mock data for categories
const categories = ["All", "Content Creation", "E-commerce", "Marketing", "Social Media", "SEO"];

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [copied, setCopied] = useState<number | null>(null);

  const filteredPrompts = mockPrompts.filter((prompt) => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || prompt.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the prompt in your AI tool.",
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    // This is a placeholder for actual logout logic
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card border-r border-border fixed h-full">
        <div className="px-6 py-6">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-brand-blue">bits & bytes</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">AI</span>
          </a>
        </div>
        <Separator />
        <nav className="flex-1 p-6 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Prompts
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Account
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
        <div className="p-6">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-10">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">AI Prompts Library</h1>
            <div className="flex items-center space-x-2">
              <div className="md:hidden">
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout} className="hidden md:flex">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search prompts..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge 
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary">{prompt.category}</Badge>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(prompt.id, prompt.prompt)}
                      className="h-8 w-8"
                    >
                      {copied === prompt.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">{prompt.prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No prompts found matching your search criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
