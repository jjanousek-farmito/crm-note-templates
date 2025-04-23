console.log("CMZF Extension: Content script loaded!");
let notesSection, buttonRows, variableValues, templates;

initElements();
initVariables();
loadTemplates();
markNotesTabs();

function markNotesTabs() {
    const noteTabsContainer = document.querySelector("#general ul.nav-tabs");
    const notesTabs = noteTabsContainer.querySelectorAll(".nav-item");
    const notesSections = document.querySelectorAll("#general .tab-pane[id^='notes-']");
    notesTabs.forEach((tab, index) => {
        // if notes section has some notes, mark the tab
        // .table-responsive has some tr in tbody, which is not class="text-center"

        const notesSection = notesSections[index];
        const notes = notesSection.querySelectorAll("tbody tr:has(td:not(.text-center))");
        console.log(notes);

        const notesCount = notes.length;

        // if notes count is greater than 0, mark the tab with fa fa-comment
        // <i class="fa fa-comments" aria-hidden="true"></i>
        if (notesCount > 0) {
            const icon = document.createElement("i");
            icon.classList.add("fa", "fa-comments", "ml-2")
            icon.setAttribute("aria-hidden", "true");
            tab.querySelector("a").appendChild(icon);
        }
    });
}


function replaceVariables(noteString) {
    return noteString.replaceAll(/{{(.+?)}}/g, (match, variable) => {
        const replace = variableValues?.[variable] ?? `{{${variable}}}`;

        return replace
    });
}

async function loadTemplates() {
    await chrome.storage.sync.get("messages", (data) => {
        insertNoteDropdownButtons(data.messages);
    })
}

function initElements() {
    notesSection = document.querySelector("#general .container-fluid");
    if (!notesSection) return console.error("CMZF Extension: Note section not found on the page.");
    buttonRows = notesSection.querySelectorAll("div[id^='notes-'] .col-12:first-of-type");

    if (!notesSection || !buttonRows) {
        console.error("CMZF Extension: Some required elements were not found on the page.");
    }
}

function initVariables() {
    const sellCaseDataTable = document.querySelector(".table.table-striped:first-of-type");

    const increaseElement = document.querySelector(".navyseni-total");
    const priceElement = document.querySelector(".sell-recommendation-total");
    const pricePerSquareMeterElement = document.querySelector(".sell-recommendation-weighted-average");
    //find row where title is contains "Cena s DPH / m" and get the value from the second column
    const pricePerSquareMeterWithTaxElement = Array.from(document.querySelectorAll(".container-fluid table.table.table-striped tr")).find(row => row.querySelector("td:first-of-type")?.textContent?.includes("Cena s DPH"))?.querySelector("td:last-of-type span.badge span");
    const priceWithTaxElement = document.querySelector(".sell-recommendation-total-dph");
    const primaryStateButton = document.querySelector('nav + .container-fluid div div form:first-of-type .btn');


    // Ensure all elements are found before proceeding
    if (!increaseElement || !priceElement || !priceWithTaxElement || !pricePerSquareMeterElement || !pricePerSquareMeterWithTaxElement || !primaryStateButton) {
        console.error("CMZF Extension: Some required elements were not found on the page.");
    }

    // Extract the data we need
    const increasePercentage = parseFloat(increaseElement?.textContent ?? "0")?.toFixed(2)?.replace(".", ",") + "%";
    const price = priceElement?.textContent
    const priceWithTax = priceWithTaxElement?.textContent
    const pricePerSquareMeter = parseFloat(pricePerSquareMeterElement?.textContent ?? "0")?.toFixed(2)?.replace(".", ",") + " Kč/m2";
    const pricePerSquareMeterWithTax = pricePerSquareMeterWithTaxElement?.textContent?.trim()?.replace(".", ",").split(" ")[0] + " Kč/m2";
    let reAdvertIndex = "XXX";
    const area = document.querySelector(".area-total")?.textContent?.trim()?.replace(".", ",");


    const stateButtonText = primaryStateButton?.textContent?.trim()
    const reAdvertButtonIndexMatch = stateButtonText?.match(/R?(\d+)/);
    const buttonReadvertIndex = reAdvertButtonIndexMatch?.[1];
    //get re-advert index from the status text "Reinzerováno 4"
    const status = sellCaseDataTable?.querySelector("tr:first-of-type td:last-of-type")?.textContent?.trim();
    //get the number from the status text "Reinzerováno 4" and increment it by 1, if it's not found, set it to "XXX"
    if (buttonReadvertIndex) {
        //if the button has the re-advert index, use it
        reAdvertIndex = buttonReadvertIndex;

    } else if (status?.includes("Reinzerováno") && status?.match(/(\d+)/)?.[1]) {
        //get the number from the status text "Reinzerováno 4" and increment it by 1, if it's not found, set it to "XXX"
        reAdvertIndex = (parseInt(status.match(/(\d+)/)?.[1] ?? "0") + 1).toString()
    } else {
        console.info("CMZF Extension: Re-advert index not found on the page.");
    }


    // Store the values in an object
    variableValues = {
        "navyseni": increasePercentage,
        "cena": price,
        "cena_dph": priceWithTax,
        "cena_metr": pricePerSquareMeter,
        "cena_metr_dph": pricePerSquareMeterWithTax,
        "reinzerce_index": reAdvertIndex,
        "vymera": area
    };

    return variableValues
}

