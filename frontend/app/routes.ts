import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("admin", "routes/admin.tsx"),
  route("devices", "routes/devices.tsx"),
  route("cabinet", "routes/cabinet.tsx"),
  route("deposit", "routes/deposit.tsx"),
  route("withdrawals", "routes/withdrawals.tsx"),
  route("requisites", "routes/requisites.tsx"),
  route("transactions", "routes/transactions.tsx"),
  route("orders", "routes/orders.tsx"),
  route("arbitration", "routes/arbitration.tsx"),
  route("messages", "routes/messages.tsx"),
  route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;
