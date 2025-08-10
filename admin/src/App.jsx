import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./components/AdminDashboard";
import VoteResults from "./components/VoteResults";
import RegisterVoter from "./components/RegisterVoter";
import AddStaff from "./components/AddStaff";
import VoteCountingScreen from "./components/VoteCountingScreen";
import GenerateCode from "./components/GenerateCode";
import AdminLogin from "./pages/AdminLogin";
import VoterList from "./components/VoterList";
import CandidateRegistration from "./components/CandidateRegistration";
import CandidatesList from "./components/CandidatesList";
import StaffList from "./components/StaffList";
import PortfolioList from "./components/PortfolioList";
import AddClass from "./components/AddClass";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="admin-dashboard" element={<AdminDashboard />}>
          <Route path="vote-results" element={<VoteResults />} />
          <Route path="register-voter" element={<RegisterVoter />} />
          <Route path="add-staff" element={<AddStaff />} />
          <Route path="staff-list" element={<StaffList />} />
          <Route path="vote-counting" element={<VoteCountingScreen />} />
          <Route path="generate-code" element={<GenerateCode />} />
          <Route path="voters-list" element={<VoterList />} />
          <Route
            path="register-candidate"
            element={<CandidateRegistration />}
          />
          <Route path="view-candidates" element={<CandidatesList />} />
          <Route path="view-portfolio" element={<PortfolioList />} />
          <Route path="add-class" element={<AddClass />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