function insertNoteDropdownButtons(templates) {
    if (!templates || templates.length === 0) {
        console.error("CMZF Extension: No templates were found in the storage.");
        console.info("CMZF Extension: Please add some templates in the extension options. (Right-click the extension icon -> Options)");
        return;
    }

    buttonRows.forEach((buttonRow) => {
        const noteTemplatesDropdown = templateDropdown(templates);
        buttonRow.style.display = "flex";
        buttonRow.style.justifyContent = "space-between";
        buttonRow.appendChild(noteTemplatesDropdown);
    });
}

function appendTemplateToNote(template) {
    let activeNotes = document.querySelector("#general .tab-pane.active.show");
    let visibleNoteTextarea = activeNotes?.querySelector("textarea");
    let noteFormContainer = activeNotes?.querySelector("form.form.notes-new-form.d-none");
    console.log(visibleNoteTextarea);
    console.log(template);

    if (!visibleNoteTextarea) {
        console.error("CMZF Extension: Note textarea not found.");
        return;
    }

    visibleNoteTextarea.value = replaceVariables(template);
    visibleNoteTextarea.dispatchEvent(new Event("input"));

    noteFormContainer?.classList.remove("d-none");
}


function templateDropdown(options) {

    const dropdownItem = (title, content) => {
        const item = document.createElement('button');
        item.className = "dropdown-item";
        item.onclick = () => appendTemplateToNote(content);
        item.innerHTML = `<span class="title">${title}</span>`;
        // <span class="description">${content}</span>
        return item;
    }

    const dropdown = document.createElement('div');
    dropdown.className = "note-templates dropdown";

    const dropdownButton = document.createElement('button');
    dropdownButton.className = "btn btn-secondary dropdown-toggle";
    dropdownButton.type = "button";
    dropdownButton.id = "dropdownMenuButton";
    dropdownButton.setAttribute("data-toggle", "dropdown");
    dropdownButton.setAttribute("aria-haspopup", "true");
    dropdownButton.setAttribute("aria-expanded", "false");
    dropdownButton.textContent = "Šablony";

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = "dropdown-menu dropdown-menu-right";
    if (options)
        options.forEach(([title, content]) => {
            dropdownMenu.appendChild(dropdownItem(title, content));
        });

    dropdown.appendChild(dropdownButton);
    dropdown.appendChild(dropdownMenu);

    return dropdown;
}