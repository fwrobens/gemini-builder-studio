import { useState } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Code, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CodeFile {
  path: string;
  content: string;
}

const Index = () => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'design'>('chat');

  const handleCodeGenerated = (newFiles: CodeFile[]) => {
    setFiles(newFiles);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold text-foreground">AI Web Builder</h1>
          </div>
          
          <Tabs value="code" className="w-auto">
            <TabsList className="bg-secondary">
              <TabsTrigger value="code" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Code
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button variant="outline" size="sm" className="h-8">
          Publish
        </Button>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chat/Design */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-border">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                activeTab === 'chat'
                  ? 'text-foreground border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                activeTab === 'design'
                  ? 'text-foreground border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Design
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatPanel onCodeGenerated={handleCodeGenerated} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
                Design panel coming soon
              </div>
            )}
          </div>
        </div>

        {/* Code Editor - Center */}
        <div className="flex-1">
          <CodeEditor files={files} />
        </div>

        {/* Preview Panel - Right */}
        <div className="w-[500px] flex-shrink-0">
          <PreviewPanel files={files} />
        </div>
      </div>
    </div>
  );
};

export default Index;
