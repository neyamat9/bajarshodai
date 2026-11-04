import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';
import { ProductReviewItem } from '../api/reviewsApi';

export interface ProductReviewsListProps {
  productId: string;
  reviews?: ProductReviewItem[];
  averageRating?: number;
  totalReviews?: number;
  ratingBreakdown?: Record<number, number>;
  onOpenWriteReview: () => void;
}

export function ProductReviewsList({
  reviews = [],
  averageRating = 4.8,
  totalReviews = 0,
  ratingBreakdown = { 5: 80, 4: 15, 3: 5, 2: 0, 1: 0 },
  onOpenWriteReview,
}: ProductReviewsListProps) {
  const [helpfulMap, setHelpfulMap] = useState<Record<string, number>>({});
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  const handleHelpful = (reviewId: string, currentHelpful = 0) => {
    if (votedMap[reviewId]) return;
    haptics.light();
    setVotedMap((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulMap((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? currentHelpful) + 1,
    }));
  };

  const calcPercentage = (count: number) => {
    const total = Math.max(1, totalReviews);
    return Math.min(100, Math.round((count / total) * 100));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Customer Reviews</Text>
          <Text style={styles.subtitle}>{totalReviews} verified ratings</Text>
        </View>
        <Button
          variant="outline"
          size="sm"
          title="Write Review"
          onPress={onOpenWriteReview}
          leftIcon={<Icon name="Edit" size={14} color="#0b6234" />}
        />
      </View>

      {/* Ratings Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.scoreCol}>
          <Text style={styles.scoreText}>{averageRating.toFixed(1)}</Text>
          <StarRating rating={averageRating} size={14} />
          <Text style={styles.outOfText}>out of 5.0</Text>
        </View>

        {/* Breakdown Bars */}
        <View style={styles.breakdownCol}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star] ?? 0;
            const pct = calcPercentage(count);
            return (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star}★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Review Items */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="MessageSquare" size={32} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>Be the first customer to share your thoughts!</Text>
        </View>
      ) : (
        reviews.map((rev) => {
          const currentHelpful = helpfulMap[rev.id] ?? rev.helpfulCount ?? 0;
          const hasVoted = votedMap[rev.id];

          return (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.userRow}>
                  {rev.userAvatar ? (
                    <Image
                      source={{ uri: rev.userAvatar }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {(rev.userName || 'Customer').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.userName}>{rev.userName || 'Verified Customer'}</Text>
                    <View style={styles.metaRow}>
                      <StarRating rating={rev.rating} size={11} />
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.dateText}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {rev.isVerifiedPurchase && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="CheckCircle" size={11} color="#059669" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              {rev.title && <Text style={styles.reviewTitle}>{rev.title}</Text>}
              {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}

              {/* Review Photos */}
              {rev.images && rev.images.length > 0 && (
                <View style={styles.imagesRow}>
                  {rev.images.map((imgUri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: imgUri }}
                      style={styles.reviewThumbnail}
                      contentFit="cover"
                    />
                  ))}
                </View>
              )}

              {/* Helpful footer */}
              <View style={styles.helpfulRow}>
                <TouchableOpacity
                  onPress={() => handleHelpful(rev.id, rev.helpfulCount)}
                  style={[styles.helpfulBtn, hasVoted && styles.helpfulBtnActive]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Helpful review vote"
                >
                  <Icon name="ThumbsUp" size={12} color={hasVoted ? '#0b6234' : '#6b7280'} />
                  <Text style={[styles.helpfulCount, hasVoted && styles.helpfulCountActive]}>
                    Helpful ({currentHelpful})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  scoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    minWidth: 90,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  outOfText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 3,
  },
  breakdownCol: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    color: '#4b5563',
    width: 20,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    color: '#9ca3af',
    width: 22,
    textAlign: 'right',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    fontSize: 10,
    color: '#9ca3af',
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 18,
    color: '#4b5563',
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  reviewThumbnail: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: '#f3f4f6',
  },
  helpfulRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#f9fafb',
  },
  helpfulBtnActive: {
    backgroundColor: '#dcfce7',
  },
  helpfulCount: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  helpfulCountActive: {
    color: '#0b6234',
    fontWeight: '700',
  },
});
