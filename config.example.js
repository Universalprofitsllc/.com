window.APP_CONFIG = {
    firebaseConfig: {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID",
        measurementId: "YOUR_MEASUREMENT_ID"
    },
    defaultUsers: [
        { username: "AdminName", password: "AdminPassword", isAdmin: true, firstname: "Admin", lastname: "", balance: 0, invested: 0, earnings: 0, wallet: "", recoveryWords: [], referrer: "", pendingDeposits: [] }
    ]
};
