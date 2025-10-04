import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileTree } from './FileTree';

interface CodeFile {
  path: string;
  content: string;
}

interface CodeEditorProps {
  files: CodeFile[];
}

export const CodeEditor = ({ files }: CodeEditorProps) => {
  const [activeFile, setActiveFile] = useState(files[0]?.path || '');

  useEffect(() => {
    if (files.length > 0 && !files.find(f => f.path === activeFile)) {
      setActiveFile(files[0].path);
    }
  }, [files, activeFile]);

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[hsl(var(--editor-bg))] text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">No files yet</p>
          <p className="text-sm">Start a conversation to generate code</p>
        </div>
      </div>
    );
  }

  const currentFile = files.find(f => f.path === activeFile);

  return (
    <div className="flex h-full">
      <div className="w-64 flex-shrink-0">
        <FileTree
          files={files}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
        />
      </div>
      
      <div className="flex-1 flex flex-col bg-[hsl(var(--editor-bg))]">
        <div className="px-4 py-2 border-b border-border flex items-center">
          <span className="text-sm text-muted-foreground">{activeFile}</span>
        </div>
        
        <div className="flex-1">
          {currentFile && (
            <Editor
              height="100%"
              language={getLanguage(currentFile.path)}
              value={currentFile.content}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                readOnly: true,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                padding: { top: 16 },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
