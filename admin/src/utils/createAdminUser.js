const { auth } = require("../firebaseConfig");
const { createUserWithEmailAndPassword } = require("firebase/auth");
const { createUser } = require("./userService");

const email = "juass@gmail.com";
const password = "123456";
const role = "Admin";

const createAdminUser = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created in Firebase Auth:", user.uid);

    await createUser(user.uid, email, role);
    console.log("User document created in Firestore 'users' collection.");

  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

createAdminUser();
