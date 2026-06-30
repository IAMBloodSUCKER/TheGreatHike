package com.thegreathike.tracking.controller;

import com.thegreathike.tracking.config.AuthContext;
import com.thegreathike.tracking.dto.CreateVisitRequest;
import com.thegreathike.tracking.dto.DashboardResponse;
import com.thegreathike.tracking.dto.VisitResponse;
import com.thegreathike.tracking.dto.VolumePreview;
import com.thegreathike.tracking.service.VisitService;
import com.thegreathike.tracking.service.VolumePreviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final VisitService visitService;
    private final VolumePreviewService volumePreviewService;

    public TrackingController(VisitService visitService, VolumePreviewService volumePreviewService) {
        this.visitService = visitService;
        this.volumePreviewService = volumePreviewService;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(HttpServletRequest request) {
        UUID userId = AuthContext.requireUserId(request);
        return visitService.dashboard(userId);
    }

    @PostMapping("/visits")
    public VisitResponse create(@Valid @RequestBody CreateVisitRequest body, HttpServletRequest request) {
        UUID userId = AuthContext.requireUserId(request);
        return visitService.create(userId, body);
    }

    @DeleteMapping("/visits/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, HttpServletRequest request) {
        UUID userId = AuthContext.requireUserId(request);
        visitService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/volume-preview")
    public VolumePreview volumePreview(
            @RequestParam(name = "grams") int grams,
            @RequestParam(name = "seed", required = false) String seed,
            HttpServletRequest request) {
        AuthContext.requireUserId(request);
        return volumePreviewService.build(grams, seed);
    }

    @GetMapping("/visits")
    public List<VisitResponse> history(
            @RequestParam(name = "from", required = false) Instant from,
            @RequestParam(name = "to", required = false) Instant to,
            HttpServletRequest request) {
        UUID userId = AuthContext.requireUserId(request);
        Instant fromTs = from != null ? from : Instant.now().minusSeconds(86400L * 30);
        Instant toTs = to != null ? to : Instant.now().plusSeconds(60);
        return visitService.history(userId, fromTs, toTs);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(name = "from", required = false) Instant from,
            @RequestParam(name = "to", required = false) Instant to,
            HttpServletRequest request) {
        UUID userId = AuthContext.requireUserId(request);
        Instant fromTs = from != null ? from : Instant.now().minusSeconds(86400L * 365);
        Instant toTs = to != null ? to : Instant.now().plusSeconds(60);
        String csv = visitService.exportCsv(userId, fromTs, toTs);
        byte[] body = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=thegreathike-export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }
}
