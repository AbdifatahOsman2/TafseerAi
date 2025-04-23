# Security Guidelines for TafseerAI

## API Key Management

This application uses several API keys for various services. These keys should be handled securely at all times.

### Setting Up API Keys

1. Make a copy of the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Replace the placeholder values in `.env` with your actual API keys:

   - **GEMINI_API_KEY**: Get this from the [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **LANGUAGE_GOOGLE_API_KEY**: Get this from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **FIREBASE_API_KEY**: Get this from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

3. **IMPORTANT**: Never commit your `.env` file to version control. The `.gitignore` file is configured to exclude it.

### Regenerating API Keys

If you suspect that API keys have been compromised:

1. Immediately revoke the compromised keys through their respective service dashboards:
   - Gemini API Keys: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Google Cloud API Keys: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Firebase API Keys: [Firebase Console](https://console.firebase.google.com/)

2. Generate new API keys and update your `.env` file.

3. Ensure all developers on the team are notified to update their local `.env` files.

## Security Best Practices

- **DO NOT** hardcode API keys in your source code.
- **DO NOT** commit API keys to version control.
- **DO NOT** share API keys in public forums or chat applications.
- **DO** use environment variables to store sensitive information.
- **DO** limit the scope and permissions of API keys to only what is necessary.
- **DO** use API key restrictions where available (HTTP referrers, IP addresses, etc.).

## Production Environment

For production environments, consider:

1. Using a more robust secrets management system.
2. Setting up proper key rotation policies.
3. Implementing a backend service to handle API calls that require sensitive credentials.

## Reporting Security Issues

If you discover a security vulnerability, please report it to [your contact email] rather than opening a public issue. 