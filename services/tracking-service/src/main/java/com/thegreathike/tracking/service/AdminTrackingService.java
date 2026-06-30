package com.thegreathike.tracking.service;

import com.thegreathike.tracking.dto.AdminTrackingOverview;
import com.thegreathike.tracking.dto.UserVisitStats;
import com.thegreathike.tracking.repository.VisitRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminTrackingService {

    private final VisitRepository visitRepository;

    public AdminTrackingService(VisitRepository visitRepository) {
        this.visitRepository = visitRepository;
    }

    public AdminTrackingOverview overview() {
        return new AdminTrackingOverview(
                visitRepository.count(),
                visitRepository.sumAllGrams(),
                visitRepository.countDistinctUsers()
        );
    }

    public List<UserVisitStats> statsByUser() {
        return visitRepository.statsByUser();
    }
}
