window.builder = [];
window.output = "";

const ItemType = {
  Item: "item",
  Header: "header",
};

function getNewID() {
  return self.crypto.randomUUID().slice(0, 8);
}

function add() {
  window.errors = "";
  let friendly_name = $("#friendly_name").val();
  let data_name = $("#data_name").val();
  let section_name = $("#section_name").val();

  if (section_name === "") {
    section_name = friendly_name;
  }

  if (friendly_name === "" || data_name === "" || section_name === "") {
    window.errors = "missing field";
    render();
    return;
  }



  const next = {
    "type": ItemType.Item,
    "field_name": friendly_name,
    "data_name": data_name,
    "section_name": section_name,
    "id": getNewID(),
  }
  window.builder.push(next);
  cls();
  render();
}

function addHeader() {
  const headerText = $("#header_text").val();

  if (headerText === "") {
    window.errors = "Header text is missing";
    render();
    return;
  }

  const next = {
    "type": ItemType.Header,
    "text": headerText,
    "id": getNewID(),
  }
  window.builder.push(next);
  clsHeader();
  render();
}

function moveUp(index) {
  if (index == 0) { 
    return;
  }

  [window.builder[index], window.builder[index - 1]] = [window.builder[index - 1], window.builder[index]];
  render();  
}

function moveDown(index) {
  if (index + 1 >= window.builder.length) {
    return;
  }

  [window.builder[index], window.builder[index + 1]] = [window.builder[index + 1], window.builder[index]];
  render();  
}

function remove(index) {
  window.builder.splice(index, 1);
  render();
}

function render() {
  if (window.errors && window.errors !== "") {
    $("#errors").css("display", "block").html(window.errors);
  } else {
    $("#errors").css("display", "none");
  }

  let previewOutput = "";
  window.output = "";
  const lb = "{";
  const rb = "}";

  if (window.builder.length > 0) {
    previewOutput = `<dl class="govuk-summary-list">\n`;
    window.output = `<dl class="govuk-summary-list">\n`;

    for (let i = 0; i < window.builder.length; i += 1) {
      const item = window.builder[i];

      if (item.type === ItemType.Item) {
        previewOutput += `  <div class="govuk-summary-list__row">
        <div class="move-buttons">
          <a class="move-link" href="#" data-action="move-up" data-index="${i}" title="Move Up">&#9650;</a>
          <a class="move-link" href="#" data-action="move-down" data-index="${i}" title="Move Down">&#9660;</a>
        </div>
        <dt class="govuk-summary-list__key">
          ${item.field_name}
        </dt>
        <dd class="govuk-summary-list__value">
          ${lb + item.data_name + rb}
        </dd>
        <dd class="govuk-summary-list__actions">
          <a class="govuk-link" href="#" id="change-${item.id.toLowerCase().replaceAll(' ', '-')}">
            Change <span class="govuk-visually-hidden"> ${item.field_name}</span>
          </a>
        </dd>
        <div class="remove-button">
          <a class="remove-link" href="#" data-action="remove" data-index="${i}" title="Remove">&#128465;</a>
        </div>
        </div>\n`;

        window.output += `  <div class="govuk-summary-list__row">
        <dt class="govuk-summary-list__key">
          ${item.field_name}
        </dt>
        <dd class="govuk-summary-list__value">
          ${lb + item.data_name + rb}
        </dd>
        <dd class="govuk-summary-list__actions">
          <a class="govuk-link" href="#" id="change-${item.id.toLowerCase().replaceAll(' ', '-')}">
            Change <span class="govuk-visually-hidden"> ${item.field_name}</span>
          </a>
        </dd>
        </div>\n`;
      } else if (item.type === ItemType.Header) {
        previewOutput += `
        </dl>
        <h2><span class="move-buttons">
          <a class="move-link" href="#" data-action="move-up" data-index="${i}" title="Move Up">&#9650;</a>
          <a class="move-link" href="#" data-action="move-down" data-index="${i}" title="Move Down">&#9660;</a>
        </span>
        ${item.text}
        <div class="remove-button">
          <a class="remove-link" href="#" data-action="remove" data-index="${i}" title="Remove">&#128465;</a>
        </div></h2>
        <dl class="govuk-summary-list">
        \n`;

        window.output += `</dl>
        <h2>${item.text}</h2>
        <dl class="govuk-summary-list">\n`;
      }
    }
    previewOutput += `</dl>\n`;
    window.output += `</dl>\n`;

    previewOutput += `<script>\n`;
    window.output += `<script>\n`;
    for (let i = 0; i < window.builder.length; i += 1) {
      const item = window.builder[i];
      if (item.type === ItemType.Item) {
        const section_name = item.section_name.replaceAll('"', '\\"');
        previewOutput += `  $("#change-${item.id.toLowerCase().replaceAll(' ', '-')}").click(function(event) {
      event.preventDefault();
      $(".sectionsHead")[0].style.display = "block";
      $(".sectionsHead").find("[data-name=\\"${section_name}\\"]").trigger("click");
      $(".sectionsHead").find("[data-name=\\"${section_name}\\"]").trigger("touchstart");
    });\n`;
        window.output += `  $("#change-${item.id.toLowerCase().replaceAll(' ', '-')}").click(function(event) {
      event.preventDefault();
      $(".sectionsHead")[0].style.display = "block";
      $(".sectionsHead").find("[data-name=\\"${section_name}\\"]").trigger("click");
      $(".sectionsHead").find("[data-name=\\"${section_name}\\"]").trigger("touchstart");
    });\n`;
      }
    }
    previewOutput += `</script>`;
    window.output += `</script>`;
  }

  $("#copyme").val(window.output);

  $("#preview").html(previewOutput);

  // Attach event listeners to move up, move down, and remove buttons
  $(".move-link").click(function (event) {
    event.preventDefault();
    const index = $(this).data("index");
    const action = $(this).data("action");
    if (action === "move-up") {
      moveUp(index);
    } else if (action === "move-down") {
      moveDown(index);
    }
  });

  $(".remove-link").click(function (event) {
    event.preventDefault();
    const index = $(this).data("index");
    remove(index);
  });

  if (window.builder.length > 0) {
    const script = document.createElement("script");
    script.innerHTML = previewOutput.match(/<script>([\s\S]*?)<\/script>/)[1];
    $("#preview")[0].appendChild(script);
  }
}

function cls() {
  $("#friendly_name").val("");
  $("#data_name").val("");
  $("#section_name").val("");
}

function clsHeader() {
  $("#header_text").val("");
}
