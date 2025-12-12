import type { Route } from "./+types/requisites";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";
import PaymentForm from "./payment-form";
import PaymentRequisitesList from "./payment-requisites-list";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Requisites | TrustX" },
    { name: "description", content: "Manage your payment requisites" },
  ];
}

export default function Requisites() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [refreshRequisites, setRefreshRequisites] = useState(0);
  const { username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [username, navigate]);

  if (!username) {
    return null;
  }

  return (
    <DashboardLayout title={t("requisites")}>
      {/* Payment Requisites List */}
      <PaymentRequisitesList
        onAddClick={() => setShowPaymentForm(true)}
        refreshTrigger={refreshRequisites}
      />

      {/* Add Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          onSuccess={() => { 
            setShowPaymentForm(false); 
            setRefreshRequisites(prev => prev + 1); 
          }}
          onClose={() => setShowPaymentForm(false)}
        />
      )}
    </DashboardLayout>
  );
}
