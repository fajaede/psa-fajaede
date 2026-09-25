import { redirect } from "next/navigation";

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/report/${id}`);
}
