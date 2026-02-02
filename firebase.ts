
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDK8ZDfmRGN2WoO6k-b8pXwvsVnkawlaF8",
  authDomain: "rand-eau-vive.firebaseapp.com",
  databaseURL: "https://rand-eau-vive-default-rtdb.europe-west1.firebasedatabase.app", // CRITIQUE pour la zone Europe
  projectId: "rand-eau-vive",
  storageBucket: "rand-eau-vive.firebasestorage.app",
  messagingSenderId: "210616765974",
  appId: "1:210616765974:web:32dd0b86b7cabb7e656f37",
  measurementId: "G-TD4JCM2NY3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, push, onValue, remove, update };
