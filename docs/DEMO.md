# CodeShare Demo Guide

## Quick Start (2 Commands)

Get CodeShare running in under 2 minutes:

```bash
# 1. Clone and start services
git clone https://github.com/your-org/codeshare.git
cd codeshare && docker compose up

# 2. Open your browser
open http://localhost:3000
```

That's it! 🎉

## Two-Browser Demo

Experience real-time collaboration by opening CodeShare in two different browsers:

### Step 1: Register Two Users
1. **Browser 1**: Open `http://localhost:3000`
   - Click "Register"
   - Email: `alice@example.com`
   - Password: `password123`
   - Click "Register"

2. **Browser 2**: Open `http://localhost:3000` (or use incognito)
   - Click "Register"
   - Email: `bob@example.com`
   - Password: `password123`
   - Click "Register"

### Step 2: Create a Room
1. In **Browser 1** (Alice):
   - Click "Create Room"
   - Name: `Demo Room`
   - Language: `JavaScript`
   - Click "Create"

2. Copy the room URL from the address bar

### Step 3: Join the Room
1. In **Browser 2** (Bob):
   - Paste the room URL
   - You should see Alice's cursor and any text she types

### Step 4: Real-time Collaboration
1. **Alice** types: `function hello() {`
2. **Bob** sees the text appear in real-time
3. **Bob** adds: `  console.log("Hello World!");`
4. **Alice** sees Bob's addition immediately
5. **Alice** completes: `}`

### Step 5: See Presence Indicators
- Both users should see each other's avatars in the user list
- Cursors should be visible with different colors
- Typing indicators show when someone is actively editing

## Demo GIF

*[Placeholder for demo GIF showing two-browser collaboration]*

## Features to Demo

### ✅ Real-time Editing
- Type in one browser, see changes in another
- Multiple cursors with different colors
- Conflict-free collaborative editing

### ✅ User Presence
- See who's online in the room
- Visual indicators for active users
- Cursor tracking and awareness

### ✅ Room Management
- Create rooms with different programming languages
- Join rooms via URL
- Room history and snapshots

### ✅ Authentication
- Secure user registration and login
- JWT-based authentication
- Protected routes

### ✅ Responsive Design
- Works on desktop and mobile
- Clean, modern interface
- Keyboard shortcuts (Ctrl+S to save)

## Troubleshooting Demo Issues

### WebSocket Connection Failed
```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:8080/ws/editor
```

### Database Connection Issues
```bash
# Check PostgreSQL
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up
```

### Frontend Not Loading
```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose build frontend
docker compose up frontend
```

## Demo Script for Presentations

### 1. Introduction (30 seconds)
"CodeShare is a real-time collaborative code editor built with modern web technologies. Let me show you how it works."

### 2. User Registration (1 minute)
"First, I'll register as Alice, then open another browser to register as Bob."

### 3. Room Creation (30 seconds)
"Alice creates a room called 'Demo Room' with JavaScript syntax highlighting."

### 4. Real-time Collaboration (2 minutes)
"Now watch as Bob joins the room and we collaborate in real-time. Notice how our cursors are different colors and we can see each other typing."

### 5. Features Overview (1 minute)
"CodeShare includes user presence, room management, secure authentication, and works on any device."

### 6. Technical Highlights (1 minute)
"Built with Next.js, Spring Boot, WebSockets, and Yjs for conflict-free collaborative editing."

## Performance Expectations

- **Connection Time**: < 2 seconds
- **Typing Latency**: < 100ms
- **User Presence**: Updates within 500ms
- **Room Loading**: < 1 second

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Mobile Demo

CodeShare works on mobile devices too:
1. Open `http://localhost:3000` on your phone
2. Register and create a room
3. Share the room URL with a desktop user
4. Collaborate across devices

## Next Steps

After the demo, try:
- Creating rooms with different programming languages
- Using keyboard shortcuts (Ctrl+S, Ctrl+Z)
- Exploring the dashboard and room history
- Testing the responsive design on mobile

## Support

If you encounter issues during the demo:
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review the [Operations Guide](OPERATIONS.md)
- Open an issue on GitHub

---

*Happy coding together! 🚀*
