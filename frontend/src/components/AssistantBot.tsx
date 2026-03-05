import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";

interface Message {
  role: "bot" | "user";
  text: string;
}

const TIPS: Record<string, string[]> = {
  select: [
    "Cliquez sur un élément pour le sélectionner. Maintenez Shift pour en sélectionner plusieurs.",
    "Double-cliquez sur un texte pour l'éditer directement sur le canvas.",
    "Utilisez les poignées de transformation pour redimensionner ou faire pivoter un élément.",
  ],
  text: [
    "Cliquez sur le canvas pour placer votre texte à l'endroit voulu.",
    "Après avoir placé le texte, ajustez la police, la taille et la couleur dans la barre du haut.",
    "Essayez une police bold + couleur blanche avec ombre pour un effet Instagram classique !",
  ],
  sticker: [
    "Choisissez un emoji dans le panneau et cliquez pour l'ajouter au canvas.",
    "Les stickers sont des objets comme les autres : déplacez-les et redimensionnez-les librement.",
    "Combinez plusieurs stickers pour un effet layering stylisé.",
  ],
  crop: [
    "Le format 1:1 est idéal pour le feed Instagram carré.",
    "Le format 9:16 est parfait pour les Stories et Reels.",
    "Le format 4:5 est le plus populaire car il prend plus de place dans le feed.",
  ],
};

const FILTER_SUGGESTIONS = [
  "Essayez le filtre Clarendon pour des couleurs plus vibrantes — idéal pour les paysages !",
  "Moon donne un aspect artistique noir & blanc — parfait pour les portraits.",
  "Reyes apporte une ambiance vintage chaleureuse très tendance en ce moment.",
  "Juno est le filtre préféré des food bloggers pour ses couleurs appétissantes.",
];

const GREETINGS = [
  "Bonjour ! Je suis PixelBot, votre assistant créatif. 👋",
  "Commencez par uploader une photo (glisser-déposer ou clic), puis ajoutez du texte et des filtres !",
];

export function AssistantBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: GREETINGS[0] },
    { role: "bot", text: GREETINGS[1] },
  ]);
  const [input, setInput] = useState("");
  const { activeTool, imageLoaded } = useEditorStore();

  function getContextualTip(): string {
    if (!imageLoaded) return "Uploadez d'abord une image PNG ou JPG pour commencer à éditer !";

    const toolTips = TIPS[activeTool] || TIPS.select;
    const allTips = [...toolTips, ...FILTER_SUGGESTIONS];
    return allTips[Math.floor(Math.random() * allTips.length)];
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", text };
    const botReply: Message = { role: "bot", text: processMessage(text) };
    setMessages((m) => [...m, userMsg, botReply]);
    setInput("");
  }

  function processMessage(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes("filtre") || lower.includes("filter"))
      return FILTER_SUGGESTIONS[Math.floor(Math.random() * FILTER_SUGGESTIONS.length)];
    if (lower.includes("texte") || lower.includes("text"))
      return TIPS.text[Math.floor(Math.random() * TIPS.text.length)];
    if (lower.includes("sticker") || lower.includes("emoji"))
      return TIPS.sticker[Math.floor(Math.random() * TIPS.sticker.length)];
    if (lower.includes("format") || lower.includes("ratio") || lower.includes("instagram"))
      return TIPS.crop[Math.floor(Math.random() * TIPS.crop.length)];
    if (lower.includes("exporter") || lower.includes("export") || lower.includes("télécharger"))
      return "Cliquez sur 'Exporter PNG' en haut à droite pour télécharger votre création en haute résolution (2×) !";
    if (lower.includes("sauvegarder") || lower.includes("save"))
      return "Cliquez sur 'Sauvegarder' pour conserver votre projet avec tous ses calques. Retrouvez-le ensuite dans la Galerie.";

    return getContextualTip();
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5 text-white" /> : <MessageCircle className="h-5 w-5 text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex h-80 w-72 flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">PixelBot</p>
              <p className="text-[10px] text-zinc-500">Assistant créatif</p>
            </div>
            <button
              className="ml-auto rounded px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-800"
              onClick={() =>
                setMessages((m) => [...m, { role: "bot", text: getContextualTip() }])
              }
            >
              Conseil
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Posez une question…"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSend}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
