function chatApp() {
    return {
        userMessage: '',
        messages: [],
        isTyping: false,
        
        init() {
            // Auto-scroll to bottom when messages change
            this.$watch('messages', () => {
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            });
        },

        sendMessage() {
            if (this.userMessage.trim() === '') return;

            // Add user message to the chat
            const userMsg = { 
                id: Date.now(), 
                text: this.userMessage, 
                sender: 'user',
                timestamp: new Date()
            };
            this.messages.push(userMsg);

            const userMessageCopy = this.userMessage;
            this.userMessage = ''; // Clear input field

            // Show typing indicator
            this.showTypingIndicator();

            // Send the user message to the server
            axios.post('/api/chat', { message: userMessageCopy })
                .then(response => {
                    // Hide typing indicator
                    this.hideTypingIndicator();
                    
                    // Process and format chatbot response
                    const formattedResponse = this.formatChatbotResponse(response.data.response);
                    const botMsg = { 
                        id: Date.now(), 
                        text: formattedResponse, 
                        sender: 'bot',
                        timestamp: new Date()
                    };

                    this.messages.push(botMsg);
                })
                .catch(error => {
                    console.error(error);
                    this.hideTypingIndicator();
                    
                    const errorMsg = { 
                        id: Date.now(), 
                        text: 'Sorry, I encountered an error. Please try again.', 
                        sender: 'bot',
                        timestamp: new Date()
                    };
                    this.messages.push(errorMsg);
                });
        },

        showTypingIndicator() {
            this.isTyping = true;
            this.scrollToBottom();
        },

        hideTypingIndicator() {
            this.isTyping = false;
        },

        scrollToBottom() {
            setTimeout(() => {
                const chatWindow = document.getElementById('chatWindow');
                if (chatWindow) {
                    chatWindow.scrollTop = chatWindow.scrollHeight;
                }
            }, 100);
        },

        formatChatbotResponse(response) {
            /**
             * Enhanced formatting for chatbot responses:
             * - `**bold**` to `<b>bold</b>`
             * - Triple backticks (```) to styled code blocks
             * - Line breaks after `.`, `!`, `?` to `<br>` tags
             * - Better handling of markdown-style formatting
             */
            
            // Handle bold text (markdown style)
            response = response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            
            // Handle italic text
            response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            // Handle code blocks with language specification
            response = response.replace(/```(\w+)?\n?([\s\S]*?)```/g, function(match, lang, code) {
                const language = lang || 'text';
                return `<div class="code-block"><div class="code-header">${language}</div><pre><code>${code.trim()}</code></pre></div>`;
            });
            
            // Handle inline code
            response = response.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
            
            // Add line breaks after punctuation for better readability
            response = response.replace(/([.!?])\s+/g, '$1<br><br>');
            
            // Handle line breaks (\n)
            response = response.replace(/\n/g, '<br>');
            
            // Clean up multiple consecutive line breaks
            response = response.replace(/(<br>){3,}/g, '<br><br>');
            
            return response;
        },

        formatTime(timestamp) {
            const now = new Date();
            const messageTime = new Date(timestamp);
            const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
            
            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
            return messageTime.toLocaleDateString();
        }
    };
}
