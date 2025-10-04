import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PreviewPanelProps {
  files: Array<{ path: string; content: string }>;
}

export const PreviewPanel = ({ files }: PreviewPanelProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webcontainerRef = useRef<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const initWebContainer = async () => {
      try {
        console.log('Initializing WebContainer...');
        const instance = await WebContainer.boot();
        webcontainerRef.current = instance;
        console.log('WebContainer initialized successfully');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize preview environment',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    initWebContainer();

    return () => {
      webcontainerRef.current?.teardown();
    };
  }, []);

  useEffect(() => {
    if (!webcontainerRef.current || files.length === 0) return;

    const updatePreview = async () => {
      try {
        setIsLoading(true);
        console.log('Mounting files to WebContainer...', files);

        // Create file tree structure
        const fileTree: any = {};
        files.forEach(file => {
          fileTree[file.path] = {
            file: {
              contents: file.content
            }
          };
        });

        // Mount files
        await webcontainerRef.current!.mount(fileTree);
        console.log('Files mounted successfully');

        // Start a simple HTTP server
        const indexHtmlFile = files.find(f => f.path === 'index.html');
        if (indexHtmlFile) {
          // Create a simple server script
          await webcontainerRef.current!.mount({
            'server.js': {
              file: {
                contents: `
                  import { createServer } from 'http';
                  import { readFileSync } from 'fs';
                  
                  const server = createServer((req, res) => {
                    let filePath = req.url === '/' ? '/index.html' : req.url;
                    try {
                      const content = readFileSync('.' + filePath, 'utf8');
                      const ext = filePath.split('.').pop();
                      const contentType = {
                        'html': 'text/html',
                        'css': 'text/css',
                        'js': 'application/javascript',
                      }[ext] || 'text/plain';
                      
                      res.writeHead(200, { 'Content-Type': contentType });
                      res.end(content);
                    } catch (e) {
                      res.writeHead(404);
                      res.end('Not found');
                    }
                  });
                  
                  server.listen(3000, () => {
                    console.log('Server running on port 3000');
                  });
                `
              }
            },
            'package.json': {
              file: {
                contents: JSON.stringify({
                  name: 'preview',
                  type: 'module',
                  dependencies: {}
                })
              }
            }
          });

          const process = await webcontainerRef.current!.spawn('node', ['server.js']);
          
          // Listen for server ready
          webcontainerRef.current!.on('server-ready', (port, url) => {
            console.log('Server ready on', url);
            setPreviewUrl(url);
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error('Failed to update preview:', error);
        toast({
          title: 'Preview Error',
          description: 'Failed to update preview',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    updatePreview();
  }, [files, toast]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Preview</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={!previewUrl || isLoading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          </div>
        )}
        
        {previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No preview available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
