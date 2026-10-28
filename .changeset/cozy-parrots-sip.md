---
"@open-dpp/api-client": patch
---

Keep AI assistant chats out of the server logs. Chat messages are no longer logged, and errors from the chat are logged by name and stack trace only, since their messages can quote the conversation. The server now also refuses to start while `MISTRAL_DEBUG` or `LANGCHAIN_VERBOSE` is set, because either makes the AI libraries print every chat message and reply to the logs.
