// firebaseInit.js
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCNlCXRk1r3tR5o6cjdrt55P66gButp87M",
  authDomain: "juassvote.firebaseapp.com",
  projectId: "juassvote",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const saveImageMetadata = async (fileId, fileUrl, name) => {
  await addDoc(collection(db, "images"), {
    id: fileId,
    url: fileUrl,
    name: name,
    createdAt: new Date(),
  });
};
