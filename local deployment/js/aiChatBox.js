document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = document.getElementById('chat-widget');
    const chatWindow = document.getElementById('chat-window');
    const openChatBtn = document.getElementById('open-chat-btn');
    const iconBtn = document.getElementById('open-chat-icon-btn');
    const messagesContainer = document.getElementById('messages');

    function toggleChat() {
        chatWidget.classList.toggle('expanded');
        chatWindow.style.display = chatWidget.classList.contains('expanded') ? 'block' : 'none';
        updateButtonVisibility();
    }

    function closeChat() {
        chatWidget.classList.remove('expanded');
        chatWindow.style.display = 'none';
        updateButtonVisibility();
        messagesContainer.innerHTML = '';

        fetch('/reset_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        .then(response => response.json())  
        
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function updateButtonVisibility() {
        const width = window.innerWidth;
        if (width <= 768) {
            iconBtn.style.display = chatWidget.classList.contains('expanded') ? 'none' : 'block';
            openChatBtn.style.display = 'none';
        } else {
            openChatBtn.style.display = chatWidget.classList.contains('expanded') ? 'none' : 'block';
            iconBtn.style.display = 'none';
        }
    }

    function sendMessage() {
        const inputField = document.getElementById('user-input');
        const userInput = inputField.value;
        inputField.value = ''; // Clear the input field after sending

        // Display user question
        const userMessageElement = document.createElement('div');
        userMessageElement.textContent = `User: ${userInput}`;
        userMessageElement.style.color = 'blue'; // Styling user messages differently, optional
        messagesContainer.appendChild(userMessageElement);

        fetch('/chatbox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userInput }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);  // Check the console for the response
            const aiMessageElement = document.createElement('div');
            aiMessageElement.textContent = `Assistant: ${data.response}`;
            aiMessageElement.style.color = 'green'; // Styling AI messages differently, optional
            messagesContainer.appendChild(aiMessageElement);
        })
        .catch(error => {
            console.error('Error:', error);
            const errorMessageElement = document.createElement('div');
            errorMessageElement.textContent = `Error: Could not retrieve response`;
            errorMessageElement.style.color = 'red';
            messagesContainer.appendChild(errorMessageElement);
        });
    }

    window.addEventListener('resize', updateButtonVisibility);

    // Initial check to set the correct button visibility
    updateButtonVisibility();

    // Attach event listeners to buttons
    openChatBtn.addEventListener('click', toggleChat);
    iconBtn.addEventListener('click', toggleChat);
    document.querySelector('#chat-widget button[onclick="closeChat()"]').addEventListener('click', closeChat);
    document.querySelector('#chat-widget button[onclick="sendMessage()"]').addEventListener('click', sendMessage);
});
