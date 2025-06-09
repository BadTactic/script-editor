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

  function handleScriptChange(e) {
    const value = e.target.value;
    setInput(value);
    const parsedLines = value.split("\n").map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

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
            setCharacters(prev => [...prev, character]);
          }
        }
      }

      return { text: trimmed, type, character };
    }).filter(Boolean);

    setLines(parsedLines);
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
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      {/* Character Configuration Section */}
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
        <div style={{ marginTop: '0.5rem' }}>
          {characters.map((char) => (
            <span
              key={char.id}
              style={{
                marginRight: '1rem',
                color: char.color,
                fontWeight: 'bold',
              }}
            >
              {char.name}
            </span>
          ))}
        </div>
      </div>

      {/* Script Editing and Preview Side-by-Side */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h4>Paste Script</h4>
          <textarea
            value={input}
            onChange={handleScriptChange}
            placeholder="Paste or type script here..."
            rows={20}
            style={{ width: '100%', fontSize: '1rem', padding: '0.5rem' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h4>Live Preview</h4>
          <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', minHeight: '500px' }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                {line.type === "stage" ? (
                  <p style={{ fontStyle: 'italic', color: '#555' }}>{line.text}</p>
                ) : (
                  <>
                    <p style={{ fontWeight: 'bold', color: line.character.color }}>{line.character.name}</p>
                    <p>{line.text.replace(line.character.name + ":", "").trim()}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button onClick={downloadRHR} style={{ padding: '0.5rem 2rem', fontSize: '1rem' }}>
          Export .rhr
        </button>
      </div>
    </div>
  );
}