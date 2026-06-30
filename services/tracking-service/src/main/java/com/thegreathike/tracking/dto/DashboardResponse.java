package com.thegreathike.tracking.dto;

import java.util.List;

public record DashboardResponse(
        List<PeriodStats> periods,
        List<VisitResponse> recentVisits,
        List<ConsistencyInfo> consistencyLevels,
        List<StoolColorInfo> stoolColors
) {}
