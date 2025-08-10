import { useEffect } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUser } from "../utils/userService";

const CreateAdminUser = () => {
  useEffect(() => {
    const email = "draviedaniel@gmail.com";
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
  }, []);

  return (
    <div>
      <h2>Creating Admin User...</h2>
      <p>Check console for status.</p>
    </div>
  );
};

export default CreateAdminUser;
