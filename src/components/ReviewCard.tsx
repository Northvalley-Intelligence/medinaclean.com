import { Star } from "lucide-react";
import type { ApprovedReview } from "@/lib/supabase-rest";

// Shared approved-review card (homepage featured list + the full /reviews page).
export function ReviewCard({ review }: { review: ApprovedReview }) {
  return (
    <article className="card review-card">
      <div className="review-person">
        {review.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="review-avatar"
            src={`/api/review-photo?path=${encodeURIComponent(review.photo_path)}`}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="review-avatar" aria-hidden>
            {review.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h3>{review.name}</h3>
          <div className="stars" aria-label={`${review.rating} stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                fill={star <= review.rating ? "#d6337b" : "none"}
                color="#d6337b"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
      <p>{review.message}</p>
    </article>
  );
}
