import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert React + TypeScript developer. Generate complete, production-ready code using ONLY these technologies:

**REQUIRED STACK:**
- React 18+ (functional components with hooks)
- TypeScript (with proper types and interfaces)
- Vite (as build tool)
- Tailwind CSS (utility-first styling - use Tailwind classes ONLY)
- Lucide React (for all icons - import from 'lucide-react')

**CODING STANDARDS:**
1. Use ONLY functional components with TypeScript
2. Use Tailwind utility classes for ALL styling (NO inline styles, NO style tags)
3. Import icons from 'lucide-react' (e.g., import { Home, User } from 'lucide-react')
4. Include proper TypeScript types and interfaces
5. Use modern React patterns (useState, useEffect, custom hooks)
6. Make fully responsive layouts with Tailwind breakpoints (sm:, md:, lg:, xl:)
7. Use Tailwind color utilities (bg-slate-900, text-white, etc.)

**REQUIRED FILE STRUCTURE:**
1. package.json - MUST include:
   - "type": "module"
   - Scripts: "dev": "vite", "build": "vite build", "preview": "vite preview"
   - Dependencies: react, react-dom, lucide-react
   - DevDependencies: @vitejs/plugin-react, typescript, tailwindcss, autoprefixer, postcss, vite
2. index.html - Entry point with <div id="root"></div>
3. src/main.tsx - React entry (ReactDOM.createRoot)
4. src/App.tsx - Main component
5. Additional .tsx components as needed
6. vite.config.ts - Vite configuration
7. tailwind.config.js - Tailwind configuration
8. postcss.config.js - PostCSS configuration
9. tsconfig.json - TypeScript configuration

**USER REQUEST:** "${prompt}"

**RESPONSE FORMAT (CRITICAL):**
Return ONLY valid JSON with NO markdown, NO code blocks:
{
  "files": [
    {
      "path": "package.json",
      "content": "{\\"name\\":\\"app\\",\\"type\\":\\"module\\",\\"scripts\\":{\\"dev\\":\\"vite\\",\\"build\\":\\"vite build\\",\\"preview\\":\\"vite preview\\"},\\"dependencies\\":{\\"react\\":\\"^18.3.1\\",\\"react-dom\\":\\"^18.3.1\\",\\"lucide-react\\":\\"latest\\"},\\"devDependencies\\":{\\"@vitejs/plugin-react\\":\\"latest\\",\\"typescript\\":\\"latest\\",\\"tailwindcss\\":\\"latest\\",\\"autoprefixer\\":\\"latest\\",\\"postcss\\":\\"latest\\",\\"vite\\":\\"latest\\"}}"
    },
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>\\n<html>\\n<head>\\n<meta charset=\\"UTF-8\\"/>\\n<meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1.0\\"/>\\n<title>App</title>\\n</head>\\n<body>\\n<div id=\\"root\\"></div>\\n<script type=\\"module\\" src=\\"/src/main.tsx\\"></script>\\n</body>\\n</html>"
    },
    {
      "path": "src/main.tsx",
      "content": "import React from 'react'\\nimport ReactDOM from 'react-dom/client'\\nimport App from './App'\\nimport './index.css'\\n\\nReactDOM.createRoot(document.getElementById('root')!).render(<App />)"
    },
    {
      "path": "src/App.tsx",
      "content": "import React from 'react'\\n..."
    },
    {
      "path": "src/index.css",
      "content": "@tailwind base;\\n@tailwind components;\\n@tailwind utilities;"
    },
    {
      "path": "vite.config.ts",
      "content": "import { defineConfig } from 'vite'\\nimport react from '@vitejs/plugin-react'\\n\\nexport default defineConfig({\\n  plugins: [react()]\\n})"
    },
    {
      "path": "tailwind.config.js",
      "content": "export default {\\n  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],\\n  theme: { extend: {} },\\n  plugins: []\\n}"
    },
    {
      "path": "postcss.config.js",
      "content": "export default {\\n  plugins: {\\n    tailwindcss: {},\\n    autoprefixer: {}\\n  }\\n}"
    },
    {
      "path": "tsconfig.json",
      "content": "{\\"compilerOptions\\":{\\"target\\":\\"ES2020\\",\\"useDefineForClassFields\\":true,\\"lib\\":[\\"ES2020\\",\\"DOM\\",\\"DOM.Iterable\\"],\\"module\\":\\"ESNext\\",\\"skipLibCheck\\":true,\\"moduleResolution\\":\\"bundler\\",\\"allowImportingTsExtensions\\":true,\\"resolveJsonModule\\":true,\\"isolatedModules\\":true,\\"noEmit\\":true,\\"jsx\\":\\"react-jsx\\",\\"strict\\":true,\\"noUnusedLocals\\":true,\\"noUnusedParameters\\":true,\\"noFallthroughCasesInSwitch\\":true},\\"include\\":[\\"src\\"]}"
    }
  ],
  "explanation": "Brief description of what was built"
}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');
    
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Clean up the response to extract JSON
    let cleanedText = generatedText.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    // Parse the JSON
    const result = JSON.parse(cleanedText);
    
    console.log('Successfully parsed response');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-code function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});