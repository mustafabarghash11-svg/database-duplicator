import { useState } from "react";
import Sidebar from "./Sidebar";
import ContentArea from "./ContentArea";

export default function DevkLayout() {
  const [activeTab, setActiveTab] = useState("games");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <ContentArea activeTab={activeTab} />
    </div>
  );
}
