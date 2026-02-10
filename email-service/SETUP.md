# Gmail API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing one
3. Name it something like "ProPDF Email Service"

## Step 2: Enable Gmail API

1. In your project, go to **"APIs & Services" > "Library"**
2. Search for **"Gmail API"**
3. Click **"Enable"**

## Step 3: Create OAuth2 Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **ProPDF Email Service**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the scopes and test users
4. Back to credentials, select:
   - Application type: **Desktop app**
   - Name: **ProPDF Email Client**
5. Click **"Create"**
6. Click **"Download JSON"** and save it

## Step 4: Add Credentials to Service

1. Rename the downloaded file to `credentials.json`
2. Copy it to: `c:\Users\Admin\OneDrive\Desktop\Propdf\email-service\credentials.json`

## Step 5: First-Time Authorization

1. Start the service: `docker-compose up --build`
2. Look for the authorization URL in the logs
3. Open the URL in your browser
4. Sign in with your Gmail account
5. Click **"Allow"**
6. You'll be redirected to a page with an authorization code
7. Copy the code
8. Create `email-service/token.json` with:
   ```json
   {"access_token": "PASTE_CODE_HERE"}
   ```
9. Restart the service

## Step 6: Test

Send an email with images to your Gmail account. Within 30 seconds, you should receive a reply with the PDF!

## Troubleshooting

- **"credentials.json not found"**: Make sure the file is in the `email-service` directory
- **"Invalid grant"**: Delete `token.json` and re-authorize
- **"Access blocked"**: Add your email to test users in OAuth consent screen
