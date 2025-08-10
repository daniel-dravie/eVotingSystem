import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    years.push(year.toString());
  }
  return years;
};

export const getAvailableClasses = async () => {
  try {
    const classesCollection = collection(db, "classes");
    const classesSnapshot = await getDocs(classesCollection);
    const classesList = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return classesList;
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
};

export const getAvailableYearStages = () => {
  return [
    "Year 1",
    "Year 2", 
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Form 1",
    "Form 2",
    "Form 3",
    "Form 4",
    "Form 5",
    "Form 6"
  ];
};
