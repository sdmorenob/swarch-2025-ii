import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import LoadingBar from "../components/LoadingBar";

export default function MainLayout() {
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setTokenValid(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/users/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setTokenValid(true);
          setUser(userData);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error("Error al hacer fetch:", error);
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, []);

  useEffect(() => {
    if (!loading && !tokenValid) {
      navigate("/login");
    }
  }, [loading, tokenValid, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col">
        <div className="fixed top-0 left-0 right-0 z-50">
          <LoadingBar />
        </div>
      </div>
    );
  }
  if (!tokenValid) return null;

  return (
    <div className="drawer">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen">
        <div
          className="flex-1 bg-base-200 select-none focus:outline-none"
          tabIndex={-1}
        >
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
}
