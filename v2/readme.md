# Bob's Potluck Party Planner

A web application for creating and managing potluck events. Users can create events, add items they plan to bring, and view items other participants have signed up for.

## Features

- Create and manage potluck events
- Track event details (name, host, date, time, location)
- Add and edit items with categories and dietary restrictions
- Filter items by category
- Past events are automatically moved to a separate section
- Mobile-responsive design
- Real-time updates with Firebase Realtime Database

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript (no frameworks)
- Firebase Realtime Database
- Font Awesome for icons

## Prerequisites

- A Firebase account
- A Firebase project with Realtime Database enabled
- A web browser

## Setup Instructions

### 1. Clone or Download the Repository

Download all the files and maintain the directory structure.

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Name your project (e.g., "potluck-planner")
4. Enable Google Analytics (optional)
5. Create the project

### 3. Set Up Firebase Realtime Database

1. In your Firebase project console, navigate to "Build" > "Realtime Database"
2. Click "Create Database"
3. Start in test mode (for now) - you can adjust security rules later
4. Choose a database location closest to your users

### 4. Get Your Firebase Configuration

1. In your Firebase project console, click on the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "potluck-planner-web")
3. Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Update Your Configuration

Open the `js/app.js` file and replace the placeholder Firebase configuration with your own:

```javascript
// Firebase configuration
const firebaseConfig = {
    // Replace with your actual Firebase config
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 6. Testing Locally

You can test your application locally by:

1. Using a local web server like [Live Server for VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Using Python's built-in HTTP server:
   - Navigate to your project directory in the command line
   - Run `python -m http.server` (Python 3) or `python -m SimpleHTTPServer` (Python 2)
   - Open your browser to `http://localhost:8000`

### 7. Deploying to GitHub Pages

1. Create a GitHub repository
2. Push your code to the repository
3. Go to the repository's Settings > Pages
4. Under "Source", select the main branch
5. Click "Save"
6. Your site will be published at `https://yourusername.github.io/repository-name/`

### 8. Deploying to Firebase Hosting (Alternative)

If you prefer to use Firebase Hosting:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init`
   - Select "Hosting"
   - Select your Firebase project
   - Specify "." as your public directory
   - Configure as a single-page app: "No"
   - Set up automatic builds and deploys: "No"
4. Deploy to Firebase: `firebase deploy`

## Security Considerations

For a production application, you should update your Firebase security rules:

1. Go to your Firebase console > Realtime Database > Rules
2. Update the rules to restrict access as needed. For example:

```json
{
  "rules": {
    "events": {
      ".read": true,
      ".write": true,
      "$eventId": {
        ".validate": "newData.hasChildren(['name', 'host', 'date', 'time', 'location'])",
        "items": {
          "$itemId": {
            ".validate": "newData.hasChildren(['name', 'person', 'category'])"
          }
        }
      }
    }
  }
}
```

This is a basic example. For a production app, you might want to implement authentication and more sophisticated rules.

## Customization

### Logo

Replace the logo in `assets/logo.png` or `assets/logo.svg` with your own. Recommended dimensions are 200×60px.

### Colors

Primary colors can be modified in the `css/styles.css` file. Look for color values like `#4f46e5` (primary indigo color).

### Adding Features

Some ideas for extending the application:

- User authentication
- RSVP functionality
- Email notifications
- Image uploads for dishes
- Comments and ratings for dishes
- Dietary restriction filtering
- Printable shopping lists

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font Awesome for the icons
- Firebase for the database and hosting services
