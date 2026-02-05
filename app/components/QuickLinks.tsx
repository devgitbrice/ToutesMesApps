"use client";

const links = [
  { name: "Claude", href: "https://claude.ai/code" },
  { name: "Vercel", href: "https://vercel.com/bricems-projects" },
  { name: "Github", href: "https://github.com/devgitbrice?tab=repositories" },
  { name: "Gemini", href: "https://gemini.google.com/app?usp=sharing" },
  { name: "ChatGPT", href: "https://www.chatgpt.com" },
];

export default function QuickLinks() {
  return (
    <nav className="fixed top-4 right-4 z-50 flex flex-row items-center gap-4">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
}
