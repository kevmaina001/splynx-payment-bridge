# Splynx-UISP Payment Bridge - Frontend

React-based dashboard for monitoring payment processing between Splynx and UISP.

## Features

- **Dashboard Overview**: Real-time payment statistics
- **Payment List**: Complete payment history with search and filters
- **Client Details**: Individual client payment history
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Refresh to see latest payments

## Installation

```bash
cd frontend
npm install
```

## Configuration

Create a `.env` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:3000/api
```

For production, update this to your actual backend URL.

## Running the Application

Development mode:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Payments.jsx
│   │   └── ClientDetails.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Pages

### Dashboard
- Overview statistics (total, successful, failed, pending payments)
- Recent payments table
- Quick navigation to payment details

### Payments
- Complete payment list
- Search by transaction ID or client ID
- Filter by status
- Pagination support

### Client Details
- Individual client payment history
- Client-specific statistics
- Transaction details

## API Integration

The frontend communicates with the backend via REST API:

- `GET /api/stats` - Payment statistics
- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment details
- `GET /api/clients/:id/payments` - Client payments

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
5. Deploy

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables in Netlify dashboard

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool
- **React Router**: Navigation
- **Axios**: HTTP client
- **Lucide React**: Icons
