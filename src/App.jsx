import { useState } from "react";

function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 60%, 60%)`;
}

export default function App() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [characters, setCharacters] = useState([
    { id: "999", name: "Stage Directions", color: "#888" },
  ]);

  function handleAddLine() {
    const trimmed = input.trim();
    if (!trimmed) return;

    let type = "dialogue";
    let character = characters[0];

    if (trimmed.startsWith("::") || trimmed.startsWith("/sd") || trimmed.startsWith("(")) {
      type = "stage";
      character = characters.find(c => c.name === "Stage Directions");
    } else {
      const nameMatch = trimmed.match(/^([A-Z][A-Z0-9 ]+):/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        character = characters.find(c => c.name === name) || {
          id: Date.now().toString(),
          name,
          color: getRandomColor(),
        };
        if (!characters.find(c => c.name === name)) {
          setCharacters([...characters, character]);
        }
      }
    }

    setLines([
      ...lines,
      { text: trimmed, type, character }
    ]);
    setInput("");
  }

  function downloadTXT() {
    const content = lines.map(l => {
      if (l.type === "stage") return `(${l.text})`;
      return `\n\n${l.character.name}\n${l.text.replace(l.character.name + ":", "").trim()}`;
    }).join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <div style={{ flex: 1 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a line of dialogue or stage direction..."
          rows={5}
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleAddLine}>Add Line</button>
          <button onClick={downloadTXT} style={{ marginLeft: '1rem' }}>Export .txt</button>
        </div>
      </div>
      <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '1rem' }}>
        {lines.map((line, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            {line.type === "stage" ? (
              <p style={{ fontStyle: 'italic', color: '#555' }}>({line.text})</p>
            ) : (
              <>
                <p style={{ fontWeight: 'bold', color: line.character.color }}>
                  {line.character.name}
                </p>
                <p>{line.text.replace(`${line.character.name}:`, "").trim()}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
