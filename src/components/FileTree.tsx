import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: Array<{ path: string; content: string }>;
  activeFile: string;
  onFileSelect: (path: string) => void;
}

const buildFileTree = (files: Array<{ path: string; content: string }>): FileNode[] => {
  const root: FileNode[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');
      
      let existing = currentLevel.find(node => node.name === part);
      
      if (!existing) {
        existing = {
          name: part,
          path,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : []
        };
        currentLevel.push(existing);
      }
      
      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    });
  });
  
  return root;
};

const TreeNode = ({ 
  node, 
  level, 
  activeFile, 
  onFileSelect 
}: { 
  node: FileNode; 
  level: number; 
  activeFile: string; 
  onFileSelect: (path: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = node.type === 'file' && node.path === activeFile;
  
  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-secondary/50 transition-colors ${
          isActive ? 'bg-secondary text-accent' : 'text-muted-foreground'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (node.type === 'file') {
            onFileSelect(node.path);
          } else {
            setIsOpen(!isOpen);
          }
        }}
      >
        {node.type === 'folder' && (
          <span className="flex-shrink-0">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
        {node.type === 'folder' ? (
          <Folder className="h-4 w-4 flex-shrink-0" />
        ) : (
          <File className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree = ({ files, activeFile, onFileSelect }: FileTreeProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileTree = buildFileTree(files);
  
  return (
    <div className="flex flex-col h-full bg-[hsl(var(--file-tree-bg))] border-r border-border">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 bg-secondary border-none text-sm"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="py-1">
          {fileTree.map((node, index) => (
            <TreeNode
              key={`${node.path}-${index}`}
              node={node}
              level={0}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
