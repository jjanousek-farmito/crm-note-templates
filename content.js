console.log("Content script loaded!");
let noteSection, buttonRow, noteTextarea, variableValues, noteFormContainer, templates;

initElements();
initVariables();
loadTemplates();
// insertNoteDropdownButtons();


function replaceVariables(noteString) {
    return noteString.replace(/{{(.*?)}}/g, (match, variable) => {
        return variableValues?.[variable] ?? match;
    });
}
async function loadTemplates() {
    const data = await chrome.storage.sync.get("messages", (data) => {
        insertNoteDropdownButtons(data.messages);
    })

    console.log('Templates:', templates);

}

function initElements() {
    noteSection = document.querySelector("#notes-general");
    buttonRow = document.querySelector("#advert-tabs-content .container-fluid > .row:first-of-type > .col-12:first-of-type");
    noteTextarea = document.querySelector("#note-GENERAL");
    noteFormContainer = document.querySelector(".notes-new-form.d-none");

    if (!noteTextarea || !noteSection || !buttonRow) {
        console.error("Some required elements were not found on the page.");
        return {}
    }

    return { noteTextarea, noteSection, buttonRow }
}

function initVariables() {
    const increaseElement = document.querySelector(".navyseni-total");
    const priceElement = document.querySelector(".sell-recommendation-total");
    const pricePerSquareMeterElement = document.querySelector(".sell-recommendation-weighted-average");
    const priceWTaxElement = document.querySelector(".sell-recommendation-total-dph");
    const primaryStateButton = document.querySelector('nav + .container-fluid div div form:first-of-type .btn');

    // Ensure all elements are found before proceeding
    if (!increaseElement || !priceElement || !noteSection || !buttonRow || !noteTextarea) {
        console.error("Some required elements were not found on the page.");
        return {}
    }

    // Extract the data we need
    const increasePercentage = parseFloat(increaseElement.textContent?.trim()).toFixed(2);
    const priceWithoutTax = parseFloat(priceElement.textContent?.trim()).toFixed(2);
    const priceWithTax = parseFloat(priceWTaxElement?.textContent?.trim()).toFixed(2);
    const pricePerSquareMeter = parseFloat(pricePerSquareMeterElement?.textContent?.trim()).toFixed(2);
    const stateButtonText = parseFloat(primaryStateButton?.textContent?.trim()).toFixed(2);
    let reAdvertIndex = "XXX";
    if (primaryStateButton) {
        //get re-advert index from the button text "pre-advert state R5" || "Another re-advert state 5"
        const reAdvertButtonIndex = stateButtonText?.match(/R?(\d+)/i);
        if (reAdvertButtonIndex?.[1]) reAdvertIndex = reAdvertButtonIndex[1];
    }

    // Store the values in an object
    variableValues = {
        "navyseni": increasePercentage,
        "cena_bez_dph": priceWithoutTax,
        "cena_s_dph": priceWithTax,
        "cena_za_metr": pricePerSquareMeter,
        "reinzerce_inedx": reAdvertIndex
    };

    return variableValues
}

function insertNoteDropdownButtons(templates) {
    if (!templates || templates.length === 0) {
        console.error("No templates were found in the storage.");
        console.info("Please add some templates in the extension options. (Right-click the extension icon -> Options)");
        return;
    }
    const noteTemplatesDropdown = templateDropdown(templates);
    buttonRow.style.display = "flex";
    buttonRow.style.justifyContent = "space-between";
    buttonRow.appendChild(noteTemplatesDropdown);
}

function appendTemplateToNote(template) {
    noteTextarea.value = replaceVariables(template);
    noteTextarea.dispatchEvent(new Event("input"));
    noteFormContainer.classList.remove("d-none");
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
    if(options)
    options.forEach(([title, content]) => {
        dropdownMenu.appendChild(dropdownItem(title, content));
    });

    dropdown.appendChild(dropdownButton);
    dropdown.appendChild(dropdownMenu);

    return dropdown;
}