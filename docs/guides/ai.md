# AI Integration

open-dpp can add an AI assistant to product passports. The assistant helps users better understand passport details by answering questions in a chat interface.

## Setup

Before enabling AI features, configure the required environment variables:

- `OPEN_DPP_MISTRAL_API_KEY`
- `OPEN_DPP_OLLAMA_URL`

For full environment details, see [configuration options](/reference/configuration).

open-dpp currently supports these AI providers and models:

- **Mistral**: `codestral-latest`
- **Ollama**: `qwen3:0.6b`

## Usage

To enable AI for an organization:

1. Open **Integrations**.
2. Open **AI Integration**.
3. Set the integration to active.

After activation, open any passport and click **Chat with AI** in the top navigation to start a conversation.

## Notes

- AI integration is configured per organization but all organizations use the same model.
- If the AI chat is not available, verify that the integration is active and your environment variables are set correctly.