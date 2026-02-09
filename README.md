# ProPDF - Professional PDF & Image Processing

A microservices-based application for PDF manipulation (merge, split) and image compression built with Node.js, React, and Docker.

## 🏗️ Architecture

This project demonstrates a real-world microservices architecture with four distinct services:

```
┌─────────────┐
│   Frontend  │ (React + Vite + Tailwind)
│  Port 5173  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ (Express - Central Router)
│  Port 4000  │
└──────┬──────┘
       │
       ├─────────────┬─────────────┐
       ▼             ▼             
┌─────────────┐ ┌─────────────┐
│ PDF Service │ │Image Service│
│  Port 4001  │ │  Port 4002  │
└─────────────┘ └─────────────┘
```

### Services:

- **Frontend**: React UI with drag-and-drop file upload
- **API Gateway**: Routes requests to appropriate microservices
- **PDF Service**: Handles PDF merge, split, and info extraction
- **Image Service**: Handles image compression, resizing, and format conversion

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (required)
- **Node.js 18+** (for local development)
- **Git**

### Running with Docker (Recommended)

1. **Clone the repository** (or navigate to the project folder)
   ```bash
   cd C:\Users\Admin\OneDrive\Desktop\Propdf
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - API Gateway: http://localhost:4000
   - PDF Service Health: http://localhost:4001/health
   - Image Service Health: http://localhost:4002/health

4. **Stop all services**
   ```bash
   docker-compose down
   ```

### Local Development (Without Docker)

Each service can be run independently for development:

```bash
# Terminal 1 - Image Service
cd image-service
npm install
npm start

# Terminal 2 - PDF Service
cd pdf-service
npm install
npm start

# Terminal 3 - API Gateway
cd api-gateway
npm install
npm start

# Terminal 4 - Frontend
cd frontend
npm install
npm run dev
```

**Note**: When running locally, update the service URLs in `api-gateway/server.js`:
```javascript
const PDF_SERVICE_URL = 'http://localhost:4001';
const IMAGE_SERVICE_URL = 'http://localhost:4002';
```

## 📚 API Documentation

### PDF Operations

#### Merge PDFs
- **Endpoint**: `POST /api/process/merge-pdf`
- **Body**: FormData with `files[]` (multiple PDFs)
- **Response**: Binary PDF file

#### Split PDF
- **Endpoint**: `POST /api/process/split-pdf`
- **Body**: FormData with `file` and `pageRanges` (e.g., "1-3,5,7-9")
- **Response**: Binary PDF file

#### PDF Info
- **Endpoint**: `POST /api/process/pdf-info`
- **Body**: FormData with `file`
- **Response**: JSON with metadata

### Image Operations

#### Compress Image
- **Endpoint**: `POST /api/process/compress-image`
- **Body**: FormData with `image` and `quality` (1-100)
- **Response**: Binary image file

#### Resize Image
- **Endpoint**: `POST /api/process/resize-image`
- **Body**: FormData with `image`, `width`, `height`, `quality`
- **Response**: Binary image file

#### Convert Image
- **Endpoint**: `POST /api/process/convert-image`
- **Body**: FormData with `image`, `format` (jpeg/png/webp/avif), `quality`
- **Response**: Binary image file

## 🧪 Testing

### Using curl

```bash
# Test Image Compression
curl -X POST http://localhost:4000/api/process/compress-image \
  -F "image=@test.jpg" \
  -F "quality=80" \
  --output compressed.jpg

# Test PDF Merge
curl -X POST http://localhost:4000/api/process/merge-pdf \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf" \
  --output merged.pdf
```

### Using Postman

1. Import the API endpoints
2. Set request type to POST
3. Use `form-data` body type
4. Add files with appropriate field names

## 🛠️ Technologies

- **Frontend**: React, Vite, Tailwind CSS, React-Dropzone, Axios
- **Backend**: Node.js, Express.js
- **PDF Processing**: pdf-lib
- **Image Processing**: Sharp
- **Containerization**: Docker, Docker Compose
- **Architecture**: Microservices with HTTP/REST

## 📦 Project Structure

```
Propdf/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API service layer
│   │   └── App.jsx       # Main app component
│   ├── Dockerfile
│   └── package.json
│
├── api-gateway/          # Central routing service
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
│
├── pdf-service/          # PDF processing microservice
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
│
├── image-service/        # Image processing microservice
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml    # Service orchestration
└── README.md
```

## 🔍 Monitoring

### Check Service Health

```bash
# All services status
docker-compose ps

# Service logs
docker-compose logs -f pdf-service
docker-compose logs -f image-service
docker-compose logs -f gateway

# Resource usage
docker stats
```

## 🎯 Why Microservices?

This project demonstrates microservices benefits:

1. **Service Isolation**: If image processing crashes, PDF operations continue working
2. **Independent Scaling**: Scale CPU-intensive image service independently
3. **Technology Flexibility**: Each service can use different libraries/languages
4. **Easier Debugging**: Isolated logs and error boundaries per service

## 🚧 Future Enhancements

- [ ] Add PDF compression with Ghostscript
- [ ] Implement shared volume for large file handling
- [ ] Add Redis for caching
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Deploy to cloud (AWS/GCP/Azure)
- [ ] Add Kubernetes orchestration
- [ ] Implement message queue (RabbitMQ/Kafka)

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is a learning project for understanding microservices architecture.

---

**Built with ❤️ for learning microservices**
