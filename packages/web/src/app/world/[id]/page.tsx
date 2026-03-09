export default async function WorldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-xl font-bold text-glow mb-4">
        世界 #{id}
      </h1>

      {/* Chat stream + character panel — Phase 4 */}
      <p className="opacity-40">对话加载中...</p>
    </main>
  );
}
