# Frontend Development Guide

## Project Structure

```
frontend/
├── public/                   # Static assets
├── src/
│   ├── pages/               # Next.js pages (automatically routed)
│   │   ├── index.jsx        # Home page (/)
│   │   ├── vehicles.jsx     # Vehicles page (/vehicles)
│   │   ├── analytics.jsx    # Analytics page (/analytics)
│   │   ├── settings.jsx     # Settings page (/settings)
│   │   ├── _app.jsx         # App wrapper
│   │   └── _document.jsx    # HTML document
│   ├── components/          # Reusable React components
│   │   ├── Layout.jsx       # Main layout
│   │   ├── Dashboard.jsx    # Dashboard component
│   │   └── ...
│   ├── utils/               # Helper functions
│   │   ├── api.js           # API client
│   │   ├── store.js         # Zustand state management
│   │   └── config.js        # Configuration
│   └── styles/              # CSS files
│       └── globals.css      # Global styles
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Development Server
```bash
npm run dev
```
Access at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Styling

Uses **Tailwind CSS** for utility-first styling.

### Custom Components (tailwind.css)
```css
@layer components {
  .btn-primary { /* Button styling */ }
  .card { /* Card styling */ }
  .input { /* Input field styling */ }
}
```

### Usage
```jsx
<button className="btn-primary">Click me</button>
<div className="card">Card content</div>
<input className="input" placeholder="Enter text" />
```

## Pages

### Home (/)
Main dashboard with:
- System status
- Recent vehicles stats
- Quick overview

### Vehicles (/vehicles)
Complete vehicle records list:
- Filterable table
- Export functionality
- Search/pagination

### Analytics (/analytics)
System statistics:
- Total vehicles processed
- Allowed vs blocked ratio
- Average weight
- Charts (coming soon)

### Settings (/settings)
System configuration:
- Max weight limit
- Calibration settings
- System info
- Quick actions

## State Management (Zustand)

Located in `utils/store.js`:

```javascript
// Usage in components
import { useAppStore } from '@/utils/store';

function MyComponent() {
  const { recentVehicles, setRecentVehicles } = useAppStore();
  
  return <div>{recentVehicles.length} vehicles</div>;
}
```

## API Communication

Located in `utils/api.js`:

```javascript
import { vehicleAPI, arduinoAPI, cameraAPI } from '@/utils/api';

// Get all vehicles
const res = await vehicleAPI.getAll({ limit: 20 });

// Create vehicle record
await vehicleAPI.create({ weight: 3500, status: 'ALLOWED' });

// Get Arduino status
const status = await arduinoAPI.getStatus();

// Subscribe to IR events
await arduinoAPI.getEvents();
```

## Creating Components

### Functional Component Template
```jsx
/**
 * MyComponent
 * Component description
 */

export default function MyComponent() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Title</h2>
      <p>Content</p>
    </div>
  );
}
```

### With State
```jsx
'use client'; // For client-side features

import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
  }, []);

  return <div>{data}</div>;
}
```

## Form Handling

### Input Fields
```jsx
const [form, setForm] = useState({ weight: '', status: '' });

const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

<input 
  name="weight"
  value={form.weight}
  onChange={handleChange}
  className="input"
/>
```

### Form Submission
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  await vehicleAPI.create(form);
};

<form onSubmit={handleSubmit}>
  {/* inputs */}
  <button className="btn-primary">Submit</button>
</form>
```

## Real-Time Updates

### Server-Sent Events (SSE)
```javascript
useEffect(() => {
  const eventSource = new EventSource('/api/arduino/events/stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New vehicle:', data);
  };
  
  return () => eventSource.close();
}, []);
```

### Polling
```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await vehicleAPI.getAll();
    setVehicles(res.data.data);
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

## Responsive Design

Tailwind breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Example
```jsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive columns */}
</div>
```

## Performance Optimization

### Image Optimization
```jsx
import Image from 'next/image';

<Image src="/image.jpg" alt="alt" width={200} height={200} />
```

### Code Splitting
Next.js automatically splits code by page.

### Static Generation
```jsx
export async function getStaticProps() {
  return {
    props: { /* data */ },
    revalidate: 3600, // Revalidate every hour
  };
}
```

## Debugging

### Browser DevTools
Open DevTools (F12) → Console for errors and logs

### Network Tab
Monitor API requests in Network tab

### React Developer Tools
Install React DevTools browser extension

## Common Issues

### CORS Error
Check `FRONTEND_URL` in backend `.env`

### API Timeout
Increase timeout in `utils/config.js`

### Styles Not Applied
Ensure Tailwind is properly configured

---

**For more info:** See [Next.js Documentation](https://nextjs.org/docs)
