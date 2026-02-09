# Quick Start Guide

## 🎯 Fastest Way to Run

### Windows (PowerShell)
```powershell
cd C:\Users\Admin\OneDrive\Desktop\Propdf
.\start.ps1
```

### Or manually:
```bash
docker-compose up --build
```

## 📍 Access Points

Once running, access:
- **Frontend UI**: http://localhost:5173
- **API Gateway**: http://localhost:4000
- **Gateway Health**: http://localhost:4000/health
- **PDF Service Health**: http://localhost:4001/health (internal)
- **Image Service Health**: http://localhost:4002/health (internal)

## 🧪 Quick Test

1. Open http://localhost:5173 in your browser
2. Select **"Compress Image"** tab
3. Drag and drop any JPEG/PNG image
4. Adjust quality slider (80% default)
5. Click **"Process Files"**
6. Compressed image downloads automatically!

## 🛑 Stop Services

Press `Ctrl+C` in the terminal, or:
```bash
docker-compose down
```

## 📊 Monitor Services

```bash
# View service status
docker-compose ps

# View logs
docker-compose logs -f

# Check resource usage
docker stats
```

## 🎓 Learn More

See [README.md](README.md) for full documentation.
See [Theory.txt](Theory.txt) for microservices concepts.
