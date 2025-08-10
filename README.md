# eVoting System

A comprehensive electronic voting system designed for organizing internal elections with secure, transparent, and efficient voting processes.

## 🎯 Project Overview

This eVoting system provides a complete solution for conducting internal elections with separate interfaces for administrators and voters. The system ensures secure voting, real-time result tracking, and comprehensive election management.

## 🏗️ Architecture

The system consists of three main components:

### 1. Admin Dashboard (`/admin/`)
- **Technology**: React + Vite
- **Purpose**: Complete election management interface
- **Features**:
  - Candidate registration and management
  - Voter registration and verification
  - Real-time vote counting and results
  - Staff management
  - Exhibition flyer generation
  - Secure admin authentication

### 2. Voter Interface (`/voters/`)
- **Technology**: React + Vite
- **Purpose**: Voter-facing voting platform
- **Features**:
  - Secure voter login
  - Intuitive voting interface
  - Real-time voting confirmation
  - Vote verification

### 3. Server (`/server/`)
- **Technology**: Node.js
- **Purpose**: Backend API and file management
- **Features**:
  - RESTful API endpoints
  - File upload handling
  - Database integration
  - Authentication services

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd eVoting_system
   ```

2. **Install Admin Dashboard dependencies**
   ```bash
   cd admin
   npm install
   ```

3. **Install Voter Interface dependencies**
   ```bash
   cd ../voters
   npm install
   ```

4. **Install Server dependencies**
   ```bash
   cd ../server
   npm install
   ```

### Development

1. **Start the server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Admin Dashboard**
   ```bash
   cd admin
   npm run dev
   ```

3. **Start Voter Interface**
   ```bash
   cd voters
   npm run dev
   ```

## 📁 Project Structure

```
eVoting_system/
├── admin/                    # Admin dashboard application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS/styling files
│   │   └── utils/          # Utility functions
│   ├── server/             # Admin-specific server files
│   └── voters/             # Voter interface within admin
├── voters/                 # Standalone voter interface
│   ├── src/
│   │   ├── pages/         # Voter-facing pages
│   │   ├── context/       # React context providers
│   │   └── utils/         # Voter-specific utilities
├── server/                # Main backend server
│   ├── index.js          # Main server file
│   └── uploadImage.js    # Image upload handler
├── .gitignore            # Git ignore rules
└── README.md            # Project documentation
```

## 🔧 Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Context API** - State management
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Firebase** - Authentication and database
- **Google Drive API** - File storage

## 🔐 Security Features

- Firebase authentication
- Secure voter verification
- Encrypted data transmission
- Role-based access control
- Audit trail for all actions

## 📊 Features Overview

### Admin Features
- ✅ Candidate management
- ✅ Voter registration
- ✅ Staff management
- ✅ Real-time vote counting
- ✅ Exhibition flyer generation
- ✅ Results visualization
- ✅ Secure admin login

### Voter Features
- ✅ Secure voter authentication
- ✅ Intuitive voting interface
- ✅ Vote confirmation
- ✅ Real-time updates

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

This project was developed as a comprehensive solution for internal election management.

## 📞 Support

For support, email [support@example.com] or create an issue in the GitHub repository.

---

**Note**: This system is designed for internal organizational use. Ensure proper security measures are implemented before deploying in production environments.
