import { useState } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Code2 } from 'lucide-react';

interface CodeFile {
  path: string;
  content: string;
}

const Index = () => {
  const [files, setFiles] = useState<CodeFile[]>([]);

  const handleCodeGenerated = (newFiles: CodeFile[]) => {
    setFiles(newFiles);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Web Builder</h1>
            <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
          </div>
        </div>
      </header>

      {/* Main Layout - Three Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel - Left */}
        <div className="w-80 flex-shrink-0">
          <ChatPanel onCodeGenerated={handleCodeGenerated} />
        </div>

        {/* Code Editor - Center */}
        <div className="flex-1 border-r border-border">
          <CodeEditor files={files} />
        </div>

        {/* Preview Panel - Right */}
        <div className="w-[600px] flex-shrink-0">
          <PreviewPanel files={files} />
        </div>
      </div>
    </div>
  );
};

export default Index;
