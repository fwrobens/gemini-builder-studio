import { useState, useRef, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TerminalProps {
  webcontainer: WebContainer | null;
}

interface TerminalLine {
  type: 'output' | 'input' | 'error';
  content: string;
}

export const Terminal = ({ webcontainer }: TerminalProps) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Terminal ready. Type commands to execute in WebContainer.' }
  ]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const executeCommand = async (command: string) => {
    if (!command.trim() || !webcontainer || isExecuting) return;

    setIsExecuting(true);
    setLines(prev => [...prev, { type: 'input', content: `$ ${command}` }]);
    setInput('');

    try {
      const args = command.split(' ');
      const cmd = args[0];
      const cmdArgs = args.slice(1);

      const process = await webcontainer.spawn(cmd, cmdArgs);

      process.output.pipeTo(new WritableStream({
        write(data) {
          setLines(prev => [...prev, { type: 'output', content: data }]);
        }
      }));

      const exitCode = await process.exit;

      if (exitCode !== 0) {
        setLines(prev => [...prev, {
          type: 'error',
          content: `Command exited with code ${exitCode}`
        }]);
      }
    } catch (error) {
      setLines(prev => [...prev, {
        type: 'error',
        content: error instanceof Error ? error.message : 'Command failed'
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    }
  };

  const clearTerminal = () => {
    setLines([
      { type: 'output', content: 'Terminal cleared.' }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono text-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-green-500" />
          <span className="text-xs font-semibold">Terminal</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearTerminal}
          className="h-6 w-6 text-slate-400 hover:text-slate-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-1">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`${
                line.type === 'input'
                  ? 'text-cyan-400'
                  : line.type === 'error'
                  ? 'text-red-400'
                  : 'text-slate-300'
              }`}
            >
              {line.content}
            </div>
          ))}
          {isExecuting && (
            <div className="text-yellow-400 animate-pulse">
              Executing...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-green-500">$</span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            disabled={!webcontainer || isExecuting}
            className="flex-1 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-green-500"
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {webcontainer
            ? 'Press Enter to execute command'
            : 'Waiting for WebContainer...'}
        </div>
      </div>
    </div>
  );
};
