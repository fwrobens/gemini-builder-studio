import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileCode, FileText } from 'lucide-react';

interface CodeFile {
  path: string;
  content: string;
}

interface CodeEditorProps {
  files: CodeFile[];
}

export const CodeEditor = ({ files }: CodeEditorProps) => {
  const [activeFile, setActiveFile] = useState(files[0]?.path || '');

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <FileText className="h-4 w-4" />;
    return <FileCode className="h-4 w-4" />;
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[hsl(var(--editor-bg))] text-muted-foreground">
        <p>No files yet. Start a conversation to generate code!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--editor-bg))]">
      <div className="border-b border-border">
        <Tabs value={activeFile} onValueChange={setActiveFile}>
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0">
              {files.map((file) => (
                <TabsTrigger
                  key={file.path}
                  value={file.path}
                  className="rounded-none border-r border-border data-[state=active]:bg-[hsl(var(--editor-bg))] data-[state=active]:border-b-2 data-[state=active]:border-b-primary"
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    {getFileIcon(file.path)}
                    <span className="text-sm">{file.path}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {files.map((file) => (
          <div
            key={file.path}
            className={activeFile === file.path ? 'h-full' : 'hidden'}
          >
            <Editor
              height="100%"
              language={getLanguage(file.path)}
              value={file.content}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                readOnly: true,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
