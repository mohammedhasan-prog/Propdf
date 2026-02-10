const { google } = require('googleapis');
const simpleParser = require('mailparser').simpleParser;
const MailComposer = require('nodemailer/lib/mail-composer');
const { PDFDocument } = require('pdf-lib');
const http = require('http');
require('dotenv').config();

const CHECK_INTERVAL = 10000; // 10 seconds
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

let gmailClient = null;

// OAuth2 Authentication using environment variables
async function authorize() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  let tokenValue = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !tokenValue) {
    console.log('\n========================================');
    console.log('SETUP REQUIRED - Add these to your .env file:');
    console.log('========================================');
    console.log('GMAIL_CLIENT_ID=your_client_id');
    console.log('GMAIL_CLIENT_SECRET=your_client_secret');
    console.log('GMAIL_REFRESH_TOKEN=your_auth_code_or_refresh_token');
    console.log('========================================\n');
    return null;
  }

  try {
    const redirectUri = 'https://developers.google.com/oauthplayground';
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // If the token starts with "4/" it's an auth code - exchange it
    if (tokenValue.startsWith('4/')) {
      console.log('🔄 Detected authorization code. Exchanging for refresh token...');
      
      const { tokens } = await oAuth2Client.getToken(tokenValue);
      console.log('\n========================================');
      console.log('✅ SUCCESS! Got refresh token!');
      console.log('========================================');
      console.log('Update GMAIL_REFRESH_TOKEN in your .env to:');
      console.log(tokens.refresh_token);
      console.log('========================================\n');
      
      oAuth2Client.setCredentials(tokens);
      return oAuth2Client;
    }

    // Otherwise treat it as a refresh token
    oAuth2Client.setCredentials({ refresh_token: tokenValue });

    console.log('Testing OAuth2 credentials...');
    const tokenResponse = await oAuth2Client.getAccessToken();
    if (tokenResponse.token) {
      console.log('✅ OAuth2 token validated successfully!');
    }
    return oAuth2Client;
  } catch (error) {
    console.error('❌ OAuth2 Error:', error.message);
    if (error.response) {
      console.error('   Details:', JSON.stringify(error.response.data));
    }
    console.log('\n⚠️  The auth code may have expired (they only last a few minutes).');
    console.log('Go to OAuth Playground, authorize again, get a FRESH code, paste in .env, restart.\n');
    return null;
  }
}

async function createPdfFromImages(images) {
  try {
    const pdfDoc = await PDFDocument.create();
    for (const image of images) {
      let pdfImage;
      try {
        if (image.contentType.includes('jpeg') || image.contentType.includes('jpg')) {
          pdfImage = await pdfDoc.embedJpg(image.content);
        } else if (image.contentType.includes('png')) {
          pdfImage = await pdfDoc.embedPng(image.content);
        }
      } catch (err) {
        console.error('Error embedding image:', err.message);
        continue;
      }
      if (pdfImage) {
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, { x: 0, y: 0, width: pdfImage.width, height: pdfImage.height });
      }
    }
    return await pdfDoc.save();
  } catch (err) {
    console.error('Error creating PDF:', err.message);
    return null;
  }
}

async function sendReply(to, pdfBuffer, auth) {
  try {
    const gmail = google.gmail({ version: 'v1', auth });

    // Use nodemailer to generate the raw email string
    // This handles all the complex MIME multipart boundaries and encoding correctly
    const mail = new MailComposer({
      to: to,
      subject: 'ProPDF: Your Converted Images',
      text: 'Hello,\n\nHere is the PDF converted from the images you sent.\n\nBest regards,\nProPDF Service',
      attachments: [
        {
          filename: 'converted.pdf',
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        }
      ]
    });

    // Compile the email
    const message = await mail.compile().build();
    
    // Encode to Base64URL (required by Gmail API)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send using Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`✅ Reply sent successfully to ${to} via Gmail API!`);
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.response) console.error('Details:', JSON.stringify(error.response.data));
  }
}

async function processEmails() {
  if (!gmailClient) {
    console.log('Gmail client not initialized.');
    return;
  }

  try {
    console.log('🔍 Checking for new emails...');
    const gmail = google.gmail({ version: 'v1', auth: gmailClient });

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 10,
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      console.log('📭 No new emails.');
      return;
    }

    console.log(`📬 Found ${messages.length} unread message(s).`);

    for (const message of messages) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'raw',
        });

        const rawMessage = Buffer.from(msg.data.raw, 'base64').toString('utf-8');
        const parsed = await simpleParser(rawMessage);
        const fromAddress = parsed.from.value[0].address;
        console.log(`📧 Processing email from: ${fromAddress}`);

        if (parsed.attachments && parsed.attachments.length > 0) {
          const images = parsed.attachments.filter(
            (att) => att.contentType.includes('image/jpeg') || att.contentType.includes('image/png')
          );

          if (images.length > 0) {
            console.log(`🖼️  Found ${images.length} image(s). Converting to PDF...`);
            const pdfBuffer = await createPdfFromImages(images);
            if (pdfBuffer) {
              await sendReply(fromAddress, pdfBuffer, gmailClient);
              await gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                requestBody: { removeLabelIds: ['UNREAD'] },
              });
            }
          } else {
            console.log('ℹ️  No image attachments (JPG/PNG) found.');
          }
        }
      } catch (msgError) {
        console.error('Error processing message:', msgError.message);
      }
    }
  } catch (error) {
    console.error('Error fetching emails:', error.message);
  }
}

async function startService() {
  console.log('🚀 Starting Email Service with Gmail API...\n');

  // Health check server for Render
  const PORT = process.env.PORT || 4003;
  http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'email-service' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Email Service Running');
    }
  }).listen(PORT, () => console.log(`Health check server on port ${PORT}`));

  gmailClient = await authorize();

  if (!gmailClient) {
    console.log('⏸️  Service paused. Set environment variables first.');
    return;
  }

  console.log('✅ Gmail API configured successfully!');
  console.log(`⏱️  Polling every ${CHECK_INTERVAL / 1000} seconds...\n`);

  processEmails();
  setInterval(processEmails, CHECK_INTERVAL);
}

process.on('uncaughtException', (err) => console.error('UNCAUGHT EXCEPTION:', err));
process.on('unhandledRejection', (reason) => console.error('UNHANDLED REJECTION:', reason));

startService();
