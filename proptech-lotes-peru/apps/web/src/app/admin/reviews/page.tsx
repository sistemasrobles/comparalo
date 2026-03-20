'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Review {
  id: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  project?: {
    name: string;
  };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/admin'); return; }

    api.adminRequest<Review[]>('/admin/reviews/pending')
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const moderateReview = async (reviewId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      await api.adminRequest(`/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        body: { status: action },
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch { /* ignore */ }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/dashboard" className="hover:text-primary-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Reviews</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Moderar reviews</h1>
        <p className="text-gray-500 mt-1">{reviews.length} reviews pendientes de moderación</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-lg">No hay reviews pendientes 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{review.authorName}</span>
                    <span className="text-sm text-gray-500">{review.authorEmail}</span>
                    <span className="text-yellow-500">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                  {review.project && (
                    <p className="text-sm text-gray-500 mb-2">
                      Proyecto: <strong>{review.project.name}</strong>
                    </p>
                  )}
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString('es-PE', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moderateReview(review.id, 'APPROVED')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => moderateReview(review.id, 'REJECTED')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
