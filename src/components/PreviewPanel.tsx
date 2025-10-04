import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Loader as Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PreviewPanelProps {
  files: Array<{ path: string; content: string }>;
}

export const PreviewPanel = ({ files }: PreviewPanelProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webcontainerRef = useRef<WebContainer | null>(null);
  const serverProcessRef = useRef<any>(null);
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
        setPreviewUrl('');

        if (serverProcessRef.current) {
          try {
            serverProcessRef.current.kill();
            serverProcessRef.current = null;
          } catch (e) {
            console.log('Error killing previous process:', e);
          }
        }

        console.log('Mounting files to WebContainer...', files);

        // Build nested directory structure for WebContainer
        const buildFileTree = (files: Array<{ path: string; content: string }>) => {
          const tree: any = {};

          files.forEach(file => {
            const parts = file.path.split('/');
            let current = tree;

            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!current[part]) {
                current[part] = { directory: {} };
              }
              current = current[part].directory;
            }

            const fileName = parts[parts.length - 1];
            current[fileName] = {
              file: {
                contents: file.content
              }
            };
          });

          return tree;
        };

        const fileTree = buildFileTree(files);
        console.log('File tree structure:', fileTree);

        // Mount files
        await webcontainerRef.current!.mount(fileTree);
        console.log('Files mounted successfully');

        // Check if this is a Vite project
        const hasPackageJson = files.some(f => f.path === 'package.json');

        if (hasPackageJson) {
          console.log('Installing dependencies...');
          const installProcess = await webcontainerRef.current!.spawn('npm', ['install']);

          installProcess.output.pipeTo(new WritableStream({
            write(data) {
              console.log('npm install:', data);
            }
          }));

          const installExitCode = await installProcess.exit;

          if (installExitCode !== 0) {
            throw new Error('Failed to install dependencies');
          }

          console.log('Dependencies installed successfully');

          console.log('Starting dev server...');
          const devProcess = await webcontainerRef.current!.spawn('npm', ['run', 'dev']);
          serverProcessRef.current = devProcess;

          webcontainerRef.current!.on('server-ready', (port, url) => {
            console.log('Server ready on', url);
            setPreviewUrl(url);
            setIsLoading(false);
          });

          devProcess.output.pipeTo(new WritableStream({
            write(data) {
              console.log('Dev server:', data);
            }
          }));
        } else {
          // Fallback for simple HTML files
          const indexHtmlFile = files.find(f => f.path === 'index.html' || f.path.endsWith('/index.html'));
          if (indexHtmlFile) {
            console.log('Setting up simple HTTP server...');

            const serverFiles = {
              'server.js': {
                file: {
                  contents: `
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { resolve, extname } from 'path';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];

  try {
    const content = await readFile('.' + filePath, 'utf8');
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

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
            };

            await webcontainerRef.current!.mount(serverFiles);
            const serverProcess = await webcontainerRef.current!.spawn('node', ['server.js']);
            serverProcessRef.current = serverProcess;

            webcontainerRef.current!.on('server-ready', (port, url) => {
              console.log('Server ready on', url);
              setPreviewUrl(url);
              setIsLoading(false);
            });

            serverProcess.output.pipeTo(new WritableStream({
              write(data) {
                console.log('Simple server:', data);
              }
            }));
          }
        }
      } catch (error) {
        console.error('Failed to update preview:', error);
        toast({
          title: 'Preview Error',
          description: error instanceof Error ? error.message : 'Failed to update preview',
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
