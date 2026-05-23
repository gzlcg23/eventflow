// app/test-db/page.tsx
import { prisma } from "@/lib/prisma";

export default async function TestDb() {
  const events = await prisma.event.findMany();
  const users = await prisma.user.findMany();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Verificación de Base de Datos</h1>
      
      <h2 className="text-xl mt-8 mb-4">Usuarios ({users.length})</h2>
      <pre className="bg-gray-100 p-4 rounded-xl overflow-auto">
        {JSON.stringify(users, null, 2)}
      </pre>

      <h2 className="text-xl mt-8 mb-4">Eventos ({events.length})</h2>
      <pre className="bg-gray-100 p-4 rounded-xl overflow-auto">
        {JSON.stringify(events, null, 2)}
      </pre>
    </div>
  );
}