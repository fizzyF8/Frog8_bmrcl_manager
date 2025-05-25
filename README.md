# BMRCL Manager - TVM Management System

A comprehensive Ticket Vending Machine (TVM) management system built with React Native and Expo, designed for the Bangalore Metro Rail Corporation Limited (BMRCL).

## 🚀 Features

- **Authentication System**
  - Secure login and user management
  - Role-based access control

- **TVM Management**
  - Real-time TVM monitoring
  - Status tracking and management
  - Issue reporting and resolution

- **Task Management**
  - Task assignment and tracking
  - Priority-based task organization
  - Real-time task status updates

- **Dashboard**
  - Comprehensive overview of system status
  - Analytics and reporting
  - Quick access to key features

- **Notifications**
  - Real-time alerts and notifications
  - System status updates
  - Task-related notifications

## 🛠️ Technology Stack

- **Frontend Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **UI Components**: Custom components with Expo Vector Icons
- **Storage**: AsyncStorage for local data persistence
- **API Integration**: Axios for HTTP requests
- **Location Services**: Expo Location
- **Camera & Image**: Expo Camera and Image Picker
- **Additional Features**: 
  - Expo Blur for UI effects
  - Expo Haptics for tactile feedback
  - Expo Linear Gradient for styling
  - React Native Reanimated for animations

## 📱 Supported Platforms

- iOS
- Android
- Web (with limited functionality)

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd bmrcl-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## 📁 Project Structure

```
├── app/                    # Main application screens and routing
│   ├── auth/              # Authentication related screens
│   ├── tvm/               # TVM management screens
│   └── (tabs)/            # Tab-based navigation screens
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── task/             # Task-related components
│   ├── tvm/              # TVM-specific components
│   └── dashboard/        # Dashboard components
├── assets/               # Static assets (images, fonts)
├── constants/            # Application constants
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🔧 Configuration

The application uses various configuration files:
- `app.json`: Expo configuration
- `tsconfig.json`: TypeScript configuration
- `.prettierrc`: Code formatting rules
- `.npmrc`: NPM configuration

## 📝 Scripts

- `npm run dev`: Start the development server
- `npm run build:web`: Build the web version
- `npm run lint`: Run linting checks

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 👥 Authors

- Your Name/Team Name

## 🙏 Acknowledgments

- BMRCL for the opportunity
- Expo team for the amazing framework
- All contributors who have helped shape this project