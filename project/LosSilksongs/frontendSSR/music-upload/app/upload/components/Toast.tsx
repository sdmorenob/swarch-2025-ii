"use client";

export default function Toast({
  message,
  type,
  id,
}: {
  message: string;
  type: "success" | "error";
  id: number | string;
}) {
  return (
    <div
      key={id}
      className={`fixed bottom-5 right-5 px-4 py-2 rounded text-white shadow-lg ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
}
