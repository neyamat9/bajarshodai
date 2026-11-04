import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export interface ProductReviewItem {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  userName?: string;
  userAvatar?: string;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
  images?: string[];
}

export interface ProductReviewsResponse {
  data: ProductReviewItem[];
  total: number;
  averageRating: number;
  ratingBreakdown?: Record<number, number>;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export async function fetchProductReviewsApi(
  productId: string,
  page = 1,
  limit = 10,
): Promise<ProductReviewsResponse> {
  return api.get<ProductReviewsResponse>(
    `/customer/products/${encodeURIComponent(productId)}/reviews?page=${page}&limit=${limit}`,
  );
}

export async function createProductReviewApi(
  payload: CreateReviewPayload,
): Promise<ProductReviewItem> {
  return api.post<ProductReviewItem>('/customer/reviews', payload);
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => fetchProductReviewsApi(productId),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductReviewApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-detail'] });
    },
  });
}
