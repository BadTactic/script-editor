import { useState } from "react";

function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 60%, 60%)`;
}

export default function ScriptEditor() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [characters, setCharacters] = useState([
    { id: "999", name: "Stage Directions", color: "#888" },
  ]);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterColor, setNewCharacterColor] = useState("#000000");

  function handleAddCharacter() {
    if (!newCharacterName.trim()) return;
    const exists = characters.find(c => c.name === newCharacterName.trim());
    if (exists) return;
    const newChar = {
      id: Date.now().toString(),
      name: newCharacterName.trim(),
      color: newCharacterColor,
    };
    setCharacters([...characters, newChar]);
    setNewCharacterName("");
    setNewCharacterColor("#000000");
  }

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

  function highlightAsStageDirection() {
    if (!input.trim()) return;
    const stageLine = `(${input.trim()})`;
    const stageCharacter = characters.find(c => c.name === "Stage Directions");
    setLines([...lines, { text: stageLine, type: "stage", character: stageCharacter }]);
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

  async function downloadRHR() {
    const { saveAs } = await import("file-saver");

    const chrList = characters.map(c => `      <chr>\n        <chrId>${c.id}</chrId>\n        <shortName>${c.name}</shortName>\n        <color>${parseInt(c.color.replace('#', '0x'), 16)}</color>\n        <chrSelf>false</chrSelf>\n        <ttsVoiceIds/>\n        <voicePitch>800</voicePitch>\n        <voiceSpeed>1100</voiceSpeed>\n        <showRecBtn>false</showRecBtn>\n      </chr>`).join("\n");

    const scrLines = lines.map((l, i) => `    <ln id="${i}" chrId="${l.character.id}">${l.text}</ln>`).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rehearserScript>\n  <rhrFileVersion>4</rhrFileVersion>\n  <scriptId>${Date.now()}</scriptId>\n  <scriptName>Exported Script</scriptName>\n  <languageCode>en</languageCode>\n  <countryCode>US</countryCode>\n  <chrs>\n${chrList}\n  </chrs>\n  <scr>\n${scrLines}\n  </scr>\n</rehearserScript>`;

    const blob = new Blob([xml], { type: "application/xml" });
    saveAs(blob, "script.rhr");
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3>Add Character</h3>
        <input
          type="text"
          placeholder="Character Name"
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="color"
          value={newCharacterColor}
          onChange={(e) => setNewCharacterColor(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <button onClick={handleAddCharacter}>Add Character</button>
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a line of dialogue or stage direction..."
            rows={10}
            style={{ width: '100%', fontSize: '1.1rem' }}
          />
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleAddLine}>Add Line</button>
            <button onClick={highlightAsStageDirection} style={{ marginLeft: '1rem' }}>Make Stage Direction</button>
            <button onClick={downloadTXT} style={{ marginLeft: '1rem' }}>Export .txt</button>
            <button onClick={downloadRHR} style={{ marginLeft: '1rem' }}>Export .rhr</button>
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
                  <p>{line.text.replace(line.character.name + ":", "").trim()}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}