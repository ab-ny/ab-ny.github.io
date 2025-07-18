// Generate a new change ID
function getNewChangeId() {
  return "change-" + self.crypto.randomUUID().slice(0, 8);
}

function migrate() {
  // Regex patterns
  const SCRIPT_TAG_PATTERN = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const SCRIPT_PATTERN = /\$\("#[^"]*"\)[\s\S]*?\}\);/g;
  const CHANGE_ID_PATTERN_OLD = /#change-[a-z0-9-]+/i;
  const CHANGE_ID_PATTERN_NEW = /#change-[a-f0-9]{8}\b/i;
  const DATA_NAME_PATTERN = /\[data-name=(["'])(.*?)\1\]/g;
  const TRIGGER_CLICK_PATTERN = /\.find\((\"\[data-name=\\\".+?\\\"\]\")\)\.trigger\("click"\)/;

  // Grab HTML elements
  let out = document.getElementById("code_out");
  let input = document.getElementById("code").value;

  input = input.replaceAll("function()", "function(event)"); // Add event param
  input = input.replaceAll(".click();", '.trigger("click");'); // Add trigger to standard click func
  input = input.replaceAll(DATA_NAME_PATTERN, '[data-name=\\"$2\\"]'); // Add double quote and escape slashes to data-names

  const scriptBlocks = [];
  let match;

  // Find and remove all <script> sections
  while ((match = SCRIPT_TAG_PATTERN.exec(input)) !== null) {
    scriptBlocks.push(match[1]);
  }
  input = input.replace(SCRIPT_TAG_PATTERN, "");

  // Process script blocks separately
  const processedScripts = [];

  scriptBlocks.forEach(script => {
    // Separate all scripts up and check if any exist
    const matches = script.match(SCRIPT_PATTERN);
    if (!matches) return;

    // Process scripts separately
    matches.forEach(block => {
      // Split script into lines
      let lines = block.split("\n");

      // Check for the preventDefault call, and add if it doesn't exist
      if (!lines.includes("      event.preventDefault();")) {
        lines.splice(1, 0, "    event.preventDefault();");
      }

      // Check if IDs match pattern (use a GUID), if they don't, make them!!
      if (!CHANGE_ID_PATTERN_NEW.test(lines[0])) {
        const oldIdMatch = lines[0].match(CHANGE_ID_PATTERN_OLD);
        if (oldIdMatch) {
          const oldId = oldIdMatch[0].slice(1);
          const newId = getNewChangeId();

          // Update references in the HTML to the ID
          input = input.replaceAll(oldId, newId);
          lines[0] = lines[0].replace(oldIdMatch[0], `#${newId}`);
        }
      }

      // Check each line and add touchstart trigger if it doesn't exist
      const updatedLines = [];

      lines.forEach(line => {
        updatedLines.push(line);
        const clickMatch = line.match(TRIGGER_CLICK_PATTERN);

        if (clickMatch) {
          const selector = clickMatch[1];
          const touchLine = `    $(".sectionsHead").find(${selector}).trigger("touchstart");`;

          if (!lines.some(line => line.includes(`trigger("touchstart")`) && line.includes(selector))) {
            updatedLines.push(touchLine);
          }
        }
      });

      // Normalise leading whitespace
      const normalisedLines = updatedLines.map((line, index) => {
        const trimmedLine = line.trim();

        if (index === 0) return trimmedLine;
        if (trimmedLine === "});") return "    " + trimmedLine;
        return "      " + trimmedLine;
      });

      // Join all the lines back together
      processedScripts.push(normalisedLines.join("\n"));
    });

    // Throw that beautiful new code back into the input text!
    if (processedScripts.length > 0) {
      input += `<script>\n${processedScripts.join("\n")}\n</script>`;
    }
  });

  // Pat yourself on the back, then return the migrated code
  out.innerHTML = input;
}