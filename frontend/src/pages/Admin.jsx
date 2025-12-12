import { useEffect, useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [merchants, setMerchants] = useState([]);
  const [payments, setPayments] = useState([]);

  async function loadMerchants() {
    const res = await api.get("/merchants/all"); // мы создадим этот эндпоинт
    setMerchants(res.data);
  }

  async function loadPayments() {
    const res = await api.get("/payments/all");  // и этот тоже
    setPayments(res.data);
  }

  useEffect(() => {
    loadMerchants();
    loadPayments();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Админ панель</h2>

      <h3>Merchants</h3>
      <table border="1" cellPadding="5" style={{ marginBottom: 40 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>API Key</th>
            <th>Webhook URL</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.name}</td>
              <td>{m.api_key}</td>
              <td>{m.webhook_url}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Payments</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Merchant</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.merchant}</td>
              <td>{p.amount}</td>
              <td>{p.status}</td>
              <td>{p.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
