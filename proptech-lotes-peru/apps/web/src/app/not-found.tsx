import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Página no encontrada</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          La página que buscas no existe o ha sido movida. Prueba buscando terrenos
          o vuelve al inicio.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Ir al inicio
          </Link>
          <Link href="/search" className="btn-secondary">
            Buscar terrenos
          </Link>
        </div>
      </div>
    </main>
  );
}
