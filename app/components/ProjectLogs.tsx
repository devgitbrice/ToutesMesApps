"use client";

import type { ProjectLog } from "@/lib/projects";

type Props = {
  logs: ProjectLog[];
  onChange: (newLogs: ProjectLog[]) => void;
};

export default function ProjectLogs({ logs = [], onChange }: Props) {
  
  const handleAdd = () => {
    const newLog: ProjectLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content: ""
    };
    // Ajout au début (plus récent en haut)
    onChange([newLog, ...logs]);
  };

  const updateLog = (id: string, newContent: string) => {
    const newLogs = logs.map((log) => 
      log.id === id ? { ...log, content: newContent } : log
    );
    onChange(newLogs);
  };

  const deleteLog = (id: string) => {
    if (confirm("Supprimer ce bloc ?")) {
      onChange(logs.filter((l) => l.id !== id));
    }
  };

  // Gestion des touches : Entrée pour valider, Shift+Entrée pour ligne suivante
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Empêche le saut de ligne
      e.currentTarget.blur(); // "Valide" en sortant du champ
    }
  };

  // Formatage date simple (JJ/MM/AAAA)
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return "..."; }
  };

  return (
    <div className="flex flex-col h-full w-full min-w-[300px] gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
      
      {/* En-tête + Bouton Ajout */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-white/50">SUIVI PROJET</span>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
        >
          + NOTE
        </button>
      </div>

      {/* Liste des Logs */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-center text-white/20 text-xs italic mt-10">Aucun suivi pour le moment</div>
        )}

        {logs.map((log) => (
          <div key={log.id} className="relative group bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-blue-400">{formatDate(log.date)}</span>
              <button 
                onClick={() => deleteLog(log.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:text-red-400 transition-opacity"
              >
                SUPP
              </button>
            </div>
            <textarea
              value={log.content}
              onChange={(e) => updateLog(log.id, e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-gray-300 outline-none resize-none placeholder-white/10 field-sizing-content min-h-[60px]"
              rows={3}
              placeholder="Quoi de neuf aujourd'hui ?"
            />
          </div>
        ))}
      </div>
    </div>
  );
}