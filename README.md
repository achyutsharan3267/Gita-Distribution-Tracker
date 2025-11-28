# 🕉️ Bhagavad Gita Distribution Tracker

A clean and modern dashboard web app for tracking Bhagavad Gita book distribution among devotees.

## Features

### 📊 Dashboard Overview
- Total Hindi Gita distributed
- Total English Gita distributed
- Total Small books distributed
- Total distribution count by all users
- List of all active devotees
- Top 3 devotees leaderboard with photos
- Top 10 devotees leaderboard with full stats

### 📝 User Distribution Form
- Daily form submission for:
  - Hindi Gita distributed
  - English Gita distributed
  - Small books distributed
  - Total money received
  - Money paid online/offline
- Automatic updates to dashboard and leaderboard

### 👤 User Profile Page
- User photo and details
- Total distribution statistics
- Total money collected
- Complete activity history with date-wise records

### 👥 User List Page
- View all devotees
- Quick summary cards with distribution stats
- Easy navigation to individual profiles

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **Supabase** - Backend database and API

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account (free tier works fine)

### Installation

1. **Set up Supabase:**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create a Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Get your API credentials

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Supabase URL and anon key:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser and navigate to `http://localhost:5173`**

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   └── Layout.jsx          # Main layout with navigation
├── pages/
│   ├── Dashboard.jsx       # Main dashboard with stats and leaderboards
│   ├── DistributionForm.jsx # Daily distribution submission form
│   ├── UserList.jsx        # List of all devotees
│   └── UserProfile.jsx     # Individual user profile page
├── store/
│   └── useStore.js         # Zustand store for state management
├── App.jsx                 # Main app component with routing
├── main.jsx                # Entry point
└── index.css               # Global styles and Tailwind imports
```

## Data Storage

The app uses **Supabase** (PostgreSQL database) for data persistence. All data is stored in the cloud and synced in real-time.

### Database Tables:
- **users** - Devotee information and totals
- **activities** - Daily distribution history

### Features:
- ✅ Cloud storage (accessible from anywhere)
- ✅ Real-time synchronization
- ✅ Automatic backups
- ✅ Scalable and secure

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

## Customization

### Adding New Users

Users can be added programmatically through the store's `addUser` action, or you can modify the initial state in `src/store/useStore.js`.

### Styling

The app uses a custom color scheme defined in `tailwind.config.js`:
- `spiritual` colors (purple theme)
- `primary` colors (red theme)

You can customize these in the Tailwind config file.

## Features in Detail

### Dashboard
- Real-time statistics calculation
- Responsive grid layout
- Interactive leaderboard with user photos
- Quick action buttons

### Distribution Form
- Form validation
- Money reconciliation check
- Current user selection
- Preview of current totals

### User Profile
- Complete activity timeline
- Detailed statistics breakdown
- Money collection history
- Responsive design

## Future Enhancements

- User authentication
- Firebase/Supabase integration
- Export to PDF/Excel
- Charts and graphs for analytics
- Multi-language support
- Photo upload functionality
- Email notifications

## License

This project is created for spiritual service and book distribution tracking.

---

🕉️ **Hare Krishna!** May this tool help in the service of the Lord. 🕉️

# Gita-Distribution-Tracker
# Gita-Distribution-Tracker
# Gita-Distribution-Tracker
