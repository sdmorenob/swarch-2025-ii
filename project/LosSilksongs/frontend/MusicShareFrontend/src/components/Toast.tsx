import { useState, useEffect } from "react";

type Props = {
  message: string;
  type?: "success" | "error";
  duration?: number;
  id: number;
};

export default function Toast({
  message,
  type = "success",
  duration = 4000,
  id,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [id, duration]); // 👈 depende de id, no de message

  if (!visible) return null;

  return (
    <div className="toast fixed z-50">
      <div
        className={`alert ${
          type === "error" ? "alert-error" : "alert-success"
        }`}
      >
        <span>{message}</span>
      </div>
    </div>
  );
}
