import { LANGUAGES } from './types';

type GenerateOptions = { language?: string };
type AIResponse = { content: string; isCode: boolean; language: string };

const templates: Record<string, (prompt: string) => string> = {
  Python: (p) => `# Generated based on: ${p}\n\ndef main():\n    print("Hello from generated Python code!")\n    # TODO: Implement: ${p}\n\nif __name__ == "__main__":\n    main()\n`,
  JavaScript: (p) => `// Generated based on: ${p}\n\nfunction main() {\n  console.log("Hello from generated JavaScript code!");\n  // TODO: Implement: ${p}\n}\n\nmain();\n`,
  TypeScript: (p) => `// Generated based on: ${p}\n\ninterface Config { name: string; value: unknown }\n\nfunction main(config: Config): void {\n  console.log(\`Hello, \${config.name}\`);\n  // TODO: Implement: ${p}\n}\n\nmain({ name: "default", value: null });\n`,
  Kotlin: (p) => `// Generated based on: ${p}\n\nfun main() {\n    println("Hello from generated Kotlin code!")\n    // TODO: Implement: ${p}\n}\n`,
  Java: (p) => `// Generated based on: ${p}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from generated Java code!");\n        // TODO: Implement: ${p}\n    }\n}\n`,
  'C++': (p) => `// Generated based on: ${p}\n#include <iostream>\n\nint main() {\n    std::cout << "Hello from generated C++ code!" << std::endl;\n    // TODO: Implement: ${p}\n    return 0;\n}\n`,
  Go: (p) => `// Generated based on: ${p}\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from generated Go code!")\n    // TODO: Implement: ${p}\n}\n`,
  Rust: (p) => `// Generated based on: ${p}\n\nfn main() {\n    println!("Hello from generated Rust code!");\n    // TODO: Implement: ${p}\n}\n`,
  Ruby: (p) => `# Generated based on: ${p}\n\ndef main\n  puts "Hello from generated Ruby code!"\n  # TODO: Implement: ${p}\nend\n\nmain\n`,
  Swift: (p) => `// Generated based on: ${p}\n\nimport Foundation\n\nfunc main() {\n    print("Hello from generated Swift code!")\n    // TODO: Implement: ${p}\n}\n\nmain()\n`,
  PHP: (p) => `<?php\n// Generated based on: ${p}\n\nfunction main() {\n    echo "Hello from generated PHP code!\\n";\n    // TODO: Implement: ${p}\n}\n\nmain();\n`,
  SQL: (p) => `-- Generated based on: ${p}\n\nSELECT * FROM table_name\nWHERE condition = true\nORDER BY created_at DESC;\n\n-- TODO: Implement: ${p}\n`,
  Shell: (p) => `#!/bin/bash\n# Generated based on: ${p}\n\necho "Hello from generated shell script!"\n# TODO: Implement: ${p}\n`,
  HTML: (p) => `<!-- Generated based on: ${p} -->\n<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><title>Generated Page</title></head><body><h1>Hello from generated HTML!</h1></body></html>\n`,
  CSS: (p) => `/* Generated based on: ${p} */\n\n.container { display: flex; align-items: center; justify-content: center; }\n`,
  JSON: (p) => `{"generated":true,"prompt":"${p.replace(/"/g, '\\"')}","data":{}}\n`,
  YAML: (p) => `generated: true\nprompt: "${p}"\ndata: {}\n`,
  Markdown: (p) => `# Generated Document\n\nBased on: ${p}\n\n## Overview\n\nThis is an auto-generated markdown document.\n`,
  'Plain Text': (p) => `Generated based on: ${p}\n\nThis is auto-generated text content.\n`,
};

function detectLanguage(prompt: string): string {
  const value = prompt.toLowerCase();
  if (value.includes('python') || value.includes('.py')) return 'Python';
  if (value.includes('javascript') || value.includes('.js') || value.includes('node')) return 'JavaScript';
  if (value.includes('typescript') || value.includes('.ts')) return 'TypeScript';
  if (value.includes('kotlin') || value.includes('.kt')) return 'Kotlin';
  if (value.includes('java') && !value.includes('javascript')) return 'Java';
  if (value.includes('c++') || value.includes('cpp')) return 'C++';
  if (value.includes('golang') || value.includes(' go ')) return 'Go';
  if (value.includes('rust') || value.includes('.rs')) return 'Rust';
  if (value.includes('ruby') || value.includes('.rb')) return 'Ruby';
  if (value.includes('swift') || value.includes('.swift')) return 'Swift';
  if (value.includes('php')) return 'PHP';
  if (value.includes('sql') || value.includes('query')) return 'SQL';
  if (value.includes('shell') || value.includes('bash') || value.includes('.sh')) return 'Shell';
  if (value.includes('html')) return 'HTML';
  if (value.includes('css')) return 'CSS';
  if (value.includes('json')) return 'JSON';
  if (value.includes('yaml')) return 'YAML';
  if (value.includes('markdown') || value.includes('readme')) return 'Markdown';
  return 'Python';
}

const analysis = "I've analyzed the code and found the following:\n\n1. The function logic appears sound, but there's a potential null reference issue.\n2. Consider adding input validation at the start of the function.\n3. The loop could be optimized with a more efficient data structure.\n\nWould you like me to generate a fix?";
const explanation = "Here's a line-by-line explanation:\n\n1. The function declaration sets up the entry point.\n2. The logic processes input data sequentially.\n3. The return statement sends the result back to the caller.\n4. Error handling catches exceptions.\n\nThis pattern is common in modular code design.";

export function generateAIResponse(prompt: string, options?: GenerateOptions): AIResponse {
  const lower = prompt.toLowerCase();
  const language = options?.language || detectLanguage(prompt);
  if (lower.includes('analyz') || lower.includes('debug') || lower.includes('review') || lower.includes('bug')) return { content: analysis, isCode: false, language };
  if (lower.includes('explain') || lower.includes('how does') || lower.includes('what does')) return { content: explanation, isCode: false, language };
  if (lower.includes('convert') || lower.includes('translate') || lower.includes('port')) return { content: 'The conversion preserves the original logic while adapting syntax, control structures, libraries, and type annotations to the target language.', isCode: false, language };
  if (lower.includes('test') || lower.includes('spec')) return { content: 'Generated test coverage includes normal inputs, edge cases, invalid inputs, exceptions, and integration points.', isCode: false, language };
  if (lower.includes('refactor') || lower.includes('optimize') || lower.includes('improve') || lower.includes('clean')) return { content: 'The refactor extracts repeated logic, simplifies conditions, removes dead code, adds types, and improves naming while preserving behavior.', isCode: false, language };
  return { content: (templates[language] || templates.Python)(prompt), isCode: true, language };
}

export function getLanguageList(): string[] { return LANGUAGES; }
