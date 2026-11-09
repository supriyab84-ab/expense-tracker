import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parsedUser = JSON.parse(user);
    if (!parsedUser || !parsedUser.id) {
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
