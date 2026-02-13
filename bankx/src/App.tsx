import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Tokenize } from "./pages/Tokenize";
import { Send } from "./pages/Send";
import { Incoming } from "./pages/Incoming";
import { Earn } from "./pages/Earn";
import { Activity } from "./pages/Activity";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tokenize" element={<Tokenize />} />
        <Route path="send" element={<Send />} />
        <Route path="incoming" element={<Incoming />} />
        <Route path="earn" element={<Earn />} />
        <Route path="activity" element={<Activity />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
