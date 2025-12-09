import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import UploadMusicClient from "../components/UploadMusicClient";

type ServerData = {
  theme: "cupcake" | "dark";
  timestamp: string;
};

export const getServerSideProps = (async (context) => {
  // Aquí puedes hacer fetch de datos del servidor si necesitas
  // Por ahora, simplemente pasamos el theme y timestamp como ejemplo
  const data: ServerData = {
    theme: "cupcake",
    timestamp: new Date().toISOString(),
  };

  return { props: { data } };
}) satisfies GetServerSideProps<{ data: ServerData }>;

export default function UploadPage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <main className="p-8">
      <UploadMusicClient theme={data.theme} />
    </main>
  );
}
