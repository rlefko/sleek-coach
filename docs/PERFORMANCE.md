# Performance Guide

This document describes performance optimizations, monitoring, and profiling for the Sleek Coach application.

## Performance Targets

| Endpoint | Target | Current |
|----------|--------|---------|
| Check-in creation | < 300ms | TBD |
| Check-in list | < 200ms | TBD |
| Coach chat (first token) | < 2s | TBD |
| Coach insights | < 1s | TBD |
| Mobile app startup | < 3s | TBD |

## Backend Optimizations

### Database Indexes

The following performance indexes are applied (migration `0006_performance_indexes.py`):

- `ix_user_profile_user_id` - User profile lookups
- `ix_user_goal_user_id` - User goal lookups
- `ix_diet_preferences_user_id` - Diet preference lookups
- `ix_ai_session_status` - Active session filtering
- `ix_ai_session_user_status` - User's active sessions
- `ix_check_in_date` - Date range queries
- `ix_nutrition_day_date` - Nutrition date range queries
- `ix_ai_tool_call_log_created_at` - Tool call time analysis

### Redis Caching

Tool results are cached in Redis with the following TTLs:

| Tool | Cache TTL | Description |
|------|-----------|-------------|
| `get_user_profile` | 5 min | User profile rarely changes |
| `get_recent_checkins` | 1 min | Recent check-in data |
| `get_weight_trend` | 5 min | Trend analysis |
| `get_nutrition_summary` | 2 min | Nutrition averages |
| `calculate_tdee` | 10 min | TDEE calculation |
| `get_adherence_metrics` | 5 min | Adherence statistics |

### AI Token Optimization

Token usage is optimized through:

1. **Compact Context Summary**: Reduced context format saves ~40% tokens
2. **Limited History**: Last 6 messages (3 rounds) instead of 10
3. **Tool Result Caching**: Cached tool calls avoid redundant LLM token usage

Example compact context:
```
Profile: User, 175cm, male, moderate | Goal: fat_loss, target 80kg, moderate | Weight: 85kg (down 0.5kg/wk) | Adherence: 85% check-ins, 7d streak | Targets: 2200 cal, 180g P, 200g C, 70g F
```

## Mobile Optimizations

### Query Client Configuration

- **GC Time**: 4 hours (reduced from 24h for mobile memory)
- **Stale Times**: Query-specific (5-30 minutes)
- **Selective Invalidation**: Only invalidates stale queries on reconnect

### Chat Store Limits

- **Max messages per session**: 200 (100 rounds)
- **Max sessions retained**: 50
- **FIFO cleanup**: Old messages pruned automatically

### Bundle Analysis

Run bundle analysis:
```bash
cd apps/mobile
npm run bundle:analyze
```

This generates a visual bundle report showing:
- Package sizes
- Duplicate dependencies
- Optimization opportunities

## Performance Monitoring

### Request Timing

All requests include `X-Response-Time` header with millisecond timing.

Slow requests (>500ms) are logged with:
- Path and method
- Duration in milliseconds
- Status code
- Request ID

### Monitored Endpoints

The following endpoints have detailed performance logging:
- `/api/v1/coach/chat`
- `/api/v1/coach/chat/stream`
- `/api/v1/coach/plan`
- `/api/v1/coach/insights`
- `/api/v1/checkins`
- `/api/v1/nutrition`

### Log Analysis

Search for slow requests:
```bash
# Find slow requests in logs
grep "slow_request" logs/app.log

# Analyze coach chat performance
grep "request_completed" logs/app.log | grep "coach/chat"
```

## Profiling

### Backend Profiling

For detailed profiling, use cProfile:

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()
# ... code to profile ...
profiler.disable()
stats = pstats.Stats(profiler).sort_stats('cumulative')
stats.print_stats(20)
```

### Database Query Analysis

Enable SQL logging in development:
```python
# In config.py
database_echo: bool = True  # Enable SQL echo
```

### Mobile Performance

React Native performance can be analyzed with:
1. React DevTools Profiler
2. Flipper performance plugins
3. Systrace (Android) / Instruments (iOS)

## Best Practices

### Backend

1. **Avoid N+1 queries**: Use `selectinload` for relationships
2. **Cache aggressively**: Use Redis for repeated tool calls
3. **Optimize context**: Use compact summary format
4. **Limit history**: Keep conversation history minimal

### Mobile

1. **Memoize components**: Use `React.memo` for expensive renders
2. **Virtualize lists**: Use FlatList with performance props
3. **Limit cache size**: Reduce gcTime for mobile memory
4. **Selective invalidation**: Don't invalidate all queries

## Troubleshooting

### High Latency on Coach Chat

1. Check Redis cache hit rate in logs
2. Verify database indexes exist
3. Review conversation history size
4. Check OpenAI API latency

### Mobile Memory Issues

1. Check chat store message count
2. Verify query client gcTime
3. Review image caching behavior
4. Check for component re-render loops

### Database Performance

1. Run `EXPLAIN ANALYZE` on slow queries
2. Check index usage with `pg_stat_user_indexes`
3. Review connection pool settings
4. Monitor lock contention
