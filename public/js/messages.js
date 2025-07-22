document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const conversationsList = document.getElementById('conversations-list');
    const messagesList = document.getElementById('messages-list');
    const conversationHeader = document.getElementById('conversation-header');
    const messageComposer = document.getElementById('message-composer');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const newMessageBtn = document.getElementById('new-message-btn');
    const newMessageModal = document.getElementById('new-message-modal');
    const modalClose = document.querySelector('.modal-close');
    const recipientSelect = document.getElementById('recipient-select');
    const newMessageContent = document.getElementById('new-message-content');
    const sendNewMessageBtn = document.getElementById('send-new-message-btn');

    let currentConversation = null;

    // Load conversations and messages
    async function loadMessages() {
        try {
            const response = await fetch('/api/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const messages = await response.json();
            renderConversations(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
            showError('Failed to load messages');
        }
    }

    // Load users for new message
    async function loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const users = await response.json();
            populateRecipientSelect(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Render conversations list
    function renderConversations(messages) {
        if (messages.length === 0) {
            conversationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        // Group messages by conversation
        const conversations = {};
        messages.forEach(message => {
            const otherUserId = message.sender._id === currentUser._id ? 
                message.receiver?._id : message.sender._id;
            const key = otherUserId || 'admin';

            if (!conversations[key]) {
                conversations[key] = {
                    user: message.sender._id === currentUser._id ? 
                        message.receiver : message.sender,
                    messages: [],
                    unread: 0
                };
            }

            conversations[key].messages.push(message);
            if (!message.isRead && message.receiver?._id === currentUser._id) {
                conversations[key].unread++;
            }
        });

        conversationsList.innerHTML = Object.values(conversations).map(conv => `
            <div class="conversation-item" data-user-id="${conv.user?._id || 'admin'}">
                <div class="conversation-avatar">
                    ${conv.user ? 
                        `<img src="${conv.user.profilePic}" alt="${conv.user.username}">` : 
                        `<i class="fas fa-headset"></i>`}
                </div>
                <div class="conversation-info">
                    <h4>${conv.user?.username || 'Admin Support'}</h4>
                    <p class="last-message">${conv.messages[0].content.substring(0, 30)}...</p>
                </div>
                ${conv.unread > 0 ? `
                    <div class="unread-count">
                        ${conv.unread}
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Add click event to conversation items
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.getAttribute('data-user-id');
                openConversation(userId, conversations[userId].user);
            });
        });
    }

    // Open conversation
    function openConversation(userId, user) {
        currentConversation = userId;
        
        // Update header
        conversationHeader.innerHTML = `
            <div class="conversation-avatar">
                ${user ? 
                    `<img src="${user.profilePic}" alt="${user.username}">` : 
                    `<i class="fas fa-headset"></i>`}
            </div>
            <div class="conversation-info">
                <h4>${user?.username || 'Admin Support'}</h4>
                <p class="status">${user ? 'User' : 'Admin'}</p>
            </div>
        `;

        // Load conversation messages
        loadConversationMessages(userId);
        messageComposer.style.display = 'flex';
    }

    // Load messages for a specific conversation
    async function loadConversationMessages(userId) {
        try {
            const response = await fetch(`/api/messages?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const messages = await response.json();
            renderMessages(messages);

            // Mark as read
            if (messages.length > 0) {
                await fetch(`/api/messages/${messages[0]._id}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Error loading conversation messages:', error);
        }
    }

    // Render messages
    function renderMessages(messages) {
        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-alt"></i>
                    <p>No messages yet</p>
                </div>
            `;
            return;
        }

        messagesList.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender._id === currentUser._id ? 'sent' : 'received'}">
                <div class="message-avatar">
                    ${msg.sender._id === currentUser._id ? 
                        `<img src="${currentUser.profilePic}" alt="${currentUser.username}">` : 
                        msg.sender.profilePic ? 
                            `<img src="${msg.sender.profilePic}" alt="${msg.sender.username}">` : 
                            `<i class="fas fa-user"></i>`}
                </div>
                <div class="message-content">
                    <p>${msg.content}</p>
                    <span class="message-time">
                        ${new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        `).join('');

        // Scroll to bottom
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Populate recipient select
    function populateRecipientSelect(users) {
        recipientSelect.innerHTML = `
            <option value="">Select a user</option>
            <option value="admin">Admin Support</option>
            ${users.map(user => `
                <option value="${user._id}">${user.username}</option>
            `).join('')}
        `;
    }

    // Event listeners
    newMessageBtn.addEventListener('click', () => {
        newMessageModal.style.display = 'flex';
        loadUsers();
    });

    modalClose.addEventListener('click', () => {
        newMessageModal.style.display = 'none';
    });

    sendMessageBtn.addEventListener('click', async () => {
        const content = messageInput.value.trim();
        if (!content || !currentConversation) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    receiverId: currentConversation === 'admin' ? null : currentConversation
                })
            });

            const message = await response.json();
            if (!response.ok) throw new Error('Failed to send message');

            messageInput.value = '';
            loadMessages(); // Refresh conversations
            loadConversationMessages(currentConversation); // Refresh current conversation
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    sendNewMessageBtn.addEventListener('click', async () => {
        const recipientId = recipientSelect.value;
        const content = newMessageContent.value.trim();

        if (!recipientId || !content) {
            showDialog('Error', 'Please select a recipient and enter a message', 'error');
            return;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    receiverId: recipientId === 'admin' ? null : recipientId
                })
            });

            const message = await response.json();
            if (!response.ok) throw new Error('Failed to send message');

            newMessageContent.value = '';
            newMessageModal.style.display = 'none';
            loadMessages(); // Refresh conversations
            
            // Open the new conversation
            openConversation(recipientId === 'admin' ? 'admin' : recipientId, 
                recipientId === 'admin' ? null : users.find(u => u._id === recipientId));
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Initialize
    loadMessages();
});
