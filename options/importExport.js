import { getMessages, saveMessages, renderMessages } from './options.js';

const exportDialog = document.getElementById('exportDialog')
const importDialog = document.getElementById('importDialog')

// Modal functions to open and close the modal dialog for import/export
const openModal = (modal) => (e) => {e.preventDefault(); modal?.showModal();}
const closeModal = (modal) => (e) => {e.preventDefault(); modal?.close();}

function exportMessages(e) {
    e.preventDefault();
    console.log('Exporting messages...');
    console.log(e);

    getMessages((messages) => {
        const exportTextarea = document.getElementById('exportTextarea');
        exportTextarea.value = JSON.stringify(messages, null, 2);
    });
}

function importMessages(e) {
    e.preventDefault();
    console.log('Importing messages...');
    console.log(e);

    const importTextarea = document.getElementById('importTextarea');
    const importValue = importTextarea.value.trim();
    if (!importValue) {
        alert('Please enter the JSON data to import.');
        return;
    }

    try {
        const messages = JSON.parse(importValue);
        saveMessages(messages, () => {
            importTextarea.value = '';
            renderMessages();
        });
    } catch (error) {
        alert('Invalid JSON data. Please enter a valid JSON array.');
    }
}

document.getElementById('import')?.addEventListener('click', openModal(importDialog));
document.getElementById('export')?.addEventListener('click', openModal(exportDialog));

document.getElementById('importCancel')?.addEventListener('click', closeModal(importDialog));
document.getElementById('exportCancel')?.addEventListener('click', closeModal(exportDialog));

document.getElementById('importSubmit')?.addEventListener('click', importMessages);
document.getElementById('exportSubmit')?.addEventListener('click', exportMessages);

