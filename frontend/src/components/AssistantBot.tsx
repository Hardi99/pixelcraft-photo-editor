import { useState } from "react";
import { Lightbulb, X, Send } from "lucide-react";
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
  "Posez une question sur un outil, ou demandez une autre astuce.",
  "Pour commencer : déposez une photo, ajoutez un texte, puis choisissez un filtre sur la bande du bas.",
];

export function AssistantBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: GREETINGS[0] },
    { role: "bot", text: GREETINGS[1] },
  ]);
  const [input, setInput] = useState("");
  const activeTool = useEditorStore((s) => s.activeTool);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);

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
    <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
      {open && (
        <div
          role="dialog"
          aria-label="Astuces"
          className="flex h-80 w-72 max-w-[calc(100vw-6rem)] flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold">Astuces</p>
              <p className="text-2xs text-dim">Selon l'outil actif</p>
            </div>
            <button
              className="rounded-md px-2 py-1 text-xs text-dim hover:bg-accent hover:text-paper"
              onClick={() => setMessages((m) => [...m, { role: "bot", text: getContextualTip() }])}
            >
              Une autre
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
            {messages.map((msg, i) => (
              <p
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user" ? "self-end bg-paper text-ink" : "self-start bg-ink text-paper/90"
                }`}
              >
                {msg.text}
              </p>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-line p-2"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Votre question"
              placeholder="Filtre, texte, format…"
              className="min-w-0 flex-1 rounded-md border border-line bg-ink px-2.5 py-1.5 text-xs text-paper placeholder:text-dim"
            />
            <Button type="submit" size="icon" className="h-7 w-7 shrink-0" aria-label="Envoyer">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full border border-line bg-panel px-3.5 text-xs font-medium text-paper shadow-lg transition-colors hover:border-paper/30"
      >
        {open ? <X className="h-4 w-4" /> : <Lightbulb className="h-4 w-4 text-safelight" />}
        {open ? "Fermer" : "Astuces"}
      </button>
    </div>
  );
}
