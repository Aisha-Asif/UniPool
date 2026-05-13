# UniPool: University Carpooling Protocol

UniPool is a secure, decentralized-feel carpooling platform designed specifically for university students in Pakistan (FAST, IBA, NUST, etc.). It solves the daily commute problem by connecting students who have cars with those who need a ride, ensuring safety through institutional email verification.

## 🚀 Key Features

- **Institutional Verification**: Secure verification via university domains (e.g., `@khi.iba.edu.pk`).
- **Student-Exclusive Ecosystem**: Only verified students can offer or request rides.
- **Protocol Profiles**: Detailed student profiles showing ride counts, university affiliation, and "Verified" status.
- **Smart Explore**: Find active offers and requests within your own university community.
- **Ride History**: Keep track of completed poolings and upcoming trips.
- **Swiss-Modern UI**: A polished, high-contrast interface built for speed and clarity.

## 🛠 Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend & DB**: Firebase (Firestore, Auth)
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd unipool
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root and add your Firebase configurations:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🛡 Security

The platform implements strict **Firestore Security Rules** to ensure:
- Users can only modify their own data.
- Ride offers and requests are validated against university domains.
- Private student information is isolated from public view.
