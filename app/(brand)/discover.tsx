import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandTheme, creatorTheme, brandColors, fonts, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import type { CreatorProfile, Profile, SwipeDirection } from '../../lib/types/database';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - spacing.xxl * 2;
const CARD_H = Math.round(CARD_W * 1.35);
const PAGE_SIZE = 10;
const H_THRESHOLD = 120;
const V_THRESHOLD = -80;

const FILTERS = ['All', 'Fitness', 'Food', 'Lifestyle', 'Fashion', 'Beauty', 'Tech', 'Travel'];
const AVATAR_PALETTE = ['#7B2FBE', '#D64045', '#00A896', '#F18F01', '#5C6BC0', '#E07850'];
const STATIC_SCORE = 87;
const STATIC_REASON = 'Great fit for your target audience';

type CreatorCard = CreatorProfile & { profile: Profile };

const bt = brandTheme.colors;
const ct = creatorTheme.colors;

// ── Module-level helpers ──

function avatarColor(handle: string): string {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = handle.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

async function doFetch(
  offset: number,
  filter: string,
  excluded: string[],
): Promise<CreatorCard[]> {
  let q = supabase
    .from('creator_profiles')
    .select('*, profile:profiles!inner(id, full_name, avatar_url, city, state, user_type, onboarding_completed)')
    .eq('profiles.user_type', 'creator')
    .eq('profiles.onboarding_completed', true)
    .range(offset, offset + PAGE_SIZE - 1);

  if (excluded.length > 0) q = q.not('id', 'in', `(${excluded.join(',')})`);
  if (filter !== 'All') q = q.contains('niche_tags', [filter]);

  const { data } = await q;
  return (data as unknown as CreatorCard[]) ?? [];
}

// ── Card content (rendered for all 3 visible stack positions) ──

function CardContent({ card }: { card: CreatorCard }) {
  const total = (card.instagram_followers ?? 0) + (card.tiktok_followers ?? 0);
  const name = card.display_name || card.profile.full_name || 'Creator';
  const color = avatarColor(card.handle);
  const visibleNiches = card.niche_tags.slice(0, 3);
  const extra = card.niche_tags.length - 3;

  return (
    <>
      <View style={styles.avatarArea}>
        <View style={[styles.avatarCircle, { backgroundColor: color }]}>
          <Text style={styles.avatarInitials}>{initials(name)}</Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>⚡ {STATIC_SCORE}% Match</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.creatorName} numberOfLines={1}>{name}</Text>
        <Text style={styles.creatorSub} numberOfLines={1}>
          @{card.handle}{card.profile.city ? `  ·  ${card.profile.city}` : ''}
        </Text>

        {card.niche_tags.length > 0 && (
          <View style={styles.nicheRow}>
            {visibleNiches.map(n => (
              <View key={n} style={styles.nicheChip}>
                <Text style={styles.nicheChipText}>{n}</Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={styles.nicheChip}>
                <Text style={styles.nicheChipText}>+{extra} more</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{total > 0 ? fmt(total) : '—'}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {card.engagement_rate != null ? `${card.engagement_rate}%` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {card.rate_post != null ? `$${card.rate_post}` : '—'}
            </Text>
            <Text style={styles.statLabel}>Per post</Text>
          </View>
        </View>

        <Text style={styles.aiReason} numberOfLines={2}>✦ {STATIC_REASON}</Text>
      </View>
    </>
  );
}

// ── Main screen ──

export default function BrandDiscover() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [cards, setCards] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  // Refs avoid stale closures in async callbacks
  const cardsRef = useRef<CreatorCard[]>([]);
  const swipedIdsRef = useRef<string[]>([]);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const exhaustedRef = useRef(false);
  const activeFilterRef = useRef('All');

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // ── Data ──

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || exhaustedRef.current) return;
    loadingMoreRef.current = true;
    const results = await doFetch(
      offsetRef.current,
      activeFilterRef.current,
      swipedIdsRef.current,
    );
    offsetRef.current += results.length;
    if (results.length < PAGE_SIZE) exhaustedRef.current = true;
    setCards(prev => [...prev, ...results]);
    loadingMoreRef.current = false;
  }, []);

  async function initialLoad(filter: string) {
    setLoading(true);
    exhaustedRef.current = false;
    loadingMoreRef.current = false;
    offsetRef.current = 0;
    activeFilterRef.current = filter;

    const { data: swipeData } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', user!.id);
    const excluded = (swipeData ?? []).map((r: { swiped_id: string }) => r.swiped_id);
    swipedIdsRef.current = excluded;

    const results = await doFetch(0, filter, excluded);
    offsetRef.current = results.length;
    if (results.length < PAGE_SIZE) exhaustedRef.current = true;
    setCards(results);
    setLoading(false);
  }

  useEffect(() => {
    if (user) initialLoad('All');
  }, [user]);

  // ── Swipe handler (called from JS thread via runOnJS) ──

  const handleSwiped = useCallback((direction: SwipeDirection) => {
    const creator = cardsRef.current[0];
    if (!creator || !user) return;

    swipedIdsRef.current = [...swipedIdsRef.current, creator.id];
    setCards(prev => prev.slice(1));
    translateX.value = 0;
    translateY.value = 0;

    // Auto-load when stack gets low
    if (cardsRef.current.length - 1 <= 2) loadMore();

    // Fire-and-forget persist
    supabase.from('swipes').insert({
      swiper_id: user.id,
      swiped_id: creator.id,
      direction,
      match_score: STATIC_SCORE,
      match_reason: STATIC_REASON,
    });
  }, [user, loadMore]);

  function triggerSwipe(direction: SwipeDirection) {
    if (cardsRef.current.length === 0) return;
    if (direction === 'super') {
      translateY.value = withTiming(-900, { duration: 350 }, (done) => {
        if (done) runOnJS(handleSwiped)(direction);
      });
    } else {
      translateX.value = withTiming(
        direction === 'like' ? 600 : -600,
        { duration: 350 },
        (done) => { if (done) runOnJS(handleSwiped)(direction); },
      );
    }
  }

  // ── Gesture ──

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const isSuper = e.translationY < V_THRESHOLD && Math.abs(e.translationX) < 100;
      if (isSuper) {
        translateY.value = withTiming(-900, { duration: 350 }, (done) => {
          if (done) runOnJS(handleSwiped)('super');
        });
      } else if (e.translationX > H_THRESHOLD) {
        translateX.value = withTiming(600, { duration: 350 }, (done) => {
          if (done) runOnJS(handleSwiped)('like');
        });
      } else if (e.translationX < -H_THRESHOLD) {
        translateX.value = withTiming(-600, { duration: 350 }, (done) => {
          if (done) runOnJS(handleSwiped)('pass');
        });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  // ── Animated styles ──

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value, [-200, 200], [-15, 15], Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, H_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-H_THRESHOLD, -20], [1, 0], Extrapolation.CLAMP),
  }));
  const superOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [V_THRESHOLD, -20], [1, 0], Extrapolation.CLAMP),
  }));

  const showEmpty = !loading && cards.length === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, f === activeFilter && styles.filterChipActive]}
            onPress={() => {
              setActiveFilter(f);
              initialLoad(f);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, f === activeFilter && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Card stack */}
      <View style={styles.stackArea}>
        {loading ? (
          // Skeleton cards
          [2, 1, 0].map(i => (
            <View
              key={i}
              style={[
                styles.card,
                styles.skeletonCard,
                {
                  zIndex: 10 - i,
                  transform: [
                    { scale: i === 0 ? 1 : i === 1 ? 0.95 : 0.9 },
                    { translateY: i === 0 ? 0 : i === 1 ? 8 : 16 },
                  ],
                },
              ]}
            />
          ))
        ) : showEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>You've seen everyone for now.</Text>
            <Text style={styles.emptySub}>Check back soon as new creators join.</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => initialLoad(activeFilter)}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Render back-to-front so index 0 ends up on top */}
            {cards[2] && (
              <View style={[styles.card, { zIndex: 1, transform: [{ scale: 0.9 }, { translateY: 16 }] }]}>
                <CardContent card={cards[2]} />
              </View>
            )}
            {cards[1] && (
              <View style={[styles.card, { zIndex: 2, transform: [{ scale: 0.95 }, { translateY: 8 }] }]}>
                <CardContent card={cards[1]} />
              </View>
            )}
            {cards[0] && (
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.card, { zIndex: 3 }, topCardStyle]}>
                  <CardContent card={cards[0]} />
                  <Animated.View style={[styles.overlay, styles.overlayLike, likeOpacity]} pointerEvents="none">
                    <Text style={styles.overlayLabel}>LIKE</Text>
                  </Animated.View>
                  <Animated.View style={[styles.overlay, styles.overlayPass, passOpacity]} pointerEvents="none">
                    <Text style={styles.overlayLabel}>PASS</Text>
                  </Animated.View>
                  <Animated.View style={[styles.overlay, styles.overlaySuper, superOpacity]} pointerEvents="none">
                    <Text style={styles.overlayLabel}>SUPER</Text>
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            )}
          </>
        )}
      </View>

      {/* Action buttons */}
      {!loading && !showEmpty && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => triggerSwipe('pass')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.superBtn]}
            onPress={() => triggerSwipe('super')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => triggerSwipe('like')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: bt.background,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.headlineBlack,
    fontSize: 28,
    color: bt.text,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: bt.border,
    backgroundColor: bt.surface,
  },
  filterChipActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  filterChipText: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: bt.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  stackArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    backgroundColor: ct.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ct.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  skeletonCard: {
    backgroundColor: bt.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  overlayLike: { backgroundColor: 'rgba(0,200,100,0.35)' },
  overlayPass: { backgroundColor: 'rgba(220,50,50,0.35)' },
  overlaySuper: { backgroundColor: 'rgba(78,0,191,0.40)' },
  overlayLabel: {
    fontFamily: fonts.headlineBlack,
    fontSize: 42,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  avatarArea: {
    height: CARD_H * 0.42,
    backgroundColor: ct.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: fonts.headlineBlack,
    fontSize: 32,
    color: '#FFFFFF',
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: brandColors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  matchBadgeText: {
    fontFamily: fonts.headline,
    fontSize: 12,
    color: '#FFFFFF',
  },
  cardBody: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  creatorName: {
    fontFamily: fonts.headlineBlack,
    fontSize: 22,
    color: ct.text,
    lineHeight: 28,
  },
  creatorSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: ct.textMuted,
    marginTop: -spacing.sm,
  },
  nicheRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  nicheChip: {
    backgroundColor: ct.card2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  nicheChipText: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: ct.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ct.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.headlineBlack,
    fontSize: 16,
    color: ct.text,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: ct.textMuted,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: ct.border,
  },
  aiReason: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brandColors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.headlineBlack,
    fontSize: 20,
    color: bt.text,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: bt.textMuted,
    textAlign: 'center',
  },
  refreshBtn: {
    marginTop: spacing.sm,
    backgroundColor: brandColors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  refreshBtnText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  passBtn: {
    borderWidth: 2,
    borderColor: '#FF4D6D',
  },
  superBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: brandColors.primary,
  },
  likeBtn: {
    borderWidth: 2,
    borderColor: '#00C864',
  },
  actionIcon: {
    fontSize: 22,
  },
});
