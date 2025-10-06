# 🏋️‍♂️ Fitness Challenge Tracker

A full-stack MERN application for tracking fitness challenges and workouts with a beautiful, modern UI.

## ✨ Features

- **User Authentication**: Signup and login functionality
- **Fitness Levels**: Choose between Beginner, Intermediate, and Master levels
- **Workout Tracking**: Track your daily exercises and progress
- **Progress Visualization**: See your completion rates and progress bars
- **Community View**: View other users' progress and achievements
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Beautiful gradient designs and smooth animations

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with modern features

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fitness-tracker-mern
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/fitness-tracker
   PORT=5000
   ```
   
   Or use MongoDB Atlas:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fitness-tracker
   PORT=5000
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

6. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 📱 Usage

1. **Sign Up**: Create a new account with your name, email, and fitness level
2. **Login**: Access your account with your credentials
3. **Choose Level**: Select your fitness level (Beginner, Intermediate, or Master)
4. **Complete Workouts**: Mark exercises as complete to track your progress
5. **View Progress**: See your completion rates and community achievements

## 🏗️ Project Structure

```
fitness-tracker-mern/
├── backend/
│   ├── models/
│   │   └── User.js          # User and workout schemas
│   ├── routes/
│   │   └── users.js         # API endpoints
│   ├── Server.js            # Express server setup
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js     # Login component
│   │   │   ├── Signup.js    # Signup component
│   │   │   ├── RoleSelect.js # Fitness level selection
│   │   │   ├── Challenges.js # Workout challenges
│   │   │   ├── UserList.js  # Community view
│   │   │   └── UserList.css # Component styles
│   │   ├── assets/
│   │   │   └── images/      # Exercise images
│   │   ├── App.js           # Main app component
│   │   ├── App.css          # Global styles
│   │   └── index.js         # App entry point
│   └── package.json         # Frontend dependencies
└── README.md               # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/signup` - Create new user account
- `POST /api/users/login` - User login

### Workouts
- `GET /api/users` - Get all users
- `POST /api/users/:userId/workouts` - Add new workout
- `PUT /api/users/:userId/workouts/:workoutId` - Mark workout as complete
- `GET /api/users/:userId/workouts` - Get user's workouts

## 🎨 Features in Detail

### User Authentication
- Secure signup and login system
- User data stored in MongoDB
- Session management with localStorage

### Fitness Levels
- **Beginner**: Basic exercises with 3 sets
- **Intermediate**: Advanced exercises with 3-4 sets
- **Master**: Expert level exercises with 4+ sets

### Workout Tracking
- Track exercise completion
- Visual progress indicators
- Success rate calculations
- Recent workout history

### Community Features
- View all users' progress
- Compare achievements
- Motivation through community engagement

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables in Heroku dashboard
5. Deploy using Git

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `build` folder to your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Exercise images from various fitness resources
- Community for feedback and suggestions
- Open source libraries that made this possible

---

**Ready to start your fitness journey? Let's get moving! 💪**
