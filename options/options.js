import { variables } from './../variables.js';

const variablesList = document.getElementById('variables-list');

console.log('Variables:', variables)

variables.forEach(([name, variableName, description]) => {
    const variableItem = document.createElement('li');
    variableItem.className = 'variable-item';

    const variableNameElement = document.createElement('code');
    variableNameElement.textContent = `{{${name}}}`;

    const variableDescriptionElement = document.createElement('span');
    variableDescriptionElement.textContent = ` – ${description}`;

    variableItem.appendChild(variableNameElement);
    variableItem.appendChild(variableDescriptionElement);

    variablesList.appendChild(variableItem);

    const copyTextContent = (code) => {
        code.addEventListener('click', () => {
            const variable = code.textContent;

            //copy the variable to the clipboard
            copyContent(variable);
        });
    };

    variableNameElement.addEventListener('click', () => copyTextContent(variableNameElement));

});

async function copyContent(text) {
    console.log(text)
    try {
        await navigator.clipboard.writeText(text);
        console.log('Content copied to clipboard');
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

// Utility function to get messages from storage
function getMessages(callback) {
    chrome.storage.sync.get({ messages: [] }, (data) => {
        callback(data.messages);
    });
}

// Utility function to save messages to storage
function saveMessages(messages, callback) {
    chrome.storage.sync.set({ messages }, callback);
}


// Render the messages list
function renderMessages() {
    const listDiv = document.getElementById('messagesList');
    listDiv.innerHTML = ''; // Clear current list

    getMessages((messages) => {
        messages.forEach((message, index) => {
            const [title, content] = Array.isArray(message) ? message : [message, message];
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-item';

            const messageTitle = document.createElement('h3');
            messageTitle.textContent = title;

            const messageTitleInput = document.createElement('input');
            messageTitleInput.type = 'text';
            messageTitleInput.className = 'message-title-input';
            messageTitleInput.value = title;
            messageTitleInput.style.display = 'none';

            const messageText = document.createElement('span');
            messageText.textContent = content;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            const messageEditTextarea = document.createElement('textarea');
            messageEditTextarea.value = content;
            messageEditTextarea.style.display = 'none';

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                messageTitle.style.display = 'none';
                messageTitleInput.style.display = 'block';

                messageText.style.display = 'none';
                messageEditTextarea.style.display = 'block';

                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';

                messageEditTextarea.value = content;
                messageEditTextarea.focus();
            });

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.style.display = 'none';
            saveBtn.addEventListener('click', (self) => {
                messageText.style.display = 'block';
                messageEditTextarea.style.display = 'none';
                editBtn.style.display = 'block';
                saveBtn.style.display = 'none';

                const titleContent = messageTitleInput.value.trim();
                const messageContent = messageEditTextarea.value.trim();
                if (messageContent) {
                    messages[index] = [titleContent, messageContent];
                    saveMessages(messages, renderMessages);
                }
            })

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this message?')) {
                    messages.splice(index, 1);
                    saveMessages(messages, renderMessages);
                }
            });

            messageDiv.appendChild(messageTitleInput);
            messageDiv.appendChild(messageTitle);
            messageDiv.appendChild(messageText);
            messageDiv.appendChild(messageEditTextarea);

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(saveBtn);
            actionsDiv.appendChild(deleteBtn);

            messageDiv.appendChild(actionsDiv);
            listDiv.appendChild(messageDiv);
        });
    });
}

// Add new message event
document.getElementById('addMessage')?.addEventListener('click', () => {
    const newMessageInput = document.getElementById('newMessage');
    const newMessageTitle = document.getElementById('newMessageTitle');
    const newMessageContent = newMessageInput?.value?.trim();
    const newTitleContent = newMessageTitle?.value?.trim() || `Template ${new Date().toLocaleString()}`;
    const newMessage = [newTitleContent, newMessageContent];

    console.log('New message:', newMessage);
    console.log('New message content:', newMessageContent);
    console.log('New message title:', newTitleContent);

    if (!newMessageContent) {
        alert('Please enter a message.');
        return;
    }

    // Get current messages, add the new one, then save
    getMessages((messages) => {
        messages.push(newMessage);
        saveMessages(messages, () => {
            newMessageInput.value = '';
            newMessageTitle.value = '';
            renderMessages();
        });
    });
});

// Initialize the page
document.addEventListener('DOMContentLoaded', renderMessages);