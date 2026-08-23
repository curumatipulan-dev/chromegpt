export type ServiceType = 'github' | 'gmail' | 'drive' | 'dropbox' | 'local';

export type ServiceInfo = {
  name: ServiceType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
};

export const SERVICES: ServiceInfo[] = [
  {
    name: 'github',
    label: 'GitHub',
    description: 'Push files, create PRs, manage repos',
    color: '#ffffff',
    bgColor: '#24292f',
  },
  {
    name: 'gmail',
    label: 'Gmail',
    description: 'Send and receive code via email',
    color: '#ffffff',
    bgColor: '#ea4335',
  },
  {
    name: 'drive',
    label: 'Google Drive',
    description: 'Store and sync project files',
    color: '#ffffff',
    bgColor: '#1fa463',
  },
  {
    name: 'dropbox',
    label: 'Dropbox',
    description: 'Backup and share files',
    color: '#ffffff',
    bgColor: '#0061ff',
  },
  {
    name: 'local',
    label: 'Local Storage',
    description: 'Internal storage, SD card, Downloads',
    color: '#ffffff',
    bgColor: '#475569',
  },
];

export const LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Kotlin',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Ruby',
  'Swift',
  'PHP',
  'SQL',
  'Shell',
  'HTML',
  'CSS',
  'JSON',
  'YAML',
  'Markdown',
  'Plain Text',
];

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    py: 'Python',
    js: 'JavaScript',
    jsx: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    kt: 'Kotlin',
    kts: 'Kotlin',
    java: 'Java',
    cpp: 'C++',
    cc: 'C++',
    cxx: 'C++',
    h: 'C++',
    hpp: 'C++',
    go: 'Go',
    rs: 'Rust',
    rb: 'Ruby',
    swift: 'Swift',
    php: 'PHP',
    sql: 'SQL',
    sh: 'Shell',
    bash: 'Shell',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    txt: 'Plain Text',
  };
  return map[ext] || 'Plain Text';
}
