import { getAllUsers } from "./lib/api";
import { getFilterOptions } from "./lib/users";
import Dashboard from "./components/Dashboard";

export default async function DashboardPage() {
  const users = await getAllUsers();
  const { titles, departments, countries, states } = getFilterOptions(users);

  return (
    <Dashboard
      users={users}
      departments={departments}
      titles={titles}
      countries={countries}
      states={states}
    />
  );
}
