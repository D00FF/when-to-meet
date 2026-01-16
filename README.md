# When to Meet - Shared Calendar Application

A collaborative calendar application built with Next.js that allows multiple users to coordinate meeting times by selecting their availability on a shared weekly calendar.

## Features

- **Weekly Calendar View**: Navigate between weeks with a clean, modern interface
- **Multi-User Support**: Multiple users can select the same time slots with visual color coding
- **User Profiles**: Create and manage user profiles with custom colors
- **Persistent Storage**: All data is stored locally in the browser
- **Week-Specific Data**: Each week maintains its own independent schedule
- **Drag Selection**: Click and drag to quickly select multiple time slots
- **Visual Indicators**: 
  - Circular badges with user initials for selected slots
  - Divided borders and backgrounds when multiple users select the same slot
  - Color-coded legend showing all participants

## Tech Stack

- **Next.js 16.1.2** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React 19** - UI library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (or npm/yarn)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/when-to-meet.git
cd when-to-meet
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Create a Profile**: When you first visit, you'll be prompted to create a profile with your name and color
2. **Select Time Slots**: Click or drag over time slots to mark your availability
3. **View Others**: See all participants and their selected times in the legend
4. **Navigate Weeks**: Use the arrow buttons to move between weeks
5. **Edit Profile**: Click "Edit Profile" to change your name or color
6. **Sign Out**: Use "Sign Out" to switch to a different profile

## Project Structure

```
app/
  components/
    Calendar.tsx       # Main calendar component with week navigation
    Legend.tsx         # Participants legend
    UserProfileModal.tsx # Profile creation/editing modal
  utils/
    storage.ts         # LocalStorage utilities
    dateUtils.ts      # Date and week calculation utilities
    helpers.ts        # Helper functions (initials, etc.)
  types.ts            # TypeScript type definitions
  page.tsx            # Main page component
  layout.tsx          # Root layout
  globals.css         # Global styles
```

## Features in Detail

### Week Navigation
- Automatically loads to the current week
- Shows week range (e.g., "Week of Jan 11th - 17th")
- Day numbers and abbreviations align with calendar columns

### Multi-User Slots
- When multiple users select the same slot:
  - Background is divided horizontally with each user's color
  - Border is divided to match the background
  - Icons shrink proportionally to fit all users on one line

### Profile Management
- Profiles are permanently saved
- Auto-login by name (if you enter an existing name, you'll be logged into that profile)
- Delete profile option removes all user data
- Sign out to switch between profiles

## Browser Compatibility

- Modern browsers with localStorage support
- Best experience in Chrome, Firefox, Safari, or Edge

## License

This project is open source and available for use.
